import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Placeholder URL/key for build time when env vars aren't available
const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY = 'placeholder-key'

export async function updateSession(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PLACEHOLDER_KEY

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser()

  return supabaseResponse
}
