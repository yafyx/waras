"use client";

import { Sidebar } from "@/components/chat";
import { useParams, usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

interface ChatMessage {
  role: string;
  content: string;
  createdAt: string | Date;
  id: string;
}

interface ChatInfo {
  id: string;
  messages: ChatMessage[];
  firstMessage: string;
  timestamp: string;
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const [chatList, setChatList] = useState<ChatInfo[]>([]);

  // Cache chat list to pass to sidebar and avoid recreation
  const loadChatList = useCallback(() => {
    try {
      // Get all chat keys from localStorage
      const chatKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith("chat-")
      );

      // Extract and parse chat data
      const chatData = chatKeys
        .map((key) => {
          const id = key.replace("chat-", "");
          try {
            const data = JSON.parse(localStorage.getItem(key) || "{}");
            const firstUserMessage =
              data.messages?.find((m: ChatMessage) => m.role === "user")
                ?.content || "New Chat";
            return {
              id,
              messages: data.messages || [],
              firstMessage:
                firstUserMessage.substring(0, 30) +
                (firstUserMessage.length > 30 ? "..." : ""),
              timestamp: new Date(
                data.messages?.[0]?.createdAt || Date.now()
              ).toLocaleDateString(),
            };
          } catch (e) {
            console.error(`Error parsing chat ${id}:`, e);
            return {
              id,
              messages: [],
              firstMessage: "Error loading chat",
              timestamp: new Date().toLocaleDateString(),
            };
          }
        })
        .filter(Boolean)
        .sort((a, b) => {
          const dateA = new Date(a.messages[0]?.createdAt || 0);
          const dateB = new Date(b.messages[0]?.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });

      setChatList(chatData as ChatInfo[]);
    } catch (error) {
      console.error("Error loading chat list:", error);
    }
  }, []);

  // Load chat list on pathname change
  useEffect(() => {
    loadChatList();

    // Create storage event listener to detect changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === null || e.key.startsWith("chat-")) {
        loadChatList();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [pathname, loadChatList]);

  return (
    <section className="flex h-[100svh] w-full text-white">
      <Sidebar chatList={chatList} currentChatId={params?.id as string} />
      <div className="relative flex w-full flex-col">{children}</div>
    </section>
  );
}
