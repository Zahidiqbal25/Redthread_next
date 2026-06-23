import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const DEFAULT_BADGES = [
  { icon: '🚚', title: 'Free Delivery', desc: 'On orders above ₹999' },
  { icon: '🔄', title: 'Easy Returns', desc: '7-day return policy' },
  { icon: '✅', title: '100% Authentic', desc: 'Quality guaranteed' },
  { icon: '📦', title: 'Secure Packing', desc: 'Freshness sealed' },
]

export async function GET() {
  const { data } = await supabase.from('settings').select('value').eq('key', 'trust_badges').single()
  if (data?.value) {
    const res = Response.json(JSON.parse(data.value))
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
  const res = Response.json(DEFAULT_BADGES)
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const badges = body.badges || []
    const { data: existing } = await supabase.from('settings').select('key').eq('key', 'trust_badges').single()
    if (existing) {
      await supabase.from('settings').update({ value: JSON.stringify(badges) }).eq('key', 'trust_badges')
    } else {
      await supabase.from('settings').insert({ key: 'trust_badges', value: JSON.stringify(badges) })
    }
    return jsonOk({ success: true })
  } catch (err: any) {
    return jsonError(err.message || 'Server error', 500)
  }
}
