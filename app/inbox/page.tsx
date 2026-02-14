import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function InboxPage() {
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) redirect("/auth/login");

  const { data: deals } = await supabase
    .from("deals")
    .select(`
      id,
      status,
      created_at,
      listing:listings(id,title,price,listing_type,images),
      buyer:profiles!deals_buyer_id_fkey(id,display_name,email,avatar_url),
      seller:profiles!deals_seller_id_fkey(id,display_name,email,avatar_url)
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Inbox</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(deals || []).length === 0 ? (
              <p className="text-muted-foreground">No deals yet.</p>
            ) : (
              (deals || []).map((d: any) => (
                <Link
                  key={d.id}
                  href={`/inbox/${d.id}`}
                  className="block rounded-lg border border-border p-4 hover:bg-muted/40 transition"
                >
                  <div className="font-medium">{d.listing?.title}</div>
                  <div className="text-sm text-muted-foreground">
                    Status: <span className="capitalize">{d.status}</span>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
