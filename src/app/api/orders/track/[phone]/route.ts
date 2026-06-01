import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

export async function GET(_: NextRequest, { params }: { params: { phone: string } }) {
  const query = params.phone.trim()
  if (!query) return jsonError('Phone number or email is required')

  // Search by phone
  const { data: byPhone } = await supabase.from('orders').select('*').eq('customerPhone', query).order('id', { ascending: false })
  if (byPhone && byPhone.length > 0) return jsonOk(byPhone)

  // Search by email
  const { data: byEmail } = await supabase.from('orders').select('*').eq('customerEmail', query).order('id', { ascending: false })
  if (byEmail && byEmail.length > 0) return jsonOk(byEmail)

  return jsonOk([])
}
