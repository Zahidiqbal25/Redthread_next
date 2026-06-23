import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const DEFAULT_CARDS = [
  { icon: '🌍', title: 'Globally Sourced', desc: 'Directly sourced from farms in California, Afghanistan, Iran & Chile.' },
  { icon: '🔬', title: 'Lab Tested', desc: 'Every batch is tested for quality, purity and freshness.' },
  { icon: '📦', title: 'Secure Packaging', desc: 'Airtight, food-grade packaging that locks in freshness.' },
  { icon: '💰', title: 'Best Prices', desc: 'Farm-to-door supply chain cuts out middlemen.' },
]

export async function GET() {
  const { data } = await supabase.from('settings').select('value').eq('key', 'info_cards').single()
  if (data?.value) {
    const res = Response.json(JSON.parse(data.value))
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
  const res = Response.json(DEFAULT_CARDS)
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const cards = body.cards || []
    const { data: existing } = await supabase.from('settings').select('key').eq('key', 'info_cards').single()
    if (existing) {
      await supabase.from('settings').update({ value: JSON.stringify(cards) }).eq('key', 'info_cards')
    } else {
      await supabase.from('settings').insert({ key: 'info_cards', value: JSON.stringify(cards) })
    }
    return jsonOk({ success: true })
  } catch (err: any) {
    return jsonError(err.message || 'Server error', 500)
  }
}
