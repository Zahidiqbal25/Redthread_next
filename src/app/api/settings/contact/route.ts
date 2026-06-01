import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const { data } = await supabase.from('settings').select('value').eq('key', 'contact').single()
  const defaults = { name: '', email: '', phone: '', address: '', pincode: '' }
  const result = data ? { ...defaults, ...JSON.parse(data.value) } : defaults
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache' }
  })
}

export async function PUT(req: NextRequest) {
  const { name, email, phone, address, pincode } = await req.json()
  const value = JSON.stringify({ name: name || '', email: email || '', phone: phone || '', address: address || '', pincode: pincode || '' })
  
  const { data: existing } = await supabase.from('settings').select('key').eq('key', 'contact').single()
  
  if (existing) {
    const { error } = await supabase.from('settings').update({ value }).eq('key', 'contact')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase.from('settings').insert({ key: 'contact', value })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ name, email, phone, address, pincode })
}
