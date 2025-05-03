"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Trash2, X } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { id } from "date-fns/locale";
import {
  Credenza,
  CredenzaContent,
  CredenzaBody,
  CredenzaTrigger,
  CredenzaTitle,
} from "@/components/credenza";
import { Button } from "@/components/ui/button";
import {
  getAllChatsFromLocalStorage,
  deleteChatFromLocalStorage,
  ChatInfo,
} from "@/lib/chat-storage";
import Link from "next/link";
import { toast } from "sonner";
import Image from "next/image";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";

interface RiwayatCredenzaProps {
  trigger: React.ReactNode;
}

export function RiwayatCredenza({ trigger }: RiwayatCredenzaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatList, setChatList] = useState<ChatInfo[]>([]);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);

  // Load chat list when opened
  useEffect(() => {
    if (isOpen) {
      loadChatList();
    }
  }, [isOpen]);

  // Listen for chat list refresh events
  useEffect(() => {
    const handleRefresh = () => {
      if (isOpen) {
        loadChatList();
      }
    };

    window.addEventListener("waras:refreshChatList", handleRefresh);
    return () => {
      window.removeEventListener("waras:refreshChatList", handleRefresh);
    };
  }, [isOpen]);

  const loadChatList = () => {
    const chats = getAllChatsFromLocalStorage();
    setChatList(chats);
  };

  // Group chats by date
  const groupedChats = useMemo(() => {
    // Filter chats by search query if present
    const filteredChats = searchQuery.trim()
      ? chatList.filter((chat) =>
          chat.firstMessage?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : chatList;

    // Group chats by date
    const grouped: Record<string, ChatInfo[]> = {};

    filteredChats.forEach((chat) => {
      if (!chat.timestamp) return;

      const chatDate = new Date(chat.timestamp);
      const today = new Date();

      let dateGroup = "";

      // Today
      if (isToday(chatDate)) {
        dateGroup = "Hari Ini";
      }
      // Yesterday
      else if (isYesterday(chatDate)) {
        dateGroup = "Kemarin";
      }
      // This week (within 7 days)
      else if (
        (today.getTime() - chatDate.getTime()) / (1000 * 60 * 60 * 24) <
        7
      ) {
        dateGroup = "Minggu Ini";
      }
      // This month
      else if (
        chatDate.getMonth() === today.getMonth() &&
        chatDate.getFullYear() === today.getFullYear()
      ) {
        dateGroup = "Bulan Ini";
      }
      // Older
      else {
        dateGroup = "Sebelumnya";
      }

      if (!grouped[dateGroup]) {
        grouped[dateGroup] = [];
      }

      grouped[dateGroup].push(chat);
    });

    return grouped;
  }, [chatList, searchQuery]);

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setChatToDelete(chatId);
  };

  const confirmDelete = () => {
    if (chatToDelete) {
      deleteChatFromLocalStorage(chatToDelete);
      setChatToDelete(null);
      loadChatList();
      toast("Chat telah dihapus");
    }
  };

  const cancelDelete = () => {
    setChatToDelete(null);
  };

  return (
    <Credenza open={isOpen} onOpenChange={setIsOpen}>
      <CredenzaTrigger asChild>
        <div
          onClick={(e) => {
            // Prevent click from bubbling up to the DropdownMenuItem
            e.stopPropagation();
            // Explicitly toggle the open state when clicking anywhere on the trigger
            setIsOpen(!isOpen);
          }}
          className="w-full h-full"
        >
          {trigger}
        </div>
      </CredenzaTrigger>
      <CredenzaContent className="bg-neutral-900 border-neutral-800 p-0 overflow-hidden rounded-2xl">
        <CredenzaTitle>
          <div className="p-3 border-b border-neutral-800">
            <div className="flex items-center w-full rounded-lg relative">
              <div className="flex items-center justify-center pl-2.5 pr-1">
                <Image
                  src="/waras.png"
                  alt="Waras AI Logo"
                  width={24}
                  height={24}
                  className="select-none"
                  draggable="false"
                />
              </div>
              <input
                type="text"
                placeholder="Cari chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 pl-1 pr-4 text-sm placeholder:text-neutral-500 focus:outline-none transition-all duration-200"
                aria-label="Cari dalam daftar chat"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0 h-auto w-auto text-neutral-500 hover:text-white hover:bg-transparent cursor-pointer"
                  title="Hapus pencarian"
                  aria-label="Hapus pencarian"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </CredenzaTitle>
        <CredenzaBody className="p-0 overflow-hidden h-[calc(600px-102px)]">
          {Object.entries(groupedChats).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center animate-in fade-in-50 duration-300">
              {searchQuery ? (
                <>
                  <Search
                    className="size-8 text-neutral-400 mb-3"
                    strokeWidth={1.5}
                  />
                  <p className="text-sm font-medium mb-1 text-neutral-300">
                    Tidak ditemukan
                  </p>
                  <p className="text-xs text-neutral-500 max-w-[220px] mb-4">
                    Tidak ada chat yang cocok dengan &quot;{searchQuery}&quot;
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="gap-2 text-xs bg-transparent border-neutral-700 hover:bg-neutral-800 text-neutral-300 cursor-pointer"
                  >
                    Hapus pencarian
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium mb-1 text-neutral-300">
                    Belum ada riwayat Chat
                  </p>
                  <p className="text-xs text-neutral-500 max-w-[220px] mb-4">
                    Mulai Chat baru untuk percakapan pribadi dengan Waras AI
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="h-full overflow-y-auto custom-scrollbar">
              <div className="p-3 space-y-5">
                {Object.entries(groupedChats).map(([dateGroup, chats]) => (
                  <div key={dateGroup} className="space-y-0 pt-0">
                    <div className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur-sm py-1 px-1 mt-0">
                      <h3 className="text-xs font-medium text-neutral-500 tracking-wider">
                        {dateGroup}
                        <span className="ml-2 text-xs bg-neutral-800 text-neutral-400 rounded-full px-2 py-0.5">
                          {chats.length}
                        </span>
                      </h3>
                    </div>
                    {chats.map((chat, index) => (
                      <div
                        key={chat.id}
                        className={cn(
                          "transform transition-all duration-300 ease-out mb-2",
                          index > 0 && "mt-2" // Added gap between items
                        )}
                        style={{
                          zIndex: chats.length - index,
                        }}
                        onMouseEnter={() => setHoveredChatId(chat.id)}
                        onMouseLeave={() => setHoveredChatId(null)}
                      >
                        <Link
                          href={`/chat/${chat.id}`}
                          className="block relative group bg-neutral-800/40 hover:bg-neutral-800/80 border border-neutral-700/50 hover:border-neutral-700 rounded-xl px-4 py-3.5 transition-all duration-200 hover:no-underline shadow-sm hover:shadow-md"
                          onClick={() => setIsOpen(false)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <p className="line-clamp-2 text-sm font-medium text-neutral-200 group-hover:text-white transition-colors duration-200">
                                {chat.firstMessage}
                              </p>
                              <p className="text-xs text-neutral-500 mt-2">
                                {chat.timestamp &&
                                  format(new Date(chat.timestamp), "HH:mm", {
                                    locale: id,
                                  })}
                              </p>
                            </div>
                            <div
                              className={cn(
                                "opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2",
                                hoveredChatId === chat.id && "opacity-100"
                              )}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-neutral-700 hover:text-red-400 transition-all duration-200 cursor-pointer"
                                title="Hapus Chat"
                                onClick={(e) => handleDeleteChat(e, chat.id)}
                                aria-label="Hapus chat ini"
                                tabIndex={0}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CredenzaBody>

        {chatToDelete && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
            <div className="bg-neutral-900 p-4 rounded-lg shadow-lg max-w-[300px] w-full text-center space-y-4 border border-neutral-800">
              <h3 className="font-medium text-white">Hapus Chat</h3>
              <p className="text-sm text-neutral-400">
                Yakin ingin menghapus chat ini? Tindakan ini tidak dapat
                dibatalkan.
              </p>
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelDelete}
                  className="border-neutral-700 bg-transparent hover:bg-neutral-800 text-neutral-300"
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Hapus
                </Button>
              </div>
            </div>
          </div>
        )}
      </CredenzaContent>
    </Credenza>
  );
}

// Add global style for custom scrollbar
export function GlobalStyle() {
  return (
    <style jsx global>{`
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(115, 115, 115, 0.3);
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: rgba(140, 140, 140, 0.5);
      }
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(115, 115, 115, 0.3) transparent;
      }

      /* Animation utilities */
      .animate-in {
        animation-duration: 150ms;
        animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        will-change: transform, opacity;
      }
      .fade-in-50 {
        animation-name: fadeIn;
        opacity: 0;
        animation-fill-mode: forwards;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `}</style>
  );
}
