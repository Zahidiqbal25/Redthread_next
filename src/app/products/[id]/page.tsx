import { supabase } from '@/lib/supabase'
import ProductDetailClient from '@/components/ProductDetailClient'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: { params: { id: string } }) {
  const { data: product } = await supabase.from('products').select('*').eq('id', Number(params.id)).single()
  if (!product) notFound()

  const { data: related } = await supabase
    .from('products')
    .select('*')
    .eq('category', product.category)
    .neq('id', product.id)
    .limit(4)

  return <ProductDetailClient product={product} relatedProducts={related || []} />
}
