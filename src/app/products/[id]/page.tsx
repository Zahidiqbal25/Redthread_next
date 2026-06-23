import { supabase } from '@/lib/supabase'
import ProductDetailClient from '@/components/ProductDetailClient'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data: product } = await supabase.from('products').select('*').eq('id', Number(params.id)).single()
  if (!product) return { title: 'Product Not Found' }

  const title = `${product.name} — ${product.weight} | Buy Online`
  const description = product.description
    ? `${product.description.substring(0, 150)}. Buy ${product.name} at ₹${product.price}. Free delivery above ₹999.`
    : `Buy ${product.name} (${product.weight}) at ₹${product.price}. Premium quality ${product.category}. Free delivery above ₹999.`

  return {
    title,
    description,
    openGraph: {
      title: `${product.name} — ₹${product.price}`,
      description,
      type: 'website',
      url: `https://www.valenuts.com/products/${product.id}`,
      images: product.image ? [{ url: product.image, alt: product.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} — ₹${product.price}`,
      description,
      images: product.image ? [product.image] : [],
    },
    alternates: { canonical: `https://www.valenuts.com/products/${product.id}` },
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const [{ data: product }, { data: badgesSetting }] = await Promise.all([
    supabase.from('products').select('*').eq('id', Number(params.id)).single(),
    supabase.from('settings').select('value').eq('key', 'trust_badges').single(),
  ])
  if (!product) notFound()

  const trustBadges = badgesSetting?.value ? JSON.parse(badgesSetting.value) : [
    { icon: '🚚', title: 'Free Delivery', desc: 'On orders above ₹999' },
    { icon: '🔄', title: 'Easy Returns', desc: '7-day return policy' },
    { icon: '✅', title: '100% Authentic', desc: 'Quality guaranteed' },
    { icon: '📦', title: 'Secure Packing', desc: 'Freshness sealed' },
  ]
  product.trust_badges = trustBadges

  const { data: related } = await supabase
    .from('products')
    .select('*')
    .eq('category', product.category)
    .neq('id', product.id)
    .limit(4)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description || `Premium ${product.name} - ${product.weight}`,
            image: product.image,
            brand: { '@type': 'Brand', name: 'Valenuts' },
            offers: {
              '@type': 'Offer',
              price: product.price,
              priceCurrency: 'INR',
              availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              seller: { '@type': 'Organization', name: 'Valenuts' },
            },
            aggregateRating: product.rating ? {
              '@type': 'AggregateRating',
              ratingValue: product.rating,
              bestRating: 5,
              ratingCount: Math.floor(product.rating * 10),
            } : undefined,
          }),
        }}
      />
      <ProductDetailClient product={product} relatedProducts={related || []} />
    </>
  )
}
