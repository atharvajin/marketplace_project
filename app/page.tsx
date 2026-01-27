import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Download, Package, Gavel, ShieldCheck, Zap, Users } from "lucide-react";
import type { Listing, Category } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch featured listings
  const { data: featuredListings } = await supabase
    .from("listings")
    .select(`
      *,
      category:categories(*),
      seller:profiles(id, display_name, avatar_url)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8);

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name")
    .limit(6);

  const listings = (featuredListings || []) as Listing[];
  const cats = (categories || []) as Category[];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-card border-b border-border">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-3xl">
              <Badge variant="secondary" className="mb-4">
                Peer-to-Peer Marketplace
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground leading-tight text-balance">
                Buy and sell with confidence
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-xl text-pretty">
                Your trusted marketplace for digital goods, physical products, and auctions. 
                Join thousands of buyers and sellers in our thriving community.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link href="/browse">
                    Start Shopping
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/auth/sign-up">Become a Seller</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </section>

        {/* Categories Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground">Browse by Category</h2>
              <p className="text-muted-foreground mt-1">Find what you are looking for</p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/browse">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {cats.map((category) => (
              <Link
                key={category.id}
                href={`/browse?category=${category.id}`}
                className="group p-6 bg-card border border-border rounded-lg hover:border-primary/50 hover:shadow-md transition-all text-center"
              >
                <div className="text-3xl mb-3">{category.icon || "📦"}</div>
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>

        {/* Listing Types */}
        <section className="bg-card border-y border-border">
          <div className="container mx-auto px-4 py-16">
            <h2 className="text-2xl font-serif font-bold text-foreground text-center mb-12">
              Three Ways to Shop
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Link href="/browse?type=digital" className="group">
                <div className="p-8 bg-background border border-border rounded-lg hover:border-primary/50 transition-all">
                  <div className="p-4 bg-primary/10 rounded-full w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                    <Download className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Digital Goods</h3>
                  <p className="text-muted-foreground">
                    Instant downloads for software, templates, ebooks, and more.
                  </p>
                </div>
              </Link>
              <Link href="/browse?type=physical" className="group">
                <div className="p-8 bg-background border border-border rounded-lg hover:border-primary/50 transition-all">
                  <div className="p-4 bg-primary/10 rounded-full w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Physical Items</h3>
                  <p className="text-muted-foreground">
                    Quality products shipped directly to your door.
                  </p>
                </div>
              </Link>
              <Link href="/auctions" className="group">
                <div className="p-8 bg-background border border-border rounded-lg hover:border-primary/50 transition-all">
                  <div className="p-4 bg-primary/10 rounded-full w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                    <Gavel className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Live Auctions</h3>
                  <p className="text-muted-foreground">
                    Bid on unique items and score amazing deals.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Listings */}
        <section className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground">Latest Listings</h2>
              <p className="text-muted-foreground mt-1">Fresh items from our sellers</p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/browse">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {listings.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No listings yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to list something on our marketplace
              </p>
              <Button asChild>
                <Link href="/auth/sign-up">Start Selling</Link>
              </Button>
            </div>
          )}
        </section>

        {/* Trust Section */}
        <section className="bg-card border-t border-border">
          <div className="container mx-auto px-4 py-16">
            <h2 className="text-2xl font-serif font-bold text-foreground text-center mb-12">
              Why Choose P2P Market?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Secure Transactions</h3>
                <p className="text-muted-foreground">
                  Your payments and data are protected with industry-standard security.
                </p>
              </div>
              <div className="text-center">
                <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Fast & Easy</h3>
                <p className="text-muted-foreground">
                  List items in minutes and get paid quickly for your sales.
                </p>
              </div>
              <div className="text-center">
                <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Trusted Community</h3>
                <p className="text-muted-foreground">
                  Join thousands of verified buyers and sellers worldwide.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
