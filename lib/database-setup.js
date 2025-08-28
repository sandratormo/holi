import { supabaseAdmin } from './supabase.js'

export async function createDatabaseTables() {
  if (!supabaseAdmin) {
    console.error('Service role key required for table creation')
    return false
  }

  const createTablesSQL = `
-- Drop existing tables if recreating
DROP TABLE IF EXISTS dog_listings CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS cities CASCADE;
DROP TABLE IF EXISTS provinces CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table for authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  "displayName" TEXT,
  "isVerified" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create provinces table (Spanish provinces)
CREATE TABLE provinces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cities table
CREATE TABLE cities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  province_id TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (province_id) REFERENCES provinces(id)
);

-- Create dog_listings table
CREATE TABLE dog_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  "dogName" TEXT NOT NULL,
  age INTEGER NOT NULL, -- in months
  size TEXT NOT NULL CHECK (size IN ('pequeño', 'mediano', 'grande')),
  gender TEXT NOT NULL CHECK (gender IN ('macho', 'hembra')),
  breed TEXT,
  "isUrgent" BOOLEAN DEFAULT false,
  "isVaccinated" BOOLEAN DEFAULT false,
  "isNeutered" BOOLEAN DEFAULT false,
  "contactEmail" TEXT NOT NULL,
  "contactPhone" TEXT,
  "contactName" TEXT NOT NULL,
  province_id TEXT NOT NULL,
  city_id TEXT NOT NULL,
  "imageUrls" JSONB DEFAULT '[]',
  "listingType" TEXT NOT NULL CHECK ("listingType" IN ('adoption', 'foster', 'lost', 'found')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'adopted', 'inactive')),
  user_id UUID,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (province_id) REFERENCES provinces(id),
  FOREIGN KEY (city_id) REFERENCES cities(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create messages table for safe contact
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL,
  "senderName" TEXT NOT NULL,
  "senderEmail" TEXT NOT NULL,
  "senderPhone" TEXT,
  message TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (listing_id) REFERENCES dog_listings(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE dog_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON users FOR UPDATE USING (true);

CREATE POLICY "Allow public read provinces" ON provinces FOR SELECT USING (true);
CREATE POLICY "Allow public insert provinces" ON provinces FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read cities" ON cities FOR SELECT USING (true);
CREATE POLICY "Allow public insert cities" ON cities FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read dog_listings" ON dog_listings FOR SELECT USING (true);
CREATE POLICY "Allow public insert dog_listings" ON dog_listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update dog_listings" ON dog_listings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete dog_listings" ON dog_listings FOR DELETE USING (true);

CREATE POLICY "Allow public read messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update messages" ON messages FOR UPDATE USING (true);

-- Create indexes for performance
CREATE INDEX idx_dog_listings_province ON dog_listings(province_id);
CREATE INDEX idx_dog_listings_city ON dog_listings(city_id);
CREATE INDEX idx_dog_listings_size ON dog_listings(size);
CREATE INDEX idx_dog_listings_age ON dog_listings(age);
CREATE INDEX idx_dog_listings_urgent ON dog_listings("isUrgent");
CREATE INDEX idx_dog_listings_type ON dog_listings("listingType");
CREATE INDEX idx_dog_listings_status ON dog_listings(status);
CREATE INDEX idx_dog_listings_created ON dog_listings("createdAt" DESC);
CREATE INDEX idx_messages_listing ON messages(listing_id);
CREATE INDEX idx_cities_province ON cities(province_id);

-- Auto-update timestamp trigger function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS update_users_timestamp ON users;
CREATE TRIGGER update_users_timestamp
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_dog_listings_timestamp ON dog_listings;
CREATE TRIGGER update_dog_listings_timestamp
  BEFORE UPDATE ON dog_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();
  `

  try {
    const { error } = await supabaseAdmin.rpc('exec', { sql: createTablesSQL })
    
    if (error) {
      // Try alternative approach using individual queries
      console.log('Trying alternative approach for table creation...')
      
      const queries = createTablesSQL
        .split(';')
        .map(q => q.trim())
        .filter(q => q.length > 0)
      
      for (const query of queries) {
        try {
          const { error: queryError } = await supabaseAdmin.rpc('exec', { sql: query })
          if (queryError) {
            console.error('Query error:', queryError, 'for:', query)
          }
        } catch (e) {
          console.error('Individual query error:', e)
        }
      }
    }
    
    return true
  } catch (error) {
    console.error('Error creating tables:', error)
    return false
  }
}