"use client";

import { motion } from "framer-motion";
import { LoadingIcon } from "@/components/icons";
import Image from "next/image";

interface LoadingProps {
  tool?: string;
}

export function Loading({ tool }: LoadingProps) {
  const toolName =
    tool === "getInformation"
      ? "Sebentar ya, saya coba cari tahu lebih lanjut..."
      : tool === "understandQuery"
      ? "Saya coba pahami dulu pertanyaan Anda..."
      : "Sebentar ya, saya sedang merangkai kata-kata...";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-2 py-4"
    >
      <p className="flex items-center gap-2 font-medium">
        <Image
          src="/waras.png"
          alt="Waras AI Logo"
          width={28}
          height={28}
          className="select-none"
          draggable="false"
        />
        <span className="text-base opacity-50">Waras AI</span>
      </p>
      <div className="flex items-center gap-2 text-neutral-300">
        <div className="animate-spin dark:text-neutral-400 text-neutral-500">
          <LoadingIcon />
        </div>
        <span className="text-base flex items-center gap-1">
          {toolName} <span className="animate-bounce">...</span>
        </span>
      </div>
    </motion.div>
  );
}
