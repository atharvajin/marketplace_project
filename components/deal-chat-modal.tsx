"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Msg = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export function DealChatModal({
  open,
  onClose,
  listingId,
  sellerId,
  listingTitle,
}: {
  open: boolean;
  onClose: () => void;
  listingId: string;
  sellerId: string;
  listingTitle: string;
}) {
  const supabase = createClient();
  const [dealId, setDealId] = useState<string | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const channelName = useMemo(() => (dealId ? `deal:${dealId}` : null), [dealId]);

  useEffect(() => {
    if (!open) return;

    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const user = u.user;
      if (!user) return;

      setMe(user.id);

      // Find existing deal for this buyer+listing
      const { data: existing } = await supabase
        .from("deals")
        .select("id")
        .eq("listing_id", listingId)
        .eq("buyer_id", user.id)
        .maybeSingle();

      if (existing?.id) {
        setDealId(existing.id);
        return;
      }

      // Create deal
      const { data: created, error } = await supabase
        .from("deals")
        .insert({
          listing_id: listingId,
          buyer_id: user.id,
          seller_id: sellerId,
        })
        .select("id")
        .single();

      if (!error) setDealId(created.id);
    })();
  }, [open, listingId, sellerId, supabase]);

  // Load messages when dealId set
  useEffect(() => {
    if (!open || !dealId) return;

    (async () => {
      const { data } = await supabase
        .from("deal_messages")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: true });

      setMessages((data as Msg[]) || []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    })();
  }, [open, dealId, supabase]);

  // Realtime subscription (works only if table is added to supabase_realtime publication)
  useEffect(() => {
    if (!open || !dealId || !channelName) return;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "deal_messages", filter: `deal_id=eq.${dealId}` },
        (payload) => {
          const m = payload.new as Msg;
          setMessages((prev) => [...prev, m]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, dealId, channelName, supabase]);

  const send = async () => {
    if (!dealId || !me) return;
    const body = text.trim();
    if (!body) return;

    setText("");

    await supabase.from("deal_messages").insert({
      deal_id: dealId,
      sender_id: me,
      body,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <div className="text-sm text-muted-foreground">Deal chat</div>
            <div className="font-semibold">{listingTitle}</div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="p-4 h-[55vh] sm:h-[50vh] overflow-y-auto space-y-2">
          {messages.map((m) => {
            const mine = m.sender_id === me;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm border ${
                    mine
                      ? "bg-primary text-primary-foreground border-primary/30"
                      : "bg-muted border-border"
                  }`}
                >
                  {m.body}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-border flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message…"
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <Button onClick={send}>Send</Button>
        </div>
      </div>
    </div>
  );
}
