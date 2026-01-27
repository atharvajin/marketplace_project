"use client";

import React from "react"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, Package, Gavel, ImagePlus, X } from "lucide-react";
import type { Category, ListingType } from "@/lib/types";

export function CreateListingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [listingType, setListingType] = useState<ListingType>("physical");

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [shippingInfo, setShippingInfo] = useState("");
  const [digitalFileUrl, setDigitalFileUrl] = useState("");
  const [startingBid, setStartingBid] = useState("");
  const [auctionEndTime, setAuctionEndTime] = useState("");

  useEffect(() => {
    async function fetchCategories() {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    }
    fetchCategories();
  }, []);

  const addImage = () => {
    if (newImageUrl && !images.includes(newImageUrl)) {
      setImages([...images, newImageUrl]);
      setNewImageUrl("");
    }
  };

  const removeImage = (url: string) => {
    setImages(images.filter((img) => img !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload: Record<string, unknown> = {
      title,
      description,
      listing_type: listingType,
      category_id: categoryId || null,
      images,
    };

    if (listingType === "auction") {
      payload.starting_bid = parseFloat(startingBid);
      payload.auction_end_time = new Date(auctionEndTime).toISOString();
    } else {
      payload.price = parseFloat(price);
    }

    if (listingType === "physical") {
      payload.shipping_info = shippingInfo;
    }

    if (listingType === "digital") {
      payload.digital_file_url = digitalFileUrl;
    }

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create listing");
      setLoading(false);
      return;
    }

    const listing = await res.json();
    router.push(`/listing/${listing.id}`);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Listing</CardTitle>
        <CardDescription>
          Fill in the details below to create a new listing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs value={listingType} onValueChange={(v) => setListingType(v as ListingType)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="physical" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Physical
              </TabsTrigger>
              <TabsTrigger value="digital" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Digital
              </TabsTrigger>
              <TabsTrigger value="auction" className="flex items-center gap-2">
                <Gavel className="h-4 w-4" />
                Auction
              </TabsTrigger>
            </TabsList>

            <TabsContent value="physical" className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shipping">Shipping Information</Label>
                <Textarea
                  id="shipping"
                  placeholder="Shipping methods, delivery times, etc."
                  value={shippingInfo}
                  onChange={(e) => setShippingInfo(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="digital" className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="digitalUrl">Digital File URL</Label>
                <Input
                  id="digitalUrl"
                  type="url"
                  placeholder="https://example.com/file.zip"
                  value={digitalFileUrl}
                  onChange={(e) => setDigitalFileUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Link to the digital file (will be shared after purchase)
                </p>
              </div>
            </TabsContent>

            <TabsContent value="auction" className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startingBid">Starting Bid ($)</Label>
                  <Input
                    id="startingBid"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={startingBid}
                    onChange={(e) => setStartingBid(e.target.value)}
                    required={listingType === "auction"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Auction End Time</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={auctionEndTime}
                    onChange={(e) => setAuctionEndTime(e.target.value)}
                    required={listingType === "auction"}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What are you selling?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your item in detail..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {listingType !== "auction" && (
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Images</Label>
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={addImage}>
                <ImagePlus className="h-4 w-4" />
              </Button>
            </div>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="relative group bg-muted rounded-md overflow-hidden"
                  >
                    <img
                      src={img || "/placeholder.svg"}
                      alt={`Preview ${i + 1}`}
                      className="h-20 w-20 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(img)}
                      className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="h-5 w-5 text-background" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Listing
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
