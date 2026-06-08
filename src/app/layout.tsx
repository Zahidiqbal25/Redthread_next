import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.valenuts.com'),
  title: {
    default: 'Valenuts — Premium Kashmiri Dry Fruits & Nuts | Buy Online',
    template: '%s | Valenuts',
  },
  description: 'Taste the essence of Kashmir with naturally sourced premium dry fruits. Shop almonds, cashews, walnuts, saffron & more. Free delivery on orders above ₹999.',
  keywords: ['dry fruits', 'nuts', 'almonds', 'cashews', 'walnuts', 'pistachios', 'saffron', 'kashmiri dry fruits', 'buy dry fruits online', 'premium nuts', 'valenuts', 'healthy snacks', 'gift box dry fruits'],
  authors: [{ name: 'Valenuts' }],
  creator: 'Valenuts',
  publisher: 'Valenuts',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.valenuts.com',
    siteName: 'Valenuts',
    title: 'Valenuts — Premium Kashmiri Dry Fruits & Nuts',
    description: 'Taste the essence of Kashmir with naturally sourced premium dry fruits crafted for health and wellness. Shop now!',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Valenuts Logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Valenuts — Premium Kashmiri Dry Fruits & Nuts',
    description: 'Naturally sourced premium dry fruits from Kashmir. Almonds, cashews, walnuts, saffron & more.',
    images: ['/logo.png'],
  },
  alternates: {
    canonical: 'https://www.valenuts.com',
  },
  verification: {},
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://checkout.razorpay.com/v1/checkout.js" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Store',
              name: 'Valenuts',
              description: 'Premium Kashmiri Dry Fruits & Nuts - Online Store',
              url: 'https://www.valenuts.com',
              logo: 'https://www.valenuts.com/logo.png',
              priceRange: '₹₹',
              address: { '@type': 'PostalAddress', addressCountry: 'IN', addressRegion: 'Kashmir' },
              sameAs: [],
            }),
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
