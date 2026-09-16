import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser } from "@/server/rbac/guard";
import { listConversationsForBroker } from "@/modules/messaging/service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const user = await getSessionUser();
  if (!user?.brokerId) {
    return (
      <Card className="p-10 text-center text-charcoal/50">
        Network messaging is available to broker accounts only.
      </Card>
    );
  }

  const conversations = await listConversationsForBroker(user.brokerId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Messages</h1>
        <p className="mt-1 text-charcoal/60">
          Direct messages with brokers you are connected with on the Independent Brokerage Network.
        </p>
      </div>

      {conversations.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">
          No conversations yet. Message a connection from the{" "}
          <Link href="/partner/dashboard/network" className="underline">
            Network
          </Link>{" "}
          page to get started.
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <Link key={c.id} href={`/partner/dashboard/messages/${c.id}`}>
              <Card className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-charcoal/5">
                <div>
                  <p className="font-medium text-charcoal">{c.otherBroker.name}</p>
                  {c.lastMessage && (
                    <p className="mt-0.5 max-w-md truncate text-sm text-charcoal/50">{c.lastMessage.body}</p>
                  )}
                </div>
                {c.unreadCount > 0 && <Badge tone="champagne">{c.unreadCount} new</Badge>}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
