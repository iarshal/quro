import { MessagePane } from '../../../components/MessagePane';

export default function ChatThreadPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <MessagePane
      conversationId={params.id}
      otherUser={{ id: params.id, display_name: 'Secure Contact', avatar_url: null }}
      currentProfile={{ id: 'local-user' }}
    />
  );
}
