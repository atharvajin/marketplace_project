/**
 * Supabase Proxy/Middleware Handler
 * 
 * This module handles session refresh and authentication checks in middleware.
 * It ensures user sessions are kept alive and manages protected route access.
 * 
 * IMPORTANT: Do not put this client in a global variable.
 * Always create a new one on each request with Fluid compute.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Updates the user session and handles authentication redirects
 * 
 * This function:
 * 1. Creates a Supabase client with cookie handling
 * 2. Refreshes the user session via getUser()
 * 3. Redirects unauthenticated users away from protected routes
 * 4. Redirects authenticated users to role selection if needed
 * 
 * @param request - The incoming Next.js request
 * @returns NextResponse with updated cookies or redirect
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: Do not run code between createServerClient and getUser()
  // A simple mistake could cause users to be randomly logged out
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define protected and auth routes
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/seller') ||
    request.nextUrl.pathname.startsWith('/role-selection') ||
    request.nextUrl.pathname.startsWith('/kyc')

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages to role selection
  if (isAuthRoute && user && !request.nextUrl.pathname.includes('sign-up-success')) {
    const url = request.nextUrl.clone()
    url.pathname = '/role-selection'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: Return supabaseResponse as-is to maintain session cookies
  return supabaseResponse
}
