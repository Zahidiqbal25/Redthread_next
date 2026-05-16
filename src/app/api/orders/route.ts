import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

export async function GET() {
  const { data } = await supabase.from('orders').select('*').order('id', { ascending: false })
  return jsonOk(data || [])
}

export async function POST(req: NextRequest) {
  try {
    const { customer, items, total, payment, userId, paymentId } = await req.json()
    if (!customer || !items?.length || !total)
      return jsonError('customer, items, total are required')

    const { data: order, error } = await supabase.from('orders').insert({
      userId: userId || 0,
      customerName: customer.name, customerPhone: customer.phone,
      customerEmail: customer.email, customerAddress: customer.address,
      customerCity: customer.city, customerPincode: customer.pincode,
      items, total, payment: payment || 'COD', paymentId: paymentId || '',
      created_at: new Date().toISOString(),
    }).select().single()
    if (error) throw error

    // Update product quantities
    for (const item of items) {
      const { data: product } = await supabase.from('products').select('quantity').eq('id', item.id).single()
      if (product) {
        const newQty = Math.max(0, (product.quantity || 0) - item.qty)
        await supabase.from('products').update({ quantity: newQty, inStock: newQty > 0 }).eq('id', item.id)
      }
    }

    if (userId) {
      await supabase.from('users').update({
        address: customer.address, city: customer.city,
        pincode: customer.pincode, phone: customer.phone,
      }).eq('id', userId)
    }

    return jsonOk(order, 201)
  } catch (err: any) {
    return jsonError(err.message || 'Server error', 500)
  }
}
