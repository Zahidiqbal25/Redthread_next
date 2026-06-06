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
  const { data } = await supabase.from('users').select('id').eq('id', Number(params.id)).single()
  if (!data) return jsonError('User not found', 404)
  await supabase.from('users').delete().eq('id', Number(params.id))
  return jsonOk({ message: 'User deleted' })
}
