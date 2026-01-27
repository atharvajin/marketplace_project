import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get("listing_id");

  if (!listingId) {
    return NextResponse.json({ error: "listing_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("bids")
    .select(`
      *,
      bidder:profiles(id, display_name, avatar_url)
    `)
    .eq("listing_id", listingId)
    .order("amount", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { listing_id, amount } = body;

  if (!listing_id || !amount) {
    return NextResponse.json({ error: "listing_id and amount are required" }, { status: 400 });
  }

  // Get the listing
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listing_id)
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Validate it's an auction
  if (listing.listing_type !== "auction") {
    return NextResponse.json({ error: "This listing is not an auction" }, { status: 400 });
  }

  // Check if auction has ended
  if (listing.auction_end_time && new Date(listing.auction_end_time) < new Date()) {
    return NextResponse.json({ error: "This auction has ended" }, { status: 400 });
  }

  // Check if bid is higher than current
  const minBid = listing.current_bid || listing.starting_bid || 0;
  if (amount <= minBid) {
    return NextResponse.json({ error: `Bid must be higher than $${minBid.toFixed(2)}` }, { status: 400 });
  }

  // Don't allow seller to bid on own listing
  if (listing.seller_id === user.id) {
    return NextResponse.json({ error: "Cannot bid on your own listing" }, { status: 400 });
  }

  // Create the bid
  const { data: bid, error: bidError } = await supabase
    .from("bids")
    .insert({
      listing_id,
      bidder_id: user.id,
      amount,
    })
    .select()
    .single();

  if (bidError) {
    return NextResponse.json({ error: bidError.message }, { status: 500 });
  }

  // Update the listing's current bid
  await supabase
    .from("listings")
    .update({ current_bid: amount })
    .eq("id", listing_id);

  return NextResponse.json(bid, { status: 201 });
}
