import ChatShell from "@/components/chat/chat-shell";

export const metadata = {
  title: "Waras AI",
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChatShell>{children}</ChatShell>;
}
