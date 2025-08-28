import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations (table creation)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// Initialize database tables and data
export const initializeDatabase = async () => {
  try {
    // Check if provinces exist
    const { data: existingProvinces } = await supabase
      .from('provinces')
      .select('id')
      .limit(1)
    
    if (!existingProvinces || existingProvinces.length === 0) {
      await initializeSpanishData()
    }
    
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization error:', error)
  }
}

// Initialize Spanish provinces and major cities
export const initializeSpanishData = async () => {
  const provinces = [
    { id: 'madrid', name: 'Madrid', region: 'Comunidad de Madrid' },
    { id: 'barcelona', name: 'Barcelona', region: 'Cataluña' },
    { id: 'valencia', name: 'Valencia', region: 'Comunidad Valenciana' },
    { id: 'sevilla', name: 'Sevilla', region: 'Andalucía' },
    { id: 'bilbao', name: 'Vizcaya', region: 'País Vasco' },
    { id: 'murcia', name: 'Murcia', region: 'Región de Murcia' },
    { id: 'palma', name: 'Baleares', region: 'Islas Baleares' },
    { id: 'las-palmas', name: 'Las Palmas', region: 'Canarias' },
    { id: 'alicante', name: 'Alicante', region: 'Comunidad Valenciana' },
    { id: 'cordoba', name: 'Córdoba', region: 'Andalucía' }
  ]

  const cities = [
    { id: 'madrid-city', name: 'Madrid', province_id: 'madrid' },
    { id: 'barcelona-city', name: 'Barcelona', province_id: 'barcelona' },
    { id: 'valencia-city', name: 'Valencia', province_id: 'valencia' },
    { id: 'sevilla-city', name: 'Sevilla', province_id: 'sevilla' },
    { id: 'bilbao-city', name: 'Bilbao', province_id: 'bilbao' },
    { id: 'murcia-city', name: 'Murcia', province_id: 'murcia' },
    { id: 'palma-city', name: 'Palma de Mallorca', province_id: 'palma' },
    { id: 'las-palmas-city', name: 'Las Palmas', province_id: 'las-palmas' },
    { id: 'alicante-city', name: 'Alicante', province_id: 'alicante' },
    { id: 'cordoba-city', name: 'Córdoba', province_id: 'cordoba' }
  ]

  try {
    // Insert provinces
    const { error: provincesError } = await supabase
      .from('provinces')
      .insert(provinces)

    if (provincesError && !provincesError.message.includes('duplicate key')) {
      throw provincesError
    }

    // Insert cities
    const { error: citiesError } = await supabase
      .from('cities')
      .insert(cities)

    if (citiesError && !citiesError.message.includes('duplicate key')) {
      throw citiesError
    }

  } catch (error) {
    console.error('Error initializing Spanish data:', error)
    throw error
  }
}