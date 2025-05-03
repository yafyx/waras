"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { GalleryVerticalEnd, LayoutGridIcon, PlusIcon } from "lucide-react";

export function FloatingButton() {
  const pathname = usePathname();
  const isRootPage = pathname === "/";
  const isChatPage = pathname === "/chat";
  const isInChat = pathname.startsWith("/chat");
  const isInChatThread = isInChat && !isChatPage;
  const shouldShowPlus = !isRootPage && !isChatPage;
  const shouldShowGrid = isRootPage || isChatPage || isInChatThread;

  return (
    <div className="fixed top-3 right-6 flex gap-3 z-50">
      {shouldShowPlus && (
        <Link href="/chat">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl bg-white/90 border-white/50 shadow-lg backdrop-blur-sm hover:bg-white/60 transition-all cursor-pointer"
            aria-label="New Chat"
          >
            <PlusIcon className="h-6 w-6 text-black" strokeWidth={1.5} />
          </Button>
        </Link>
      )}
      {shouldShowGrid && (
        <Link href="/chat">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl bg-zinc-800/90 border-zinc-700/50 shadow-lg backdrop-blur-sm hover:bg-zinc-900 transition-all cursor-pointer"
            aria-label="Chat List"
          >
            <GalleryVerticalEnd className="h-5 w-5" fill="white" />
          </Button>
        </Link>
      )}
    </div>
  );
}
