"use client";

import React from "react"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Package, Download, Gavel, X } from "lucide-react";
import type { Listing, Category } from "@/lib/types";

interface BrowseContentProps {
  listings: Listing[];
  categories: Category[];
  initialFilters: {
    type?: string;
    category?: string;
    search?: string;
  };
}

export function BrowseContent({ listings, categories, initialFilters }: BrowseContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || "");

  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/browse?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters("search", searchQuery || null);
  };

  const clearFilters = () => {
    setSearchQuery("");
    router.push("/browse");
  };

  const hasFilters = initialFilters.type || initialFilters.category || initialFilters.search;

  const typeLabels: Record<string, { label: string; icon: typeof Package }> = {
    digital: { label: "Digital", icon: Download },
    physical: { label: "Physical", icon: Package },
    auction: { label: "Auction", icon: Gavel },
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground">Browse Marketplace</h1>
        <p className="text-muted-foreground mt-1">
          {listings.length} {listings.length === 1 ? "item" : "items"} available
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <div className="flex gap-2">
          <Select
            value={initialFilters.type || "all"}
            onValueChange={(v) => updateFilters("type", v === "all" ? null : v)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="digital">Digital</SelectItem>
              <SelectItem value="physical">Physical</SelectItem>
              <SelectItem value="auction">Auction</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={initialFilters.category || "all"}
            onValueChange={(v) => updateFilters("category", v === "all" ? null : v)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {initialFilters.type && (
            <Badge variant="secondary" className="gap-1">
              {typeLabels[initialFilters.type]?.label || initialFilters.type}
              <button
                onClick={() => updateFilters("type", null)}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {initialFilters.category && (
            <Badge variant="secondary" className="gap-1">
              {categories.find((c) => c.id === initialFilters.category)?.name || "Category"}
              <button
                onClick={() => updateFilters("category", null)}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {initialFilters.search && (
            <Badge variant="secondary" className="gap-1">
              {`"${initialFilters.search}"`}
              <button
                onClick={() => {
                  setSearchQuery("");
                  updateFilters("search", null);
                }}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            Clear all
          </Button>
        </div>
      )}

      {/* Listings Grid */}
      {listings.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card border border-border rounded-lg">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No listings found</h3>
          <p className="text-muted-foreground mb-4">
            {hasFilters
              ? "Try adjusting your filters to find more items"
              : "Be the first to list something!"}
          </p>
          {hasFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
