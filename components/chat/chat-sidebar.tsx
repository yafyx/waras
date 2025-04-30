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
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { timeAgo } from "@/lib/utils";

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

  const filteredChats = searchQuery.trim()
    ? chatList.filter((chat) =>
        chat.firstMessage.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chatList;

  // Handler for new chat button to dispatch a custom event
  const handleNewChat = () => {
    // Dispatch a custom event that will be caught by the layout component
    window.dispatchEvent(new CustomEvent("waras:refreshChatList"));
  };

  return (
    <nav
      className="hidden w-[300px] flex-shrink-0 p-4 lg:block"
      ref={sidebarRef}
    >
      <section className="flex h-full flex-col rounded-2xl border border-neutral-800 bg-neutral-900 shadow-lg">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-fit w-full items-center justify-between rounded-t-2xl border-b border-neutral-800 p-4 hover:bg-neutral-800 transition-colors"
              type="button"
            >
              <div className="flex items-center gap-2">
                <Image
                  src="/waras.png"
                  alt="Waras AI Logo"
                  width={28}
                  height={28}
                  className="select-none"
                  draggable="false"
                />
              </div>
              <ChevronDown className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={0}
            className="w-[266px] bg-[#121212] text-white border-b border-neutral-800 rounded-b-2xl rounded-t-none p-1"
            style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
          >
            <Link href="/" passHref>
              <DropdownMenuItem className="flex items-center gap-3 rounded-xl px-5 py-2 text-lg hover:bg-neutral-800 cursor-pointer">
                <Image
                  src="/waras.png"
                  alt="Waras AI Logo"
                  width={18}
                  height={18}
                  className="select-none"
                  draggable="false"
                />
                Home
              </DropdownMenuItem>
            </Link>
            <Link href="/chat" passHref>
              <DropdownMenuItem
                className="flex items-center gap-3 rounded-xl px-5 py-2 text-lg hover:bg-neutral-800 cursor-pointer"
                onClick={handleNewChat}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2 size-4"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M9 0C9.5523 0 10 0.44772 10 1V8H17C17.5523 8 18 8.4477 18 9C18 9.5523 17.5523 10 17 10H10V17C10 17.5523 9.5523 18 9 18C8.4477 18 8 17.5523 8 17V10H1C0.44772 10 0 9.5523 0 9C0 8.4477 0.44772 8 1 8H8V1C8 0.44772 8.4477 0 9 0Z"
                    fill="currentColor"
                  ></path>
                </svg>
                New Chat
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem className="flex items-center gap-3 rounded-xl px-5 py-2 text-lg hover:bg-neutral-800 cursor-pointer">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.7587 3.00809e-07C4.95373 -9.69919e-06 4.28937 -1.97701e-05 3.74817 0.0441902C3.18608 0.0901202 2.66937 0.18868 2.18404 0.43597C1.43139 0.81947 0.81947 1.43139 0.43597 2.18404C0.18868 2.66937 0.0901202 3.18608 0.0441902 3.74817C-1.97701e-05 4.28937 -9.69919e-06 4.95373 3.00809e-07 5.7587V7C3.00809e-07 7.5523 0.44772 8 1 8H7C7.5523 8 8 7.5523 8 7V1C8 0.44772 7.5523 3.00809e-07 7 3.00809e-07H5.7587Z"
                  fill="currentColor"
                ></path>
                <path
                  d="M15.816 0.43597C15.3306 0.18868 14.8139 0.0901202 14.2518 0.0441902C13.7106 -1.97701e-05 13.0463 -9.69919e-06 12.2413 3.00809e-07H11C10.4477 3.00809e-07 10 0.44772 10 1V7C10 7.5523 10.4477 8 11 8H17C17.5523 8 18 7.5523 18 7V5.75868C18 4.95372 18 4.28936 17.9558 3.74817C17.9099 3.18608 17.8113 2.66937 17.564 2.18404C17.1805 1.43139 16.5686 0.81947 15.816 0.43597Z"
                  fill="currentColor"
                ></path>
                <path
                  d="M1 10C0.44772 10 3.00809e-07 10.4477 3.00809e-07 11V12.2413C-9.69919e-06 13.0463 -1.97701e-05 13.7106 0.0441902 14.2518C0.0901202 14.8139 0.18868 15.3306 0.43597 15.816C0.81947 16.5686 1.43139 17.1805 2.18404 17.564C2.66937 17.8113 3.18608 17.9099 3.74817 17.9558C4.28936 18 4.95372 18 5.75868 18H7C7.5523 18 8 17.5523 8 17V11C8 10.4477 7.5523 10 7 10H1Z"
                  fill="currentColor"
                ></path>
                <path
                  d="M11 10C10.4477 10 10 10.4477 10 11V17C10 17.5523 10.4477 18 11 18H12.2413C13.0463 18 13.7106 18 14.2518 17.9558C14.8139 17.9099 15.3306 17.8113 15.816 17.564C16.5686 17.1805 17.1805 16.5686 17.564 15.816C17.8113 15.3306 17.9099 14.8139 17.9558 14.2518C18 13.7106 18 13.0463 18 12.2413V11C18 10.4477 17.5523 10 17 10H11Z"
                  fill="currentColor"
                ></path>
              </svg>
              Grid
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="p-3">
          <Link href="/chat" className="block w-full">
            <Button
              className="w-full justify-start gap-2 bg-white text-black hover:bg-neutral-100 transition-colors duration-300 ease-in-out hover:opacity-85"
              onClick={handleNewChat}
            >
              <Plus className="size-4" />
              <span>New Chat</span>
            </Button>
          </Link>

          <div className="relative mt-3 mb-2">
            <Search className="absolute left-2.5 top-2.5 size-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 py-2 pl-9 pr-3 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600 transition-colors duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-neutral-500 hover:text-white"
                title="Clear search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-4"
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex-grow overflow-y-auto px-3 pb-3 pt-0 custom-scrollbar">
          {filteredChats.length > 0 && (
            <h5 className="px-3 text-neutral-500 text-xs font-medium uppercase tracking-wider sticky top-0 bg-neutral-900 py-1 z-10">
              Recent Chats
            </h5>
          )}
          <div className="mt-2 flex flex-col gap-1.5">
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
                    className={`flex flex-col items-start rounded-xl border px-3 py-2 transition-all duration-200 hover:bg-neutral-800 hover:no-underline ${
                      currentChatId === chat.id
                        ? "border-neutral-700 bg-neutral-800"
                        : "border-transparent"
                    }`}
                  >
                    <p className="line-clamp-1 text-sm font-medium group-hover:text-white transition-colors duration-200">
                      {chat.firstMessage}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {timeAgo(chat.timestamp)}
                    </p>
                  </Link>
                  {(hoveredChatId === chat.id || currentChatId === chat.id) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 hover:bg-neutral-700 hover:text-red-400 transition-all duration-200"
                      title="Delete chat"
                      onClick={(e) => {
                        e.preventDefault();
                        // Delete functionality would go here
                        // console.log(`Delete chat ${chat.id}`);
                      }}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              ))
            ) : searchQuery ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Search className="size-10 text-neutral-600 mb-2" />
                <p className="text-sm text-neutral-500">
                  No chats found with &quot;{searchQuery}&quot;
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-2 text-xs text-emerald-500 hover:text-emerald-400"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex items-center justify-center size-14 rounded-full bg-neutral-800 mb-3">
                  <Lock className="size-6 text-neutral-500" />
                </div>
                <p className="text-sm font-medium mb-1">No chat history yet</p>
                <p className="text-xs text-neutral-500 max-w-[200px]">
                  Start a new chat to have a private conversation with Waras AI
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 p-4 pt-2">
          <div className="relative flex h-[120px] w-full flex-col justify-between overflow-hidden rounded-xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-5 transition-all duration-200 hover:border-neutral-700">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">
                Secure
              </span>
            </div>
            <div>
              <p className="relative mt-2 text-sm font-medium">
                Private, Permissionless, Secure AI Chat.
              </p>
              <p className="text-xs font-medium text-neutral-500 mt-1">
                Waras AI
              </p>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(115, 115, 115, 0.5);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(140, 140, 140, 0.7);
        }
      `}</style>
    </nav>
  );
}
