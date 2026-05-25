import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data } = await supabase.from('categories').select('*').order('id')
  return jsonOk(data || [])
}

export async function POST(req: NextRequest) {
  const { name, emoji, image } = await req.json()
  if (!name) return jsonError('Category name is required')

  const { data: existing } = await supabase.from('categories').select('id').eq('name', name).single()
  if (existing) return jsonError('Category already exists', 409)

  const { data: cat, error } = await supabase.from('categories').insert({ name, emoji: emoji || '', image: image || '' }).select().single()
  if (error) return jsonError(error.message, 500)
  return jsonOk(cat, 201)
}
