-- Add KYC and role fields to profiles for seller verification
-- Run this in Supabase SQL Editor after 001_create_p2p_market_schema.sql

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('buyer', 'seller')),
  ADD COLUMN IF NOT EXISTS kyc_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kyc_data JSONB;

-- Backfill role from last_role_selection if you have that column:
-- UPDATE public.profiles SET role = last_role_selection WHERE role IS NULL AND last_role_selection IN ('buyer', 'seller');

COMMENT ON COLUMN public.profiles.role IS 'User role: buyer or seller (used for dashboard/KYC)';
COMMENT ON COLUMN public.profiles.kyc_completed IS 'Whether the seller has completed KYC verification';
COMMENT ON COLUMN public.profiles.kyc_submitted_at IS 'When KYC was submitted';
COMMENT ON COLUMN public.profiles.kyc_data IS 'KYC form data (address, id_type, id_number, etc.)';
