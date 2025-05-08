"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Search, Trash2, X, Trash, MessageSquareText } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
  const [isDeleteAllConfirmOpen, setIsDeleteAllConfirmOpen] = useState(false);
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dialogTitleRef = useRef<HTMLDivElement>(null);

  // Load chat list when opened
  useEffect(() => {
    if (isOpen) {
      loadChatList();

      // Ensure search input doesn't get focus
      if (
        searchInputRef.current &&
        document.activeElement === searchInputRef.current
      ) {
        searchInputRef.current.blur();
      }

      // Set focus on the dialog title or container instead
      setTimeout(() => {
        if (dialogTitleRef.current) {
          dialogTitleRef.current.focus();
        }
      }, 0);
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

  const handleDeleteAllChats = () => {
    setIsDeleteAllConfirmOpen(true);
  };

  const confirmDeleteAllChats = () => {
    try {
      // Get all chat keys and delete them
      const chatKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith("chat-")
      );

      chatKeys.forEach((key) => {
        localStorage.removeItem(key);
      });

      // Refresh the chat list
      loadChatList();
      setIsDeleteAllConfirmOpen(false);
      toast("Semua chat telah dihapus");
    } catch (error) {
      console.error("Failed to delete all chats:", error);
      toast("Gagal menghapus semua chat");
    }
  };

  const cancelDeleteAllChats = () => {
    setIsDeleteAllConfirmOpen(false);
  };

  const totalChats = Object.values(groupedChats).flat().length;

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
          <div
            className="p-4 border-b border-neutral-800"
            ref={dialogTitleRef}
            tabIndex={-1}
          >
            <div className="flex items-center w-full rounded-lg relative gap-1.5">
              <div className="flex items-center justify-center">
                <Link href="/" aria-label="Kembali ke halaman utama">
                  <Image
                    src="/waras.png"
                    alt="Waras AI Logo"
                    width={24}
                    height={24}
                    className="select-none"
                    draggable="false"
                  />
                  <VisuallyHidden>Waras AI Beranda</VisuallyHidden>
                </Link>
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
                <Input
                  type="text"
                  placeholder="Cari chat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-8 text-sm placeholder:text-neutral-500 bg-neutral-800/50 focus:bg-neutral-800 border-neutral-700/50 focus:border-neutral-700 rounded-lg transition-all duration-200"
                  aria-label="Cari dalam daftar chat"
                  ref={searchInputRef}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-0 h-7 w-7 text-neutral-500 hover:text-white hover:bg-neutral-700/50 rounded-full cursor-pointer"
                    title="Hapus pencarian"
                    aria-label="Hapus pencarian"
                  >
                    <X className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CredenzaTitle>
        <CredenzaBody className="p-0 overflow-hidden h-[498px]">
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
                    className="gap-2 text-xs bg-transparent border-neutral-700 hover:bg-neutral-800 text-neutral-300 cursor-pointer transition-colors duration-200"
                  >
                    <X className="size-3.5" />
                    Hapus pencarian
                  </Button>
                </>
              ) : (
                <>
                  <MessageSquareText
                    className="size-8 text-neutral-400 mb-3"
                    strokeWidth={1.5}
                  />
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
            <>
              {/* Delete All Chats button - shown only when there are chats and no search */}
              {!searchQuery && totalChats > 0 && (
                <div className="px-3 sm:pb-4 border-b border-neutral-800">
                  <Button
                    variant="ghost"
                    onClick={handleDeleteAllChats}
                    className="w-full justify-center text-xs text-red-500 hover:text-red-400 hover:bg-neutral-800/70 gap-1.5 py-1.5 h-auto transition-colors duration-200"
                  >
                    <Trash className="size-3.5" />
                    Hapus semua chat
                  </Button>
                </div>
              )}
              <div
                className={cn(
                  "h-full overflow-y-auto custom-scrollbar",
                  !searchQuery && totalChats > 0
                    ? "max-h-[calc(498px-40px)]"
                    : "max-h-[498px]"
                )}
              >
                <div className="p-3 pt-2 space-y-3 relative">
                  {Object.entries(groupedChats).map(([dateGroup, chats]) => (
                    <div key={dateGroup} className="space-y-2 pt-0">
                      <div className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur-md py-1.5 px-1.5 -mx-1.5">
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
                          className="transform transition-all duration-300 ease-out"
                          style={{
                            zIndex: chats.length - index,
                          }}
                          onMouseEnter={() => setHoveredChatId(chat.id)}
                          onMouseLeave={() => setHoveredChatId(null)}
                        >
                          <Link
                            href={`/chat/${chat.id}`}
                            className="block relative group bg-neutral-800/40 hover:bg-neutral-800/70 focus-visible:bg-neutral-800/80 border border-neutral-700/50 hover:border-neutral-700 focus-visible:border-neutral-600 rounded-lg px-4 py-3 transition-all duration-200 hover:no-underline shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 hover:scale-[1.015]"
                            onClick={() => setIsOpen(false)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <p className="line-clamp-2 text-sm font-medium text-neutral-200 group-hover:text-white transition-colors duration-200">
                                  {chat.firstMessage}
                                </p>
                                <p className="text-xs text-neutral-500 mt-2">
                                  {chat.timestamp &&
                                    format(
                                      new Date(chat.timestamp),
                                      "EEEE, d MMMM yyyy • HH:mm",
                                      {
                                        locale: id,
                                      }
                                    )}
                                </p>
                              </div>
                              <div
                                className={cn(
                                  "opacity-0 md:group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 ml-2",
                                  hoveredChatId === chat.id && "opacity-100"
                                )}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full hover:bg-neutral-700 hover:text-red-400 transition-colors duration-200 cursor-pointer focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-blue-500 focus-visible:ring-offset-neutral-900"
                                  title="Hapus Chat"
                                  onClick={(e) => handleDeleteChat(e, chat.id)}
                                  aria-label="Hapus chat ini"
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
            </>
          )}
        </CredenzaBody>

        <Dialog
          open={!!chatToDelete}
          onOpenChange={(open) => !open && cancelDelete()}
        >
          <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-neutral-800">
            <DialogHeader>
              <DialogTitle className="text-white text-center sm:text-left">
                Hapus Chat
              </DialogTitle>
              <DialogDescription className="text-neutral-400 text-center sm:text-left">
                Yakin ingin menghapus chat ini? Tindakan ini tidak dapat
                dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center gap-3">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelDelete}
                  className="border-neutral-700 bg-transparent hover:bg-neutral-800 text-neutral-300 transition-colors duration-200"
                >
                  Batal
                </Button>
              </DialogClose>
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
              >
                Hapus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isDeleteAllConfirmOpen}
          onOpenChange={(open) => !open && cancelDeleteAllChats()}
        >
          <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-neutral-800">
            <DialogHeader>
              <DialogTitle className="text-white text-center sm:text-left">
                Hapus Semua Chat
              </DialogTitle>
              <DialogDescription className="text-neutral-400 text-center sm:text-left">
                Yakin ingin menghapus semua chat? Tindakan ini tidak dapat
                dibatalkan dan akan menghapus semua riwayat percakapan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center gap-3">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelDeleteAllChats}
                  className="border-neutral-700 bg-transparent hover:bg-neutral-800 text-neutral-300 transition-colors duration-200"
                >
                  Batal
                </Button>
              </DialogClose>
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmDeleteAllChats}
                className="bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
              >
                Hapus Semua
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
