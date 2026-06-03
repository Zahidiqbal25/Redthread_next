import { supabase } from '@/lib/supabase'
import StoreClient from '@/components/StoreClient'

// Server Component - fetches data at request time (SSR)
// This is a major Next.js advantage: SEO-friendly, fast initial load
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
