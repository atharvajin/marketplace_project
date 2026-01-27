"use client";

import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Package, Download, Gavel } from "lucide-react";

interface ListingCardProps {
  listing: Listing;
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

  if (diff <= 0) return "Ended";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export function ListingCard({ listing }: ListingCardProps) {
  const typeIcons = {
    digital: Download,
    physical: Package,
    auction: Gavel,
  };
  const TypeIcon = typeIcons[listing.listing_type];

  const displayPrice =
    listing.listing_type === "auction"
      ? listing.current_bid || listing.starting_bid || 0
      : listing.price;

  return (
    <Link href={`/listing/${listing.id}`}>
      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {listing.images && listing.images.length > 0 ? (
            <Image
              src={listing.images[0] || "/placeholder.svg"}
              alt={listing.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <TypeIcon className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-1.5">
            <Badge
              variant={listing.listing_type === "auction" ? "default" : "secondary"}
              className="text-xs"
            >
              <TypeIcon className="mr-1 h-3 w-3" />
              {listing.listing_type}
            </Badge>
          </div>
          {listing.listing_type === "auction" && listing.auction_end_time && (
            <div className="absolute bottom-2 right-2">
              <Badge variant="outline" className="bg-card/90 backdrop-blur text-xs">
                <Clock className="mr-1 h-3 w-3" />
                {getTimeRemaining(listing.auction_end_time)}
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {listing.description}
          </p>
        </CardContent>
        <CardFooter className="px-4 pb-4 pt-0 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-primary">
              {formatPrice(displayPrice)}
            </p>
            {listing.listing_type === "auction" && (
              <p className="text-xs text-muted-foreground">
                {listing.bid_count || 0} bids
              </p>
            )}
          </div>
          {listing.category && (
            <Badge variant="outline" className="text-xs">
              {listing.category.name}
            </Badge>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
