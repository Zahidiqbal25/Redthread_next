import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { data } = await supabase.from('products').select('*').eq('id', Number(params.id)).single()
  if (!data) return jsonError('Product not found', 404)
  return jsonOk(data)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data: existing } = await supabase.from('products').select('*').eq('id', Number(params.id)).single()
    if (!existing) return jsonError('Product not found', 404)

    const body = await req.json()
    const { name, category, price, originalPrice, weight, description, rating, inStock, image, quantity, images, features } = body
    const qty = quantity !== undefined ? Number(quantity) : existing.quantity

    const updateData: any = {
      name: name || existing.name,
      category: category || existing.category,
      price: Number(price) || existing.price,
      originalPrice: Number(originalPrice) || existing.originalPrice,
      weight: weight || existing.weight,
      image: image !== undefined ? image : existing.image,
      images: images !== undefined ? images : (existing.images || []),
      description: description !== undefined ? description : existing.description,
      rating: Number(rating) || existing.rating,
      inStock: qty > 0,
      quantity: qty,
    }

    const { data: updated, error } = await supabase.from('products').update(updateData).eq('id', Number(params.id)).select().single()
    if (error) throw error

    return jsonOk(updated)
  } catch (err: any) {
    return jsonError(err.message || 'Server error', 500)
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { data } = await supabase.from('products').select('id').eq('id', Number(params.id)).single()
  if (!data) return jsonError('Product not found', 404)
  await supabase.from('products').delete().eq('id', Number(params.id))
  return jsonOk({ message: 'Product deleted' })
}
