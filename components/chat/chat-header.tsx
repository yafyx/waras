"use client";

import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export function ChatHeader() {
  return (
    <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between p-3 backdrop-blur-md bg-neutral-900/80 border-b border-neutral-800">
      <div className="flex items-center gap-2">
        <img src="/logo.svg" alt="Waras AI Logo" className="size-6" />
        <h1 className="text-base font-semibold">Waras AI</h1>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full text-neutral-300 hover:bg-neutral-700 hover:text-white"
      >
        <User className="size-3" />
      </Button>
    </header>
  );
}
