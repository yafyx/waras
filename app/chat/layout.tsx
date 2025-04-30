"use client";

import { Sidebar } from "@/components/chat";
import { useParams, usePathname } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getAllChatsFromLocalStorage,
  isStorageAvailable,
  ChatInfo,
} from "@/lib/chat-storage";
import { toast } from "sonner";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const [chatList, setChatList] = useState<ChatInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageAvailable] = useState(() => isStorageAvailable());

  // Load and cache chat list
  const loadChatList = useCallback(() => {
    if (!storageAvailable) {
      setIsLoading(false);
      setChatList([]);
      return;
    }

    setIsLoading(true);

    try {
      // Use setTimeout to defer intensive operations
      setTimeout(() => {
        const chats = getAllChatsFromLocalStorage();
        setChatList(chats);
        setIsLoading(false);
      }, 0);
    } catch (error) {
      console.error("Error loading chat list:", error);
      toast("Failed to load chat list");
      setIsLoading(false);
    }
  }, [storageAvailable]);

  // Memoize the current chat ID to prevent unnecessary rerenders
  const currentChatId = useMemo(() => params?.id as string, [params]);

  // Load chat list on mount and when storage changes, but not on every pathname change
  useEffect(() => {
    if (!storageAvailable) {
      toast(
        "Local storage is not available. Chat history won't be saved or loaded."
      );
    }

    // Initial load
    loadChatList();

    // Create storage event listener to detect changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === null || e.key.startsWith("chat-")) {
        // Debounce the loadChatList calls to avoid performance issues
        // when multiple storage events fire in rapid succession
        const timeoutId = setTimeout(() => {
          loadChatList();
        }, 300);

        return () => clearTimeout(timeoutId);
      }
    };

    // Listen for storage events (from other tabs/windows)
    window.addEventListener("storage", handleStorageChange);

    // Listen for custom refresh events (from within the same tab)
    const handleCustomRefresh = () => {
      loadChatList();
    };

    window.addEventListener("waras:refreshChatList", handleCustomRefresh);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("waras:refreshChatList", handleCustomRefresh);
    };
  }, [loadChatList, storageAvailable]);

  // Memoize the return value to prevent unnecessary rerenders
  return useMemo(
    () => (
      <section className="flex h-[100svh] w-full text-white">
        <Sidebar chatList={chatList} currentChatId={currentChatId} />
        <div className="relative flex w-full flex-col">{children}</div>
      </section>
    ),
    [chatList, children, currentChatId]
  );
}
