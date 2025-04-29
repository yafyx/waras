"use client";

import { timeAgo } from "@/lib/utils";
import { Message } from "ai";
import { motion } from "framer-motion";
import { Copy, User, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import rehypeClassNames from "rehype-class-names";
import Image from "next/image";
import { useState, useEffect } from "react";

interface MessageItemProps {
  message: Message;
  isLast: boolean;
}

// Wrapper component for ReactMarkdown to handle the TypeScript errors
function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        rehypePlugins={[
          rehypeSlug,
          [
            rehypeExternalLinks,
            { target: "_blank", rel: ["nofollow", "noopener"] },
          ],
          rehypeHighlight,
          [
            rehypeClassNames,
            {
              ul: "list-disc pl-5 space-y-2",
              ol: "list-decimal pl-5 space-y-2",
              li: "mb-1",
              p: "mb-4",
              h1: "text-2xl font-bold mb-4",
              h2: "text-xl font-bold mb-3",
              h3: "text-lg font-bold mb-2",
              a: "text-blue-400 hover:underline",
            },
          ],
        ]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function MessageItem({ message, isLast }: MessageItemProps) {
  const isUser = message.role === "user";
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setIsCopied(true);
    });
  };

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000); // Reset after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  // Don't try to re-parse tool responses here since that's now handled in the page components
  const processedContent = message.content;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-2 py-4"
    >
      <p className="flex items-center gap-2 font-medium">
        {isUser ? (
          <>
            <span className="text-base opacity-50">Anda</span>
          </>
        ) : (
          <>
            <Image
              src="/waras.png"
              alt="Waras AI Logo"
              width={20}
              height={20}
              className="select-none"
              draggable="false"
            />
            <span className="text-base opacity-50">Waras AI</span>
          </>
        )}
      </p>

      <div className="flex flex-col gap-2 text-neutral-300 text-base">
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <MarkdownContent content={processedContent} />
        )}
      </div>

      {!isUser && (
        <div className="flex items-center gap-8 py-4 text-sm">
          <p className="flex items-center gap-3 font-medium opacity-50">
            {timeAgo(message.createdAt)}
          </p>
          <button
            className="flex items-center gap-1.5 text-neutral-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleCopy}
            disabled={isCopied}
          >
            {isCopied ? (
              <>
                <Check className="size-3" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="size-3" />
                Copy
              </>
            )}
          </button>
          <p className="ml-auto flex items-center gap-3 font-medium opacity-20">
            <span className="hidden lg:block text-sm">Waras AI</span>
          </p>
        </div>
      )}
    </motion.section>
  );
}
