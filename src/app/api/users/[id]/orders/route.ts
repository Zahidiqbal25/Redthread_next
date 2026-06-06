import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsonOk } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = Number(params.id)

  // Get user's email and phone
  const { data: userData } = await supabase.from('users').select('email, phone').eq('id', userId).single()

  // Fetch orders by userId
  const { data: byId } = await supabase.from('orders').select('*').eq('userId', userId).order('id', { ascending: false })

  // Also fetch orders by email (for guest orders placed before registration)
  let byEmail: any[] = []
  if (userData?.email) {
    const { data } = await supabase.from('orders').select('*').eq('customerEmail', userData.email).order('id', { ascending: false })
    byEmail = data || []
  }

  // Merge and deduplicate by order id
  const allOrders = [...(byId || []), ...byEmail]
  const seen = new Set<number>()
  const unique = allOrders.filter(o => {
    if (seen.has(o.id)) return false
    seen.add(o.id)
    return true
  }).sort((a, b) => b.id - a.id)

  return jsonOk(unique)
}
