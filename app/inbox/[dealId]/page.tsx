import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { DealChatPage } from "@/components/deal-chat-page";

export default async function DealChatRoute({
  params,
}: {
  params: { dealId: string };
}) {
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) redirect("/auth/login");

  const { data: deal } = await supabase
    .from("deals")
    .select(`
      id,
      buyer_id,
      seller_id,
      listing:listings (
        id,
        title
      )
    `)
    .eq("id", params.dealId)
    .single();

  if (!deal) redirect("/inbox");

  // Only participants can open
  if (deal.buyer_id !== user.id && deal.seller_id !== user.id) {
    redirect("/inbox");
  }

  // Supabase can sometimes type nested selects as array, normalize it safely:
  const listingObj: any = Array.isArray((deal as any).listing)
    ? (deal as any).listing[0]
    : (deal as any).listing;

  const title = listingObj?.title ?? "Deal";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <DealChatPage dealId={deal.id} listingTitle={title} />
      </main>
      <Footer />
    </div>
  );
}
