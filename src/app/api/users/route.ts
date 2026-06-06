import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sanitizeUser } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const { data } = await supabase.from('users').select('*').order('id', { ascending: false })
  return NextResponse.json((data || []).map(sanitizeUser), {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
  })
}
