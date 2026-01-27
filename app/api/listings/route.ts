import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const type = searchParams.get("type");
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabase
    .from("listings")
    .select(`
      *,
      category:categories(*),
      seller:profiles(id, display_name, avatar_url)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) {
    query = query.eq("listing_type", type);
  }

  if (category) {
    query = query.eq("category_id", category);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get bid counts for auctions
  const listingsWithBids = await Promise.all(
    (data || []).map(async (listing) => {
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

  return NextResponse.json(listingsWithBids);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is a seller
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "seller") {
    return NextResponse.json({ error: "Only sellers can create listings" }, { status: 403 });
  }

  const body = await request.json();
  const {
    title,
    description,
    price,
    listing_type,
    category_id,
    images,
    auction_end_time,
    starting_bid,
    shipping_info,
    digital_file_url,
  } = body;

  // Validation
  if (!title || !description || !listing_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (listing_type === "auction" && (!starting_bid || !auction_end_time)) {
    return NextResponse.json({ error: "Auctions require starting bid and end time" }, { status: 400 });
  }

  if ((listing_type === "digital" || listing_type === "physical") && !price) {
    return NextResponse.json({ error: "Price is required for non-auction listings" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("listings")
    .insert({
      seller_id: user.id,
      title,
      description,
      price: price || 0,
      listing_type,
      category_id: category_id || null,
      images: images || [],
      status: "active",
      auction_end_time: auction_end_time || null,
      starting_bid: starting_bid || null,
      current_bid: starting_bid || null,
      shipping_info: shipping_info || null,
      digital_file_url: digital_file_url || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
