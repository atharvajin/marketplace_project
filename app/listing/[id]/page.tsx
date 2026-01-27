import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ListingDetail } from "@/components/listing-detail";
import type { Listing, Bid } from "@/lib/types";

interface ListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing, error } = await supabase
    .from("listings")
    .select(`
      *,
      category:categories(*),
      seller:profiles(id, display_name, avatar_url, email)
    `)
    .eq("id", id)
    .single();

  if (error || !listing) {
    notFound();
  }

  // Get bid count and recent bids if auction
  let bids: Bid[] = [];
  if (listing.listing_type === "auction") {
    const { count } = await supabase
      .from("bids")
      .select("*", { count: "exact", head: true })
      .eq("listing_id", id);
    listing.bid_count = count || 0;

    const { data: bidData } = await supabase
      .from("bids")
      .select(`
        *,
        bidder:profiles(id, display_name, avatar_url)
      `)
      .eq("listing_id", id)
      .order("amount", { ascending: false })
      .limit(5);
    bids = (bidData || []) as Bid[];
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <ListingDetail
          listing={listing as Listing}
          bids={bids}
          currentUserId={user?.id}
        />
      </main>
      <Footer />
    </div>
  );
}
