"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Plus,
  Lock,
  Search,
  Settings,
  Trash2,
  Grid,
  X,
  Loader2,
  Grid2X2Plus,
  Grid2X2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { timeAgo } from "@/lib/utils";
import {
  getAllChatsFromLocalStorage,
  deleteChatFromLocalStorage,
  ChatInfo,
} from "@/lib/chat-storage";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loading } from "@/components/chat";

interface ChatMessage {
  role: string;
  content: string;
  createdAt: string | Date;
  id: string;
}

interface SidebarProps {
  chatList?: ChatInfo[];
  currentChatId?: string;
}

export function Sidebar({ chatList = [], currentChatId }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [localChatList, setLocalChatList] = useState<ChatInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Load chats on mount and when storage changes
  useEffect(() => {
    const loadChats = () => {
      try {
        setIsLoading(true);
        const chats = getAllChatsFromLocalStorage();
        setLocalChatList(chats);
      } catch (error) {
        console.error("Error loading chat list:", error);
        toast("Gagal memuat daftar obrolan");
      } finally {
        setIsLoading(false);
      }
    };

    // Initial load
    loadChats();

    // Listen for refresh events
    const refreshHandler = () => {
      loadChats();
    };
    window.addEventListener("waras:refreshChatList", refreshHandler);

    // Listen for storage events from other tabs
    const storageHandler = (e: StorageEvent) => {
      if (e.key === null || e.key.startsWith("chat-")) {
        loadChats();
      }
    };
    window.addEventListener("storage", storageHandler);

    return () => {
      window.removeEventListener("waras:refreshChatList", refreshHandler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Ctrl/Cmd + N for new chat
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        handleNewChat();
        router.push("/chat");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  // Determine which list to use - either the prop or our local state
  const effectiveChatList = chatList.length > 0 ? chatList : localChatList;

  const filteredChats = searchQuery.trim()
    ? effectiveChatList.filter((chat) =>
        chat.firstMessage?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : effectiveChatList;

  // Handler for new chat button to dispatch a custom event
  const handleNewChat = () => {
    window.dispatchEvent(new CustomEvent("waras:refreshChatList"));
  };

  // Handler for chat deletion
  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();

    setChatToDelete(chatId);
    setIsDeleteDialogOpen(true);
  };

  // Handle actual deletion after confirmation
  const confirmDelete = () => {
    if (!chatToDelete) return;

    const success = deleteChatFromLocalStorage(chatToDelete);

    if (success) {
      if (currentChatId === chatToDelete) {
        // If we're on the chat that was deleted, redirect to new chat
        router.push("/chat");
      }
      toast("Obrolan berhasil dihapus", {
        description: "Chat telah dihapus dari perangkat Anda",
        icon: <Trash2 className="size-4 text-red-400" />,
      });
    } else {
      toast("Gagal menghapus obrolan", {
        description: "Terjadi kesalahan saat menghapus chat",
        icon: <X className="size-4 text-red-400" />,
      });
    }

    // Reset state
    setChatToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  // Handle cancel deletion
  const cancelDelete = () => {
    setChatToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <nav
        className="hidden w-[300px] flex-shrink-0 p-4 lg:block"
        ref={sidebarRef}
        aria-label="Chat sidebar"
      >
        <section className="flex h-full flex-col rounded-2xl border border-neutral-800 bg-neutral-900 shadow-lg">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-fit w-full items-center justify-between rounded-t-2xl border-b border-neutral-800 bg-gradient-to-r from-neutral-900 to-neutral-950 p-4 hover:bg-neutral-800/50 transition-all duration-300 cursor-pointer"
                aria-label="Menu aplikasi Waras AI"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center size-7 bg-gradient-to-br rounded-full shadow-sm">
                    <Image
                      src="/waras.png"
                      alt="Waras AI Logo"
                      width={24}
                      height={24}
                      className="select-none"
                      draggable="false"
                    />
                  </div>
                  <span className="font-medium">Waras AI</span>
                </div>
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={0}
              className="w-[266px] bg-[#121212] text-white border border-neutral-800 rounded-b-2xl rounded-t-none p-1.5"
              style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
            >
              <DropdownMenuItem
                className="flex items-center gap-3 rounded-xl px-5 py-2 text-lg hover:bg-neutral-800 cursor-pointer"
                asChild
              >
                <Link href="/">
                  <Image
                    src="/waras.png"
                    alt="Waras AI Logo"
                    width={20}
                    height={20}
                    className="select-none mr-2"
                    draggable="false"
                  />
                  Beranda
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-3 rounded-xl px-5 py-2 text-lg hover:bg-neutral-800 cursor-pointer"
                asChild
              >
                <Link href="/chat" onClick={handleNewChat}>
                  <Plus className="size-6 mr-2" />
                  Chat Baru
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-3 rounded-xl px-5 py-2 text-lg hover:bg-neutral-800 cursor-pointer"
                asChild
              >
                <Link href="/grid">
                  <Grid2X2 className="size-6 mr-2" />
                  Grid
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="p-3">
            <Button
              asChild
              className="w-full justify-start gap-2 bg-white text-black hover:bg-neutral-100 transition-colors duration-300 ease-in-out hover:opacity-85 cursor-pointer"
              onClick={handleNewChat}
              aria-label="Buat chat baru"
            >
              <Link href="/chat">
                <Plus className="size-4" />
                <span>Chat Baru</span>
                <kbd className="ml-auto hidden text-xs rounded border border-neutral-300 bg-neutral-100 px-1.5 py-0.5 text-neutral-600 sm:inline-block">
                  Ctrl+N
                </kbd>
              </Link>
            </Button>

            <div className="relative mt-3 mb-2">
              <div className="absolute left-2.5 top-2.5 text-neutral-500">
                <Search className="size-4" />
              </div>
              <input
                type="text"
                placeholder="Cari chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                ref={searchInputRef}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800/70 py-2 pl-9 pr-9 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600/50 transition-all duration-200"
                aria-label="Cari dalam daftar chat"
              />
              {searchQuery ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 p-0 h-auto w-auto text-neutral-500 hover:text-white hover:bg-transparent cursor-pointer"
                  title="Hapus pencarian"
                  aria-label="Hapus pencarian"
                >
                  <X className="size-4" />
                </Button>
              ) : (
                <div className="absolute right-2.5 top-2.5 text-neutral-600 text-xs bg-neutral-700/50 px-1.5 py-0.5 rounded-md">
                  Ctrl+K
                </div>
              )}
            </div>
          </div>

          <div className="flex-grow overflow-y-auto px-3 pb-3 pt-0 custom-scrollbar">
            {isLoading ? (
              <div className="py-4">
                <Loading tool="getInformation" />
              </div>
            ) : (
              <>
                {filteredChats.length > 0 && (
                  <div className="flex items-center justify-between sticky top-0 bg-neutral-900 py-2 z-10">
                    <h5 className="px-1 text-neutral-400 text-sm font-medium tracking-tight">
                      Chat Terbaru
                    </h5>
                    {filteredChats.length > 0 && (
                      <span className="text-xs text-neutral-500 px-1 bg-neutral-800 rounded-full">
                        {filteredChats.length}
                      </span>
                    )}
                  </div>
                )}
                <div className="mt-1 flex flex-col gap-1.5">
                  {filteredChats.length > 0 ? (
                    filteredChats.map((chat) => (
                      <div
                        key={chat.id}
                        className="relative group"
                        onMouseEnter={() => setHoveredChatId(chat.id)}
                        onMouseLeave={() => setHoveredChatId(null)}
                      >
                        <Link
                          href={`/chat/${chat.id}`}
                          className={`flex flex-col items-start rounded-xl border px-3 py-2.5 transition-all duration-200 hover:bg-neutral-800/70 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 ${
                            currentChatId === chat.id
                              ? "border-neutral-700 bg-neutral-800 shadow-sm"
                              : "border-transparent"
                          }`}
                          aria-current={
                            currentChatId === chat.id ? "page" : undefined
                          }
                        >
                          <div className="w-full flex justify-between items-start">
                            <p className="line-clamp-1 text-sm font-medium group-hover:text-white transition-colors duration-200 pr-5 max-w-[200px]">
                              {chat.firstMessage}
                            </p>
                          </div>
                          <div className="w-full flex justify-between items-center mt-1">
                            <p className="text-xs text-neutral-500 flex items-center">
                              {timeAgo(chat.timestamp)}
                            </p>
                            <div className="flex items-center gap-1 absolute right-3 top-1/2 -translate-y-1/2">
                              {(hoveredChatId === chat.id ||
                                currentChatId === chat.id) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full hover:bg-neutral-700 hover:text-red-400 transition-all duration-200 cursor-pointer"
                                  title="Hapus Chat"
                                  onClick={(e) => handleDeleteChat(e, chat.id)}
                                  aria-label="Hapus chat ini"
                                  tabIndex={0}
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))
                  ) : searchQuery ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in-50 duration-300">
                      <Search
                        className="size-8 text-neutral-600 mb-3"
                        strokeWidth={1.5}
                      />
                      <p className="text-sm text-neutral-400 font-medium">
                        Tidak ditemukan
                      </p>
                      <p className="text-xs text-neutral-500 mt-1 mb-3">
                        Tidak ada Chat yang cocok dengan &quot;{searchQuery}
                        &quot;
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchQuery("")}
                        className="text-xs text-neutral-300 bg-neutral-800 hover:bg-neutral-700 cursor-pointer"
                      >
                        Hapus pencarian
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in-50 duration-300">
                      <div className="flex items-center justify-center size-14 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 mb-3 shadow-inner">
                        <Lock
                          className="size-6 text-neutral-400"
                          strokeWidth={1.5}
                        />
                      </div>
                      <p className="text-sm font-medium mb-1 text-neutral-300">
                        Belum ada riwayat Chat
                      </p>
                      <p className="text-xs text-neutral-500 max-w-[220px] mb-4">
                        Mulai Chat baru untuk percakapan pribadi dengan Waras AI
                      </p>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="gap-2 text-xs bg-transparent border-neutral-700 hover:bg-neutral-800 text-neutral-300 cursor-pointer"
                      >
                        <Link href="/chat" onClick={handleNewChat}>
                          <Plus className="size-3" />
                          Mulai Chat Baru
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="shrink-0 p-4 pt-2">
            <div className="relative flex h-auto w-full flex-col justify-between overflow-hidden rounded-xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-800 p-4 transition-all duration-300 hover:border-neutral-700 hover:shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center size-6 rounded-full bg-neutral-800/80">
                    <Lock className="size-3 text-neutral-300" />
                  </div>
                  <span className="text-xs font-medium text-neutral-300">
                    Enkripsi Lokal
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="relative text-sm font-medium text-white/90">
                  Privat, Permissionless, Aman.
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-400">Waras AI v1.0</p>
                </div>
              </div>
            </div>
          </div>
        </section>

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
      </nav>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-neutral-900 border border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle>Hapus Chat</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Apakah Anda yakin ingin menghapus obrolan ini? Tindakan ini tidak
              dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="bg-transparent text-white border-neutral-700 hover:bg-neutral-800 hover:text-white cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={confirmDelete}
              variant="destructive"
              className="bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 cursor-pointer"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
