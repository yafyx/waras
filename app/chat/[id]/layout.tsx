import { loadChatFromLocalStorage } from "@/lib/chat-storage";
import { Metadata, ResolvingMetadata } from "next";
import ChatShell from "@/components/chat/chat-shell";

type Props = {
  params: { id: string };
  children: React.ReactNode;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id;
  let title = "Chat";

  return {
    title: `Chat - Waras AI`,
  };
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
