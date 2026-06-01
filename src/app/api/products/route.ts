import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

export async function GET() {
  const { data } = await supabase.from('products').select('*').order('id')
  return jsonOk(data || [])
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, category, price, originalPrice, weight, description, rating, inStock, image, quantity, images } = body
    if (!name || !category || !price || !originalPrice || !weight)
      return jsonError('name, category, price, originalPrice, weight are required')

    const qty = Number(quantity) || 0
    const { data: product, error } = await supabase.from('products')
      .insert({ name, category, price: Number(price), originalPrice: Number(originalPrice), weight, image: image || '', images: images || [], description: description || '', rating: Number(rating) || 4.5, inStock: qty > 0 ? true : inStock !== false, quantity: qty })
      .select().single()
    if (error) throw error
    return jsonOk(product, 201)
  } catch (err: any) {
    return jsonError(err.message || 'Server error', 500)
  }
}
