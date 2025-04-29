"use client";

import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import Image from "next/image";

export function ChatHeader() {
  return (
    <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between p-3 backdrop-blur-md bg-neutral-900/80 border-b border-neutral-800">
      <div className="flex items-center gap-2">
        <Image
          src="/waras.png"
          alt="Waras AI Logo"
          width={28}
          height={28}
          className="select-none"
          draggable="false"
        />
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
