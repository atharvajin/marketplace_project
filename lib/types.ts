export type UserRole = 'buyer' | 'seller';

export type ListingType = 'digital' | 'physical' | 'auction';

export type ListingStatus = 'active' | 'sold' | 'expired' | 'draft';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  kyc_completed: boolean;
  kyc_submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  listing_type: ListingType;
  category_id: string | null;
  images: string[];
  status: ListingStatus;
  auction_end_time: string | null;
  starting_bid: number | null;
  current_bid: number | null;
  shipping_info: string | null;
  digital_file_url: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  category?: Category;
  seller?: Profile;
  bid_count?: number;
}

export interface Bid {
  id: string;
  listing_id: string;
  bidder_id: string;
  amount: number;
  created_at: string;
  // Joined data
  bidder?: Profile;
}

export interface BlogPost {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: Profile;
}
