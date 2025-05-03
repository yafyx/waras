"use client";

import { GalleryVerticalEnd } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RiwayatCredenza } from "./riwayat";

export function RiwayatButton() {
  const trigger = (
    <Button
      variant="outline"
      size="icon"
      className="h-10 w-10 rounded-xl bg-zinc-800 border-zinc-800 shadow-lg backdrop-blur-sm hover:bg-zinc-900 transition-all cursor-pointer"
      aria-label="Chat History"
    >
      <GalleryVerticalEnd className="h-5 w-5 text-white" fill="white" />
    </Button>
  );

  return <RiwayatCredenza trigger={trigger} />;
}
