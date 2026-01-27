import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BrowseContent } from "@/components/browse-content";
import type { Listing, Category } from "@/lib/types";

interface BrowsePageProps {
  searchParams: Promise<{
    type?: string;
    category?: string;
    search?: string;
  }>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  // Build query
  let query = supabase
    .from("listings")
    .select(`
      *,
      category:categories(*),
      seller:profiles(id, display_name, avatar_url)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (params.type) {
    query = query.eq("listing_type", params.type);
  }

  if (params.category) {
    query = query.eq("category_id", params.category);
  }

  if (params.search) {
    query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
  }

  const { data: listings } = await query;

  // Fetch categories for filter
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  // Get bid counts for auctions
  const listingsWithBids = await Promise.all(
    (listings || []).map(async (listing) => {
      if (listing.listing_type === "auction") {
        const { count } = await supabase
          .from("bids")
          .select("*", { count: "exact", head: true })
          .eq("listing_id", listing.id);
        return { ...listing, bid_count: count || 0 };
      }
      return { ...listing, bid_count: 0 };
    })
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <BrowseContent
            listings={listingsWithBids as Listing[]}
            categories={(categories || []) as Category[]}
            initialFilters={{
              type: params.type,
              category: params.category,
              search: params.search,
            }}
          />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
