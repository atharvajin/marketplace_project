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

export function DealChatPage({
  dealId,
  listingTitle,
}: {
  dealId: string;
  listingTitle: string;
}) {
  const supabase = createClient();
  const [me, setMe] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const channelName = useMemo(() => `deal:${dealId}`, [dealId]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setMe(data.user?.id ?? null);

      const { data: msgs } = await supabase
        .from("deal_messages")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: true });

      setMessages((msgs as Msg[]) || []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    })();
  }, [dealId, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "deal_messages", filter: `deal_id=eq.${dealId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Msg]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId, channelName, supabase]);

  const send = async () => {
    const body = text.trim();
    if (!body || !me) return;
    setText("");

    await supabase.from("deal_messages").insert({
      deal_id: dealId,
      sender_id: me,
      body,
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="p-4 border-b border-border">
        <div className="text-sm text-muted-foreground">Deal Chat</div>
        <div className="font-semibold">{listingTitle}</div>
      </div>

      <div className="p-4 h-[60vh] overflow-y-auto space-y-2">
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
  );
}
