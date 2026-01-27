/**
 * Supabase Browser Client
 * 
 * This client is used for client-side operations in React components.
 * It handles authentication state and real-time subscriptions.
 * 
 * Usage: import { createClient } from '@/lib/supabase/client'
 */

import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for browser/client-side usage
 * Uses environment variables for configuration
 * 
 * @returns Supabase browser client instance
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
