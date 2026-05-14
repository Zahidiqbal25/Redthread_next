import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

const DEFAULT_SLIDERS = [
  { images: ['https://images.unsplash.com/photo-1608797178974-15b35a64ede9?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=300&fit=crop'], text: 'Premium Almonds' },
  { images: ['https://images.unsplash.com/photo-1616684000067-36952fde56ec?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop'], text: 'Fresh Cashews' },
  { images: ['https://images.unsplash.com/photo-1625869951429-800e5765c6c2?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400&h=300&fit=crop'], text: 'Healthy Mix' },
]

export async function GET() {
  const { data } = await supabase.from('settings').select('value').eq('key', 'sliders').single()
  return jsonOk({ sliders: data ? JSON.parse(data.value) : DEFAULT_SLIDERS })
}

export async function PUT(req: NextRequest) {
  const { sliders } = await req.json()
  if (!sliders) return jsonError('sliders is required')
  const value = JSON.stringify(sliders)
  const { data: existing } = await supabase.from('settings').select('key').eq('key', 'sliders').single()
  if (existing) await supabase.from('settings').update({ value }).eq('key', 'sliders')
  else await supabase.from('settings').insert({ key: 'sliders', value })
  return jsonOk({ sliders })
}
