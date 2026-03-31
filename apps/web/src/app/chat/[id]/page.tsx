// @ts-nocheck
import MessagePane from '@/components/MessagePane';

export default function ChatThreadPage({
  params,
}: {
  params: { id: string };
}) {
  return <MessagePane conversationId={params.id} />;
}
