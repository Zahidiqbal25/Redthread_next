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
  const [{ data: products }, { data: categories }, { data: orderSetting }] = await Promise.all([
    supabase.from('products').select('*'),
    supabase.from('categories').select('*').order('id'),
    supabase.from('settings').select('value').eq('key', 'product_order').single(),
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

  return <StoreClient initialProducts={sortedProducts} initialCategories={categories || []} />
}
