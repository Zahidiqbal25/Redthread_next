import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashPassword, sanitizeUser, jsonError, jsonOk } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) return jsonError('Email and password are required')

  const { data: user } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).single()
  if (!user || user.password !== hashPassword(password))
    return jsonError('Invalid email or password', 401)
  if (user.blocked)
    return jsonError('Your account has been blocked. Please contact support.', 403)

  return jsonOk(sanitizeUser(user))
}
