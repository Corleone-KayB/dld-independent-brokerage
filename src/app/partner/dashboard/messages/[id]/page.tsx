import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/server/rbac/guard";
import { getConversationById } from "@/modules/messaging/service";
import { MessageThread } from "@/components/network/message-thread";

export const metadata: Metadata = { title: "Conversation" };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user?.brokerId) notFound();

  let conversation;
  try {
    conversation = await getConversationById(id, user.brokerId);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold text-charcoal">{conversation.otherBroker.name}</h1>
      <MessageThread conversationId={id} selfBrokerId={user.brokerId} />
    </div>
  );
}
