"use client";

import React from "react"

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Listing, Bid } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Clock,
  Package,
  Download,
  Gavel,
  User,
  ChevronLeft,
  Loader2,
} from "lucide-react";

interface ListingDetailProps {
  listing: Listing;
  bids: Bid[];
  currentUserId?: string;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function getTimeRemaining(endTime: string): string {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return "Auction ended";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days} days, ${hours} hours left`;
  if (hours > 0) return `${hours} hours, ${minutes} minutes left`;
  return `${minutes} minutes left`;
}

export function ListingDetail({ listing, bids, currentUserId }: ListingDetailProps) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [bidAmount, setBidAmount] = useState("");
  const [bidLoading, setBidLoading] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccess, setBidSuccess] = useState(false);

  const typeIcons = {
    digital: Download,
    physical: Package,
    auction: Gavel,
  };
  const TypeIcon = typeIcons[listing.listing_type];

  const isAuction = listing.listing_type === "auction";
  const displayPrice = isAuction
    ? listing.current_bid || listing.starting_bid || 0
    : listing.price;

  const minBid = displayPrice + 0.01;
  const isOwner = currentUserId === listing.seller_id;
  const auctionEnded = isAuction && listing.auction_end_time
    ? new Date(listing.auction_end_time) < new Date()
    : false;

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      router.push("/auth/login");
      return;
    }

    setBidLoading(true);
    setBidError(null);
    setBidSuccess(false);

    const res = await fetch("/api/bids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listing_id: listing.id,
        amount: parseFloat(bidAmount),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setBidError(data.error || "Failed to place bid");
      setBidLoading(false);
      return;
    }

    setBidSuccess(true);
    setBidLoading(false);
    setBidAmount("");
    router.refresh();
  };

  return (
    <div>
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/browse">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Browse
        </Link>
      </Button>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
            {listing.images && listing.images.length > 0 ? (
              <Image
                src={listing.images[selectedImage] || "/placeholder.svg"}
                alt={listing.title}
                width={800}
                height={800}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <TypeIcon className="h-24 w-24 text-muted-foreground/30" />
              </div>
            )}
          </div>
          {listing.images && listing.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {listing.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                    selectedImage === i ? "border-primary" : "border-transparent"
                  }`}
                >
                  <Image
                    src={img || "/placeholder.svg"}
                    alt={`${listing.title} ${i + 1}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={isAuction ? "default" : "secondary"}>
                <TypeIcon className="mr-1 h-3 w-3" />
                {listing.listing_type}
              </Badge>
              {listing.category && (
                <Badge variant="outline">{listing.category.name}</Badge>
              )}
            </div>
            <h1 className="text-3xl font-serif font-bold text-foreground">
              {listing.title}
            </h1>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">
              {formatPrice(displayPrice)}
            </span>
            {isAuction && (
              <span className="text-muted-foreground">
                ({listing.bid_count || 0} bids)
              </span>
            )}
          </div>

          {isAuction && listing.auction_end_time && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{getTimeRemaining(listing.auction_end_time)}</span>
            </div>
          )}

          {/* Seller Info */}
          {listing.seller && (
            <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
              <Avatar>
                <AvatarImage src={listing.seller.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {listing.seller.display_name?.[0] || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">
                  {listing.seller.display_name || "Seller"}
                </p>
                <p className="text-sm text-muted-foreground">Verified Seller</p>
              </div>
            </div>
          )}

          {/* Actions */}
          {isAuction && !auctionEnded && !isOwner ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Place a Bid</CardTitle>
              </CardHeader>
              <CardContent>
                {bidError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{bidError}</AlertDescription>
                  </Alert>
                )}
                {bidSuccess && (
                  <Alert className="mb-4 border-primary">
                    <AlertDescription className="text-primary">
                      Bid placed successfully!
                    </AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleBid} className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min={minBid}
                    placeholder={`Min ${formatPrice(minBid)}`}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    required
                  />
                  <Button type="submit" disabled={bidLoading}>
                    {bidLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Place Bid
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : isAuction && auctionEnded ? (
            <Alert>
              <AlertDescription>This auction has ended.</AlertDescription>
            </Alert>
          ) : isOwner ? (
            <Button asChild className="w-full">
              <Link href={`/dashboard/edit/${listing.id}`}>Edit Listing</Link>
            </Button>
          ) : (
            <Button className="w-full" size="lg">
              Buy Now for {formatPrice(displayPrice)}
            </Button>
          )}

          {/* Description */}
          <div>
            <h2 className="font-semibold text-foreground mb-2">Description</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {listing.description}
            </p>
          </div>

          {/* Shipping Info */}
          {listing.listing_type === "physical" && listing.shipping_info && (
            <div>
              <h2 className="font-semibold text-foreground mb-2">Shipping</h2>
              <p className="text-muted-foreground">{listing.shipping_info}</p>
            </div>
          )}

          {/* Recent Bids */}
          {isAuction && bids.length > 0 && (
            <div>
              <h2 className="font-semibold text-foreground mb-3">Recent Bids</h2>
              <div className="space-y-2">
                {bids.map((bid, i) => (
                  <div
                    key={bid.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      i === 0 ? "bg-primary/10" : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={bid.bidder?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {bid.bidder?.display_name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground">
                        {bid.bidder?.display_name || "Bidder"}
                      </span>
                      {i === 0 && (
                        <Badge variant="default" className="text-xs">Highest</Badge>
                      )}
                    </div>
                    <span className="font-semibold text-foreground">
                      {formatPrice(bid.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
