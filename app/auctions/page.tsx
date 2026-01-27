import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ListingCard } from "@/components/listing-card";
import { Badge } from "@/components/ui/badge";
import { Gavel, Clock } from "lucide-react";
import type { Listing } from "@/lib/types";

export default async function AuctionsPage() {
  const supabase = await createClient();

  const { data: auctions } = await supabase
    .from("listings")
    .select(`
      *,
      category:categories(*),
      seller:profiles(id, display_name, avatar_url)
    `)
    .eq("listing_type", "auction")
    .eq("status", "active")
    .order("auction_end_time", { ascending: true });

  // Get bid counts
  const auctionsWithBids = await Promise.all(
    (auctions || []).map(async (auction) => {
      const { count } = await supabase
        .from("bids")
        .select("*", { count: "exact", head: true })
        .eq("listing_id", auction.id);
      return { ...auction, bid_count: count || 0 };
    })
  );

  // Separate into ending soon and all auctions
  const now = new Date();
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  const endingSoon = auctionsWithBids.filter(
    (a) => a.auction_end_time && new Date(a.auction_end_time) <= oneDayFromNow
  );
  const allAuctions = auctionsWithBids as Listing[];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Gavel className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Live Auctions</h1>
          </div>
          <p className="text-muted-foreground">
            Bid on unique items and score amazing deals
          </p>
        </div>

        {/* Ending Soon */}
        {endingSoon.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="h-5 w-5 text-destructive" />
              <h2 className="text-xl font-semibold text-foreground">Ending Soon</h2>
              <Badge variant="destructive">{endingSoon.length}</Badge>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {endingSoon.map((auction) => (
                <ListingCard key={auction.id} listing={auction as Listing} />
              ))}
            </div>
          </section>
        )}

        {/* All Auctions */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6">All Auctions</h2>
          {allAuctions.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allAuctions.map((auction) => (
                <ListingCard key={auction.id} listing={auction} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card border border-border rounded-lg">
              <Gavel className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No active auctions</h3>
              <p className="text-muted-foreground">
                Check back later for new auction listings
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
