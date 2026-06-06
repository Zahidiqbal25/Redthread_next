import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sanitizeUser } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || ''
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect(`${baseUrl}?auth_error=no_code`)

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${baseUrl}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })
    const tokens = await tokenRes.json()
    if (!tokens.access_token) return NextResponse.redirect(`${baseUrl}?auth_error=token_failed`)

    // Get user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const googleUser = await userInfoRes.json()
    if (!googleUser.email) return NextResponse.redirect(`${baseUrl}?auth_error=no_email`)

    const email = googleUser.email.toLowerCase()

    // Check if user exists
    let { data: user } = await supabase.from('users').select('*').eq('email', email).single()

    if (!user) {
      // Create new user
      const { data: newUser, error } = await supabase.from('users').insert({
        name: googleUser.name || email.split('@')[0],
        email,
        phone: '',
        password: 'GOOGLE_OAUTH',
        address: '',
        city: '',
        pincode: '',
      }).select().single()
      if (error) return NextResponse.redirect(`${baseUrl}?auth_error=create_failed`)
      user = newUser
    }

    // Redirect back with user data encoded
    const userData = encodeURIComponent(JSON.stringify(sanitizeUser(user)))
    return NextResponse.redirect(`${baseUrl}?google_user=${userData}`)
  } catch (err) {
    return NextResponse.redirect(`${baseUrl}?auth_error=server_error`)
  }
}
