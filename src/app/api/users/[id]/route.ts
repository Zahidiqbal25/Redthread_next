import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sanitizeUser, jsonError, jsonOk } from '@/lib/utils'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { data: user } = await supabase.from('users').select('*').eq('id', Number(params.id)).single()
  if (!user) return jsonError('User not found', 404)
  return jsonOk(sanitizeUser(user))
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { data: user } = await supabase.from('users').select('*').eq('id', Number(params.id)).single()
  if (!user) return jsonError('User not found', 404)

  const body = await req.json()
  const { name, phone, address, city, pincode, blocked } = body
  const updateData: any = {
    name: name || user.name, phone: phone || user.phone,
    address: address !== undefined ? address : user.address,
    city: city !== undefined ? city : user.city,
    pincode: pincode !== undefined ? pincode : user.pincode,
  }
  if (blocked !== undefined) updateData.blocked = blocked

  const { data: updated } = await supabase.from('users').update(updateData).eq('id', user.id).select().single()
  return jsonOk(sanitizeUser(updated))
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const userId = Number(params.id)
  const { data } = await supabase.from('users').select('id, email').eq('id', userId).single()
  if (!data) return jsonError('User not found', 404)

  // Delete all orders by this user (by userId and by email)
  await supabase.from('orders').delete().eq('userId', userId)
  if (data.email) await supabase.from('orders').delete().eq('customerEmail', data.email)

  // Delete the user
  await supabase.from('users').delete().eq('id', userId)
  return jsonOk({ message: 'User and related data deleted' })
}
