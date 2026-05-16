import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsonOk } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = Number(params.id)

  // Fetch orders by userId
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('userId', userId)
    .order('id', { ascending: false })

  if (data && data.length > 0) {
    return jsonOk(data)
  }

  // Fallback: match by email/phone
  const { data: userData } = await supabase.from('users').select('email, phone').eq('id', userId).single()
  if (userData?.email) {
    const { data: byEmail } = await supabase
      .from('orders')
      .select('*')
      .eq('customerEmail', userData.email)
      .order('id', { ascending: false })
    if (byEmail && byEmail.length > 0) return jsonOk(byEmail)
  }

  return jsonOk([])
}
