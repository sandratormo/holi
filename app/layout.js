import './globals.css'

export const metadata = {
  title: 'AdoptaCachorros - Adopción de Perros en España',
  description: 'La plataforma líder para adoptar cachorros y perros en España. Encuentra tu compañero perfecto y dale una segunda oportunidad.',
  keywords: 'adopcion perros españa, adoptar cachorro, protectora animales, perros abandono, adopcion madrid barcelona',
  openGraph: {
    title: 'AdoptaCachorros - Adopción de Perros en España',
    description: 'La plataforma líder para adoptar cachorros y perros en España. Encuentra tu compañero perfecto y dale una segunda oportunidad.',
    type: 'website',
    url: 'https://adoptacachorros.es',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1522276498395-f4f68f7f8454?w=1200&h=630&fit=crop',
        width: 1200,
        height: 630,
        alt: 'AdoptaCachorros - Adopción de Perros'
      }
    ]
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#059669" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}