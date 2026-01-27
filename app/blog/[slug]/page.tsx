import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, User, Calendar, Clock } from "lucide-react";
import type { BlogPost } from "@/lib/types";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function estimateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("blog_posts")
    .select(`
      *,
      author:profiles(id, display_name, avatar_url)
    `)
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error || !post) {
    notFound();
  }

  const blogPost = post as BlogPost;
  const readTime = estimateReadTime(blogPost.content);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <article className="container mx-auto px-4 py-8 max-w-3xl">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/blog">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>

          {blogPost.cover_image && (
            <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-8">
              <Image
                src={blogPost.cover_image || "/placeholder.svg"}
                alt={blogPost.title}
                width={800}
                height={450}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4 text-balance">
              {blogPost.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={blogPost.author?.avatar_url || undefined} />
                  <AvatarFallback>
                    {blogPost.author?.display_name?.[0] || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">
                  {blogPost.author?.display_name || "Author"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(blogPost.created_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{readTime} min read</span>
              </div>
            </div>
          </header>

          <div className="prose prose-lg max-w-none">
            <div className="text-foreground whitespace-pre-wrap leading-relaxed">
              {blogPost.content}
            </div>
          </div>

          <footer className="mt-12 pt-8 border-t border-border">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={blogPost.author?.avatar_url || undefined} />
                <AvatarFallback className="text-lg">
                  {blogPost.author?.display_name?.[0] || <User className="h-6 w-6" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">
                  Written by {blogPost.author?.display_name || "Author"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Marketplace community member
                </p>
              </div>
            </div>
          </footer>
        </article>
      </main>
      <Footer />
    </div>
  );
}
