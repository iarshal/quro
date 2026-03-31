// @ts-nocheck
import { MessagePane } from '@/components/MessagePane';

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <MessagePane conversationId={resolvedParams.id} />;
}
