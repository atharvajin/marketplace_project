-- P2P Market Database Schema
-- This script creates all necessary tables for the marketplace platform
-- including users profiles, listings, categories, bids, and blog posts

-- ============================================
-- PROFILES TABLE
-- Stores additional user information and role preferences
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  -- last_role_selection stores the user's most recent role choice: 'buyer', 'seller', or 'both'
  last_role_selection TEXT DEFAULT 'buyer' CHECK (last_role_selection IN ('buyer', 'seller', 'both')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);
-- Allow public read of profiles for marketplace display
CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT USING (true);

-- ============================================
-- CATEGORIES TABLE
-- Stores listing categories for organization
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  -- type determines if category is for digital, physical, or both
  type TEXT DEFAULT 'both' CHECK (type IN ('digital', 'physical', 'both')),
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on categories (public read)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select_all" ON public.categories FOR SELECT USING (true);

-- ============================================
-- LISTINGS TABLE
-- Core table for all marketplace listings
-- ============================================
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  
  -- Basic listing information
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  -- images stored as JSON array of URLs
  images JSONB DEFAULT '[]'::jsonb,
  
  -- Listing type: digital or physical goods
  listing_type TEXT NOT NULL CHECK (listing_type IN ('digital', 'physical')),
  
  -- Price type determines how the item is sold
  -- fixed: Set price, buy immediately
  -- negotiable: Buyers can make offers
  -- auction: Bidding with end time
  -- trade: Swap for other items
  price_type TEXT NOT NULL CHECK (price_type IN ('fixed', 'negotiable', 'auction', 'trade')),
  
  -- Price in cents (null for trade-only listings)
  price INTEGER,
  
  -- Auction-specific fields
  auction_start_price INTEGER,
  auction_current_bid INTEGER,
  auction_end_time TIMESTAMPTZ,
  
  -- Trade-specific field (what they want in exchange)
  trade_preferences TEXT,
  
  -- Digital goods: delivery method/download info
  digital_delivery_info TEXT,
  
  -- Physical goods: shipping info placeholder
  shipping_info JSONB DEFAULT '{}'::jsonb,
  
  -- Listing status
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'sold', 'expired', 'cancelled')),
  
  -- Metadata
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on listings
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for listings
-- Anyone can view active listings
CREATE POLICY "listings_select_active" ON public.listings FOR SELECT USING (status = 'active' OR user_id = auth.uid());
-- Only authenticated users can create listings
CREATE POLICY "listings_insert_own" ON public.listings FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Only owner can update their listings
CREATE POLICY "listings_update_own" ON public.listings FOR UPDATE USING (auth.uid() = user_id);
-- Only owner can delete their listings
CREATE POLICY "listings_delete_own" ON public.listings FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- BIDS TABLE
-- Stores auction bids and negotiation offers
-- ============================================
CREATE TABLE IF NOT EXISTS public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Amount in cents
  amount INTEGER NOT NULL,
  
  -- Type: auction_bid or offer (for negotiable items)
  bid_type TEXT NOT NULL CHECK (bid_type IN ('auction_bid', 'offer')),
  
  -- Status for offers
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'outbid')),
  
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on bids
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bids
-- Bidders can see their own bids, listing owners can see bids on their listings
CREATE POLICY "bids_select_own" ON public.bids FOR SELECT 
  USING (
    bidder_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.listings WHERE listings.id = bids.listing_id AND listings.user_id = auth.uid()
    )
  );
CREATE POLICY "bids_insert_own" ON public.bids FOR INSERT WITH CHECK (auth.uid() = bidder_id);
CREATE POLICY "bids_update_own" ON public.bids FOR UPDATE 
  USING (
    bidder_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.listings WHERE listings.id = bids.listing_id AND listings.user_id = auth.uid()
    )
  );

-- ============================================
-- BLOG POSTS TABLE
-- Community blog for marketplace
-- ============================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  
  -- Tags stored as JSON array
  tags JSONB DEFAULT '[]'::jsonb,
  
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on blog posts
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog posts
CREATE POLICY "blog_posts_select_published" ON public.blog_posts FOR SELECT USING (status = 'published' OR author_id = auth.uid());
CREATE POLICY "blog_posts_insert_own" ON public.blog_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "blog_posts_update_own" ON public.blog_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "blog_posts_delete_own" ON public.blog_posts FOR DELETE USING (auth.uid() = author_id);

-- ============================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SEED DATA: Default categories
-- ============================================
INSERT INTO public.categories (name, slug, description, type, icon) VALUES
  ('Electronics', 'electronics', 'Gadgets, devices, and tech accessories', 'both', 'Cpu'),
  ('Software & Digital', 'software-digital', 'Software licenses, digital products, and downloads', 'digital', 'Download'),
  ('Fashion', 'fashion', 'Clothing, shoes, and accessories', 'physical', 'Shirt'),
  ('Home & Garden', 'home-garden', 'Furniture, decor, and garden supplies', 'physical', 'Home'),
  ('Art & Collectibles', 'art-collectibles', 'Artwork, antiques, and collectible items', 'both', 'Palette'),
  ('Gaming', 'gaming', 'Video games, consoles, and gaming accessories', 'both', 'Gamepad2'),
  ('Books & Media', 'books-media', 'Books, music, movies, and other media', 'both', 'BookOpen'),
  ('Services', 'services', 'Professional services and freelance work', 'digital', 'Briefcase')
ON CONFLICT (slug) DO NOTHING;
