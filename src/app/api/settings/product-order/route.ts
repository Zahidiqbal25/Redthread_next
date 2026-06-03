import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data } = await supabase.from('settings').select('value').eq('key', 'product_order').single()
  return NextResponse.json({ order: data ? JSON.parse(data.value) : [] })
}

export async function PUT(req: NextRequest) {
  const { order } = await req.json()
  if (!order || !Array.isArray(order)) {
    return NextResponse.json({ error: 'order array is required' }, { status: 400 })
  }

  const value = JSON.stringify(order)
  const { data: existing } = await supabase.from('settings').select('key').eq('key', 'product_order').single()

  if (existing) {
    await supabase.from('settings').update({ value }).eq('key', 'product_order')
  } else {
    await supabase.from('settings').insert({ key: 'product_order', value })
  }

  return NextResponse.json({ order })
}
