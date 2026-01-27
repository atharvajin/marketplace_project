/**
 * Supabase Server Client
 * 
 * This client is used for server-side operations in Server Components,
 * Server Actions, and Route Handlers. It handles cookie-based session management.
 * 
 * IMPORTANT: Always create a new client instance within each function.
 * Do not store in a global variable, especially with Fluid compute.
 * 
 * Usage: import { createClient } from '@/lib/supabase/server'
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for server-side usage
 * Handles cookie reading and writing for session management
 * 
 * @returns Promise<SupabaseClient> - Server-side Supabase client
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // The "setAll" method was called from a Server Component.
            // This can be ignored if you have proxy refreshing user sessions.
          }
        },
      },
    },
  )
}
