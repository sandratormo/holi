import { supabaseAdmin } from './supabase.js'

export async function createDatabaseTables() {
  if (!supabaseAdmin) {
    console.error('Service role key required for table creation')
    return false
  }

  try {
    // Try to create a simple RPC function first to test if we can execute SQL
    const createRPCFunction = `
      CREATE OR REPLACE FUNCTION create_adoptacachorros_tables()
      RETURNS text AS $$
      BEGIN
        -- Create provinces table
        CREATE TABLE IF NOT EXISTS provinces (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          region TEXT NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create cities table
        CREATE TABLE IF NOT EXISTS cities (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          province_id TEXT NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create dog_listings table
        CREATE TABLE IF NOT EXISTS dog_listings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          "dogName" TEXT NOT NULL,
          age INTEGER NOT NULL,
          size TEXT NOT NULL,
          gender TEXT NOT NULL,
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
          "listingType" TEXT NOT NULL DEFAULT 'adoption',
          status TEXT DEFAULT 'active',
          user_id UUID,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create messages table
        CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          listing_id UUID NOT NULL,
          "senderName" TEXT NOT NULL,
          "senderEmail" TEXT NOT NULL,
          "senderPhone" TEXT,
          message TEXT NOT NULL,
          "isRead" BOOLEAN DEFAULT false,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        RETURN 'Tables created successfully';
      END;
      $$ LANGUAGE plpgsql;
    `

    // First create the RPC function
    const { error: rpcError } = await supabaseAdmin.rpc('exec', { sql: createRPCFunction })
    
    if (rpcError) {
      console.error('Error creating RPC function:', rpcError)
      return false
    }

    // Then call the RPC function to create tables
    const { data, error } = await supabaseAdmin.rpc('create_adoptacachorros_tables')
    
    if (error) {
      console.error('Error calling table creation RPC:', error)
      return false
    }

    console.log('Database setup result:', data)
    return true
    
  } catch (error) {
    console.error('Error in database setup:', error)
    return false
  }
}