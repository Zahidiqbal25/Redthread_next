import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { data: cat } = await supabase.from('categories').select('*').eq('id', Number(params.id)).single()
  if (!cat) return jsonError('Category not found', 404)

  const { name, emoji, image } = await req.json()
  if (!name) return jsonError('Category name is required')

  const { data: dup } = await supabase.from('categories').select('id').eq('name', name).neq('id', Number(params.id)).single()
  if (dup) return jsonError('Category name already exists', 409)

  const { data: updated } = await supabase.from('categories').update({ name, emoji: emoji || '', image: image !== undefined ? image : cat.image }).eq('id', Number(params.id)).select().single()

  // Update all products that had the old category name
  if (cat.name !== name) {
    await supabase.from('products').update({ category: name }).eq('category', cat.name)
  }

  return jsonOk(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { data } = await supabase.from('categories').select('id').eq('id', Number(params.id)).single()
  if (!data) return jsonError('Category not found', 404)
  await supabase.from('categories').delete().eq('id', Number(params.id))
  return jsonOk({ message: 'Category deleted' })
}
