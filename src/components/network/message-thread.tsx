"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MessageItem {
  id: string;
  body: string;
  createdAt: string;
  senderBrokerId: string;
  sender: { id: string; name: string };
}

/**
 * Authenticated polling, per decision 4 (no WebSocket/pub-sub dependency) —
 * refetches the full thread every 4s while mounted.
 */
export function MessageThread({ conversationId, selfBrokerId }: { conversationId: string; selfBrokerId: string }) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/network/conversations/${conversationId}/messages`);
    const json = await res.json().catch(() => null);
    if (res.ok && json?.data) setMessages(json.data);
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    if (!draft.trim()) return;
    setSending(true);
    setError(null);
    const res = await fetch(`/api/network/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft }),
    });
    const json = await res.json().catch(() => null);
    setSending(false);
    if (!res.ok) {
      setError(json?.error?.message ?? "Could not send message");
      return;
    }
    setDraft("");
    await fetchMessages();
  }

  return (
    <div className="flex h-[60vh] flex-col rounded-2xl border border-charcoal/10 bg-white">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-charcoal/40">No messages yet — say hello.</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderBrokerId === selfBrokerId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                    mine ? "bg-champagne text-charcoal" : "bg-charcoal/5 text-charcoal"
                  }`}
                >
                  {!mine && <p className="mb-0.5 text-xs font-medium text-charcoal/50">{m.sender.name}</p>}
                  <p className="whitespace-pre-line">{m.body}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-charcoal/10 p-3">
        {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Input
            placeholder="Type a message…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button size="sm" disabled={sending || !draft.trim()} onClick={send}>
            {sending ? "Sending…" : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
