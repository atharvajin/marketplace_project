/**
 * Next.js Middleware
 * 
 * This middleware runs on every matched request and handles:
 * - Session refresh via Supabase proxy
 * - Protected route authentication checks
 * - Auth route redirects for logged-in users
 */

import { updateSession } from '@/lib/supabase/proxy'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

/**
 * Matcher configuration
 * 
 * Matches all paths except:
 * - Static files (_next/static)
 * - Image optimization (_next/image)
 * - Favicon and image files
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
