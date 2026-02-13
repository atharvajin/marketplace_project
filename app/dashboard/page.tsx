import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, DollarSign, Eye, TrendingUp, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SellerListingsTable } from "@/components/seller-listings-table";
import type { Listing } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "seller") {
    redirect("/browse");
  }

  // Get seller's listings
  const { data: listings } = await supabase
    .from("listings")
    .select(`
      *,
      category:categories(*)
    `)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const sellerListings = (listings || []) as Listing[];

  // Calculate stats
  const activeListings = sellerListings.filter((l) => l.status === "active").length;
  const soldListings = sellerListings.filter((l) => l.status === "sold").length;
  const totalRevenue = sellerListings
    .filter((l) => l.status === "sold")
    .reduce((sum, l) => sum + (l.current_bid || l.price), 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {!profile.kyc_completed && (
          <Alert className="mb-6 border-primary/50 bg-primary/5">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <AlertTitle>Complete seller verification (KYC)</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3 mt-1">
              <span>
                Verify your identity to build trust with buyers and unlock full seller features.
              </span>
              <a
                href="/kyc"
                className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground h-9 px-4 hover:bg-primary/90"
              >
                Complete KYC
              </a>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">
              Seller Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {profile.display_name || "Seller"}
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Listing
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Listings
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{sellerListings.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeListings} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Items Sold
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{soldListings}</div>
              <p className="text-xs text-muted-foreground">
                Completed sales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                From all sales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Auctions
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {sellerListings.filter((l) => l.listing_type === "auction" && l.status === "active").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently running
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Listings</CardTitle>
            <CardDescription>
              Manage your products and auctions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sellerListings.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No listings yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first listing to start selling
                </p>
                <Button asChild>
                  <Link href="/dashboard/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Listing
                  </Link>
                </Button>
              </div>
            ) : (
              <SellerListingsTable listings={sellerListings} />
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
