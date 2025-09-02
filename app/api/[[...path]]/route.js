import { NextResponse } from 'next/server'
import { supabase, initializeDatabase, initializeSpanishData } from '../../../lib/supabase.js'
import { createDatabaseTables } from '../../../lib/database-setup.js'
import { v4 as uuidv4 } from 'uuid'

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    // Initialize database on first request
    await initializeDatabase()

    // Root endpoint
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "adoptaunpana.es API" }))
    }

    // Initialize database tables (one-time setup)
    if (route === '/setup' && method === 'POST') {
      const result = await createDatabaseTables()
      if (result) {
        await initializeSpanishData()
        return handleCORS(NextResponse.json({ message: "Database setup completed successfully" }))
      } else {
        return handleCORS(NextResponse.json(
          { error: "Database setup failed" }, 
          { status: 500 }
        ))
      }
    }

    // PROVINCES ENDPOINTS
    if (route === '/provinces' && method === 'GET') {
      const { data, error } = await supabase
        .from('provinces')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching provinces:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to fetch provinces' }, { status: 500 }))
      }

      return handleCORS(NextResponse.json(data || []))
    }

    // CITIES ENDPOINTS
    if (route === '/cities' && method === 'GET') {
      const url = new URL(request.url)
      const provinceId = url.searchParams.get('province')

      let query = supabase.from('cities').select('*').order('name', { ascending: true })
      
      if (provinceId) {
        query = query.eq('province_id', provinceId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching cities:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to fetch cities' }, { status: 500 }))
      }

      return handleCORS(NextResponse.json(data || []))
    }

    // DOG LISTINGS ENDPOINTS
    if (route === '/dogs' && method === 'GET') {
      const url = new URL(request.url)
      const province = url.searchParams.get('province')
      const city = url.searchParams.get('city')
      const size = url.searchParams.get('size')
      const gender = url.searchParams.get('gender')
      const urgent = url.searchParams.get('urgent') === 'true'

      let query = supabase
        .from('dog_listings')
        .select(`
          *,
          provinces:province_id(name),
          cities:city_id(name)
        `)
        .eq('status', 'active')
        .order('isUrgent', { ascending: false })
        .order('createdAt', { ascending: false })

      if (province) query = query.eq('province_id', province)
      if (city) query = query.eq('city_id', city)
      if (size) query = query.eq('size', size)
      if (gender) query = query.eq('gender', gender)
      if (urgent) query = query.eq('isUrgent', true)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching dog listings:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to fetch dog listings' }, { status: 500 }))
      }

      return handleCORS(NextResponse.json(data || []))
    }

    if (route === '/dogs' && method === 'POST') {
      const body = await request.json()

      // Validate required fields
      const requiredFields = ['title', 'dogName', 'description', 'age', 'size', 'gender', 'contactName', 'contactEmail', 'province', 'city']
      for (const field of requiredFields) {
        if (!body[field]) {
          return handleCORS(NextResponse.json(
            { error: `Missing required field: ${field}` }, 
            { status: 400 }
          ))
        }
      }

      const dogListing = {
        id: uuidv4(),
        title: body.title.trim(),
        description: body.description.trim(),
        dogName: body.dogName.trim(),
        age: parseInt(body.age),
        size: body.size,
        gender: body.gender,
        breed: body.breed?.trim() || null,
        isUrgent: Boolean(body.isUrgent),
        isVaccinated: Boolean(body.isVaccinated),
        isNeutered: Boolean(body.isNeutered),
        contactEmail: body.contactEmail.trim(),
        contactPhone: body.contactPhone?.trim() || null,
        contactName: body.contactName.trim(),
        province_id: body.province,
        city_id: body.city,
        imageUrls: body.imageUrls || [],
        listingType: 'adoption',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('dog_listings')
        .insert([dogListing])
        .select()
        .single()

      if (error) {
        console.error('Error creating dog listing:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to create listing' }, { status: 500 }))
      }

      return handleCORS(NextResponse.json(data))
    }

    // Get single dog listing
    if (route.startsWith('/dogs/') && method === 'GET') {
      const dogId = route.split('/')[2]

      const { data, error } = await supabase
        .from('dog_listings')
        .select(`
          *,
          provinces:province_id(name),
          cities:city_id(name)
        `)
        .eq('id', dogId)
        .single()

      if (error) {
        console.error('Error fetching dog listing:', error)
        return handleCORS(NextResponse.json({ error: 'Dog not found' }, { status: 404 }))
      }

      return handleCORS(NextResponse.json(data))
    }

    // Update dog listing
    if (route.startsWith('/dogs/') && method === 'PUT') {
      const dogId = route.split('/')[2]
      const body = await request.json()

      const updates = {
        ...body,
        updatedAt: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('dog_listings')
        .update(updates)
        .eq('id', dogId)
        .select()
        .single()

      if (error) {
        console.error('Error updating dog listing:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to update listing' }, { status: 500 }))
      }

      return handleCORS(NextResponse.json(data))
    }

    // Delete dog listing
    if (route.startsWith('/dogs/') && method === 'DELETE') {
      const dogId = route.split('/')[2]

      const { error } = await supabase
        .from('dog_listings')
        .delete()
        .eq('id', dogId)

      if (error) {
        console.error('Error deleting dog listing:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 }))
      }

      return handleCORS(NextResponse.json({ message: 'Listing deleted successfully' }))
    }

    // MESSAGES ENDPOINTS
    if (route === '/messages' && method === 'GET') {
      const url = new URL(request.url)
      const listingId = url.searchParams.get('listing_id')

      let query = supabase
        .from('messages')
        .select(`
          *,
          dog_listings:listing_id(dogName, contactEmail)
        `)
        .order('createdAt', { ascending: false })

      if (listingId) {
        query = query.eq('listing_id', listingId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching messages:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 }))
      }

      return handleCORS(NextResponse.json(data || []))
    }

    if (route === '/messages' && method === 'POST') {
      const body = await request.json()

      // Validate required fields
      const requiredFields = ['listing_id', 'senderName', 'senderEmail', 'message']
      for (const field of requiredFields) {
        if (!body[field]) {
          return handleCORS(NextResponse.json(
            { error: `Missing required field: ${field}` }, 
            { status: 400 }
          ))
        }
      }

      const message = {
        id: uuidv4(),
        listing_id: body.listing_id,
        senderName: body.senderName.trim(),
        senderEmail: body.senderEmail.trim(),
        senderPhone: body.senderPhone?.trim() || null,
        message: body.message.trim(),
        isRead: false,
        createdAt: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([message])
        .select()
        .single()

      if (error) {
        console.error('Error creating message:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to send message' }, { status: 500 }))
      }

      return handleCORS(NextResponse.json(data))
    }

    // Mark message as read
    if (route.startsWith('/messages/') && route.endsWith('/read') && method === 'PUT') {
      const messageId = route.split('/')[2]

      const { data, error } = await supabase
        .from('messages')
        .update({ isRead: true })
        .eq('id', messageId)
        .select()
        .single()

      if (error) {
        console.error('Error marking message as read:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to mark message as read' }, { status: 500 }))
      }

      return handleCORS(NextResponse.json(data))
    }

    // SEARCH ENDPOINTS
    if (route === '/search' && method === 'GET') {
      const url = new URL(request.url)
      const query = url.searchParams.get('q')
      const province = url.searchParams.get('province')
      const size = url.searchParams.get('size')
      const gender = url.searchParams.get('gender')

      let supabaseQuery = supabase
        .from('dog_listings')
        .select(`
          *,
          provinces:province_id(name),
          cities:city_id(name)
        `)
        .eq('status', 'active')

      // Text search in multiple fields
      if (query) {
        supabaseQuery = supabaseQuery.or(`dogName.ilike.%${query}%,description.ilike.%${query}%,breed.ilike.%${query}%`)
      }

      if (province) supabaseQuery = supabaseQuery.eq('province_id', province)
      if (size) supabaseQuery = supabaseQuery.eq('size', size)
      if (gender) supabaseQuery = supabaseQuery.eq('gender', gender)

      supabaseQuery = supabaseQuery
        .order('isUrgent', { ascending: false })
        .order('createdAt', { ascending: false })
        .limit(50)

      const { data, error } = await supabaseQuery

      if (error) {
        console.error('Error searching dogs:', error)
        return handleCORS(NextResponse.json({ error: 'Search failed' }, { status: 500 }))
      }

      return handleCORS(NextResponse.json(data || []))
    }

    // STATS ENDPOINTS
    if (route === '/stats' && method === 'GET') {
      const [
        { count: totalDogs },
        { count: urgentDogs },
        { count: totalMessages },
        { data: dogsByProvince }
      ] = await Promise.all([
        supabase.from('dog_listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('dog_listings').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('isUrgent', true),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase
          .from('dog_listings')
          .select('province_id, provinces:province_id(name)')
          .eq('status', 'active')
      ])

      const provinceStats = {}
      dogsByProvince?.forEach(dog => {
        const provinceName = dog.provinces?.name
        if (provinceName) {
          provinceStats[provinceName] = (provinceStats[provinceName] || 0) + 1
        }
      })

      return handleCORS(NextResponse.json({
        totalDogs: totalDogs || 0,
        urgentDogs: urgentDogs || 0,
        totalMessages: totalMessages || 0,
        dogsByProvince: provinceStats
      }))
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` }, 
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: "Internal server error", details: error.message }, 
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute