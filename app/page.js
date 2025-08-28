'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Heart, Search, MapPin, Clock, Phone, Mail, Filter, Dog, Shield, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

export default function AdoptaCachorros() {
  const [dogs, setDogs] = useState([])
  const [provinces, setProvinces] = useState([])
  const [cities, setCities] = useState([])
  const [filters, setFilters] = useState({
    province: '',
    city: '',
    size: '',
    gender: '',
    urgent: false
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedDog, setSelectedDog] = useState(null)
  const [showAddListing, setShowAddListing] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [newListing, setNewListing] = useState({
    title: '',
    dogName: '',
    description: '',
    age: '',
    size: '',
    gender: '',
    breed: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    province: '',
    city: '',
    isUrgent: false,
    isVaccinated: false,
    isNeutered: false
  })
  const [contactForm, setContactForm] = useState({
    senderName: '',
    senderEmail: '',
    senderPhone: '',
    message: ''
  })

  // Fetch initial data
  useEffect(() => {
    fetchData()
  }, [])

  // Fetch filtered cities when province changes
  useEffect(() => {
    if (filters.province) {
      fetchCitiesByProvince(filters.province)
    }
  }, [filters.province])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch dogs, provinces, and cities
      const [dogsRes, provincesRes, citiesRes] = await Promise.all([
        fetch('/api/dogs'),
        fetch('/api/provinces'), 
        fetch('/api/cities')
      ])

      if (dogsRes.ok) {
        const dogsData = await dogsRes.json()
        setDogs(dogsData)
      }

      if (provincesRes.ok) {
        const provincesData = await provincesRes.json()
        setProvinces(provincesData)
      }

      if (citiesRes.ok) {
        const citiesData = await citiesRes.json()
        setCities(citiesData)
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const fetchCitiesByProvince = async (provinceId) => {
    try {
      const response = await fetch(`/api/cities?province=${provinceId}`)
      if (response.ok) {
        const citiesData = await response.json()
        setCities(citiesData)
      }
    } catch (error) {
      console.error('Error fetching cities:', error)
    }
  }

  const filteredDogs = dogs.filter(dog => {
    const matchesSearch = dog.dogName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dog.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dog.breed?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesProvince = !filters.province || dog.province_id === filters.province
    const matchesCity = !filters.city || dog.city_id === filters.city
    const matchesSize = !filters.size || dog.size === filters.size
    const matchesGender = !filters.gender || dog.gender === filters.gender
    const matchesUrgent = !filters.urgent || dog.isUrgent

    return matchesSearch && matchesProvince && matchesCity && matchesSize && matchesGender && matchesUrgent
  })

  const handleAddListing = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/dogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newListing,
          age: parseInt(newListing.age)
        })
      })

      if (response.ok) {
        toast.success('¡Anuncio publicado correctamente!')
        setShowAddListing(false)
        setNewListing({
          title: '', dogName: '', description: '', age: '', size: '', gender: '',
          breed: '', contactName: '', contactEmail: '', contactPhone: '',
          province: '', city: '', isUrgent: false, isVaccinated: false, isNeutered: false
        })
        fetchData()
      } else {
        toast.error('Error al publicar el anuncio')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al publicar el anuncio')
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: selectedDog.id,
          ...contactForm
        })
      })

      if (response.ok) {
        toast.success('¡Mensaje enviado correctamente!')
        setShowContact(false)
        setContactForm({ senderName: '', senderEmail: '', senderPhone: '', message: '' })
      } else {
        toast.error('Error al enviar el mensaje')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al enviar el mensaje')
    }
  }

  const getAgeDisplay = (months) => {
    if (months < 12) return `${months} meses`
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    return remainingMonths > 0 ? `${years} años ${remainingMonths} meses` : `${years} años`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white shadow-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">AdoptaCachorros</h1>
            </div>
            <Button 
              onClick={() => setShowAddListing(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              Publicar Anuncio
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Dale una segunda oportunidad a un amigo fiel
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Miles de perros esperan un hogar en España. Encuentra tu compañero perfecto.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="flex flex-col items-center">
              <Dog className="w-12 h-12 mb-4 opacity-90" />
              <h3 className="text-lg font-semibold">+500 perros</h3>
              <p className="opacity-80">disponibles para adopción</p>
            </div>
            <div className="flex flex-col items-center">
              <Shield className="w-12 h-12 mb-4 opacity-90" />
              <h3 className="text-lg font-semibold">Verificado</h3>
              <p className="opacity-80">Contacto seguro y verificado</p>
            </div>
            <div className="flex flex-col items-center">
              <CheckCircle className="w-12 h-12 mb-4 opacity-90" />
              <h3 className="text-lg font-semibold">Gratis</h3>
              <p className="opacity-80">Plataforma 100% gratuita</p>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-6 gap-4 items-end">
            <div className="md:col-span-2">
              <Label>Buscar por nombre o raza</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar perros..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Provincia</Label>
              <Select 
                value={filters.province} 
                onValueChange={(value) => setFilters({...filters, province: value === 'all' ? '' : value, city: ''})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las provincias</SelectItem>
                  {provinces.map(province => (
                    <SelectItem key={province.id} value={province.id}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Ciudad</Label>
              <Select 
                value={filters.city} 
                onValueChange={(value) => setFilters({...filters, city: value === 'all' ? '' : value})}
                disabled={!filters.province}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las ciudades</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tamaño</Label>
              <Select 
                value={filters.size} 
                onValueChange={(value) => setFilters({...filters, size: value === 'all' ? '' : value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tamaños</SelectItem>
                  <SelectItem value="pequeño">Pequeño</SelectItem>
                  <SelectItem value="mediano">Mediano</SelectItem>
                  <SelectItem value="grande">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sexo</Label>
              <Select 
                value={filters.gender} 
                onValueChange={(value) => setFilters({...filters, gender: value === 'all' ? '' : value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Macho y hembra</SelectItem>
                  <SelectItem value="macho">Macho</SelectItem>
                  <SelectItem value="hembra">Hembra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-4">
              <Button
                variant={filters.urgent ? "default" : "outline"}
                onClick={() => setFilters({...filters, urgent: !filters.urgent})}
                className={filters.urgent ? "bg-red-600 hover:bg-red-700" : ""}
              >
                <Clock className="w-4 h-4 mr-2" />
                Solo urgentes
              </Button>
            </div>
            <p className="text-gray-600">
              {filteredDogs.length} perros encontrados
            </p>
          </div>
        </div>
      </section>

      {/* Dogs Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando perros...</p>
            </div>
          ) : filteredDogs.length === 0 ? (
            <div className="text-center py-12">
              <Dog className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No se encontraron perros
              </h3>
              <p className="text-gray-600">
                Prueba ajustando los filtros de búsqueda
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDogs.map(dog => (
                <Card key={dog.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <Image
                      src="https://images.unsplash.com/photo-1546238232-20216dec9f72?w=400&h=300&fit=crop"
                      alt={dog.dogName}
                      width={400}
                      height={300}
                      className="w-full h-48 object-cover"
                    />
                    {dog.isUrgent && (
                      <Badge className="absolute top-2 right-2 bg-red-600">
                        URGENTE
                      </Badge>
                    )}
                  </div>
                  
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{dog.dogName}</CardTitle>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-1" />
                      {cities.find(c => c.id === dog.city_id)?.name}, {provinces.find(p => p.id === dog.province_id)?.name}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Edad: {getAgeDisplay(dog.age)}</span>
                      <span>Tamaño: {dog.size}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Sexo: {dog.gender}</span>
                      {dog.breed && <span>Raza: {dog.breed}</span>}
                    </div>
                    
                    <div className="flex gap-1 mt-2">
                      {dog.isVaccinated && (
                        <Badge variant="secondary" className="text-xs">Vacunado</Badge>
                      )}
                      {dog.isNeutered && (
                        <Badge variant="secondary" className="text-xs">Esterilizado</Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                      {dog.description}
                    </p>

                    <Button 
                      className="w-full mt-4 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setSelectedDog(dog)
                        setShowContact(true)
                      }}
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Contactar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Add Listing Dialog */}
      <Dialog open={showAddListing} onOpenChange={setShowAddListing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Publicar Anuncio de Adopción</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAddListing} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Título del anuncio *</Label>
                <Input
                  required
                  value={newListing.title}
                  onChange={(e) => setNewListing({...newListing, title: e.target.value})}
                  placeholder="Ej: Cachorro busca familia cariñosa"
                />
              </div>
              
              <div>
                <Label>Nombre del perro *</Label>
                <Input
                  required
                  value={newListing.dogName}
                  onChange={(e) => setNewListing({...newListing, dogName: e.target.value})}
                  placeholder="Ej: Max"
                />
              </div>
            </div>

            <div>
              <Label>Descripción *</Label>
              <Textarea
                required
                value={newListing.description}
                onChange={(e) => setNewListing({...newListing, description: e.target.value})}
                placeholder="Describe la personalidad, cuidados especiales, historia..."
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Edad (meses) *</Label>
                <Input
                  type="number"
                  required
                  min="1"
                  max="200"
                  value={newListing.age}
                  onChange={(e) => setNewListing({...newListing, age: e.target.value})}
                />
              </div>
              
              <div>
                <Label>Tamaño *</Label>
                <Select
                  value={newListing.size}
                  onValueChange={(value) => setNewListing({...newListing, size: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pequeño">Pequeño</SelectItem>
                    <SelectItem value="mediano">Mediano</SelectItem>
                    <SelectItem value="grande">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Sexo *</Label>
                <Select
                  value={newListing.gender}
                  onValueChange={(value) => setNewListing({...newListing, gender: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="macho">Macho</SelectItem>
                    <SelectItem value="hembra">Hembra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Raza (opcional)</Label>
              <Input
                value={newListing.breed}
                onChange={(e) => setNewListing({...newListing, breed: e.target.value})}
                placeholder="Ej: Labrador, Mestizo, etc."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Provincia *</Label>
                <Select
                  value={newListing.province}
                  onValueChange={(value) => {
                    setNewListing({...newListing, province: value, city: ''})
                    fetchCitiesByProvince(value)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar provincia" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map(province => (
                      <SelectItem key={province.id} value={province.id}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Ciudad *</Label>
                <Select
                  value={newListing.city}
                  onValueChange={(value) => setNewListing({...newListing, city: value})}
                  disabled={!newListing.province}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(city => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Nombre contacto *</Label>
                <Input
                  required
                  value={newListing.contactName}
                  onChange={(e) => setNewListing({...newListing, contactName: e.target.value})}
                  placeholder="Tu nombre"
                />
              </div>
              
              <div>
                <Label>Email contacto *</Label>
                <Input
                  type="email"
                  required
                  value={newListing.contactEmail}
                  onChange={(e) => setNewListing({...newListing, contactEmail: e.target.value})}
                  placeholder="tu@email.com"
                />
              </div>
              
              <div>
                <Label>Teléfono (opcional)</Label>
                <Input
                  value={newListing.contactPhone}
                  onChange={(e) => setNewListing({...newListing, contactPhone: e.target.value})}
                  placeholder="600 123 456"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newListing.isUrgent}
                  onChange={(e) => setNewListing({...newListing, isUrgent: e.target.checked})}
                />
                <span className="text-sm">Adopción urgente</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newListing.isVaccinated}
                  onChange={(e) => setNewListing({...newListing, isVaccinated: e.target.checked})}
                />
                <span className="text-sm">Vacunado</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newListing.isNeutered}
                  onChange={(e) => setNewListing({...newListing, isNeutered: e.target.checked})}
                />
                <span className="text-sm">Esterilizado</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddListing(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Publicar Anuncio
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={showContact} onOpenChange={setShowContact}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contactar sobre {selectedDog?.dogName}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <Label>Tu nombre *</Label>
              <Input
                required
                value={contactForm.senderName}
                onChange={(e) => setContactForm({...contactForm, senderName: e.target.value})}
                placeholder="Nombre completo"
              />
            </div>
            
            <div>
              <Label>Tu email *</Label>
              <Input
                type="email"
                required
                value={contactForm.senderEmail}
                onChange={(e) => setContactForm({...contactForm, senderEmail: e.target.value})}
                placeholder="tu@email.com"
              />
            </div>
            
            <div>
              <Label>Tu teléfono (opcional)</Label>
              <Input
                value={contactForm.senderPhone}
                onChange={(e) => setContactForm({...contactForm, senderPhone: e.target.value})}
                placeholder="600 123 456"
              />
            </div>
            
            <div>
              <Label>Mensaje *</Label>
              <Textarea
                required
                value={contactForm.message}
                onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                placeholder="Cuéntales sobre ti y por qué serías un buen hogar para este perro..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowContact(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                <Mail className="w-4 h-4 mr-2" />
                Enviar Mensaje
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="w-6 h-6" />
            <span className="text-xl font-semibold">AdoptaCachorros</span>
          </div>
          <p className="text-gray-400">
            Plataforma gratuita para la adopción de perros en España
          </p>
          <p className="text-sm text-gray-500 mt-2">
            © 2024 AdoptaCachorros. Ayudando a crear familias felices.
          </p>
        </div>
      </footer>
    </div>
  )
}
