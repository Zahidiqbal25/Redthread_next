import { supabase } from '@/lib/supabase'
import StoreClient from '@/components/StoreClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop Premium Dry Fruits & Nuts Online',
  description: 'Buy premium Kashmiri dry fruits online at best prices. California almonds, cashews, walnuts, pistachios, saffron & more. Free delivery above ₹999.',
  alternates: { canonical: 'https://www.valenuts.com' },
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const [{ data: products }, { data: categories }, { data: orderSetting }, { data: badgesSetting }, { data: infoCardsSetting }] = await Promise.all([
    supabase.from('products').select('*'),
    supabase.from('categories').select('*').order('id'),
    supabase.from('settings').select('value').eq('key', 'product_order').single(),
    supabase.from('settings').select('value').eq('key', 'trust_badges').single(),
    supabase.from('settings').select('value').eq('key', 'info_cards').single(),
  ])

  let sortedProducts = products || []
  if (orderSetting?.value) {
    const order: number[] = JSON.parse(orderSetting.value)
    sortedProducts = [...sortedProducts].sort((a, b) => {
      const ai = order.indexOf(a.id)
      const bi = order.indexOf(b.id)
      if (ai === -1 && bi === -1) return a.id - b.id
      if (ai === -1) return 1
      if (bi === -1) return 1
      return ai - bi
    })
  }

  const trustBadges = badgesSetting?.value ? JSON.parse(badgesSetting.value) : [
    { icon: '🚚', title: 'Free Delivery', desc: 'On orders above ₹999' },
    { icon: '🔄', title: 'Easy Returns', desc: '7-day return policy' },
    { icon: '✅', title: '100% Authentic', desc: 'Quality guaranteed' },
    { icon: '📦', title: 'Secure Packing', desc: 'Freshness sealed' },
  ]

  const infoCards = infoCardsSetting?.value ? JSON.parse(infoCardsSetting.value) : [
    { icon: '🌍', title: 'Globally Sourced', desc: 'Directly sourced from farms in California, Afghanistan, Iran & Chile.' },
    { icon: '🔬', title: 'Lab Tested', desc: 'Every batch is tested for quality, purity and freshness.' },
    { icon: '📦', title: 'Secure Packaging', desc: 'Airtight, food-grade packaging that locks in freshness.' },
    { icon: '💰', title: 'Best Prices', desc: 'Farm-to-door supply chain cuts out middlemen.' },
  ]

  return <StoreClient initialProducts={sortedProducts} initialCategories={categories || []} trustBadges={trustBadges} infoCards={infoCards} />
}
