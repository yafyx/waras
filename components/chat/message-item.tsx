"use client";

import { timeAgo } from "@/lib/utils";
import { Message } from "ai";
import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import rehypeClassNames from "rehype-class-names";
import Image from "next/image";
import { useState, useEffect, memo } from "react";

interface MessageItemProps {
  message: Message;
  isLast: boolean;
}

// Optimized animation variants
const messageVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
};

// Memoized markdown component to prevent unnecessary re-renders
const MarkdownContent = memo(({ content }: { content: string }) => {
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
});

MarkdownContent.displayName = "MarkdownContent";

// Memoized message item component
function MessageItemComponent({ message, isLast }: MessageItemProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
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

  // Handle system messages differently
  if (isSystem) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={messageVariants}
        transition={{ duration: 0.15 }}
        className="text-center py-2 px-4 max-w-3xl mx-auto text-sm text-neutral-400 italic"
      >
        {message.content}
      </motion.div>
    );
  }

  // Simplified content processing
  const processedContent = message.content;

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={messageVariants}
      transition={{ duration: 0.15 }}
      className="flex flex-col gap-2 py-4"
      layout="position"
    >
      <p className="flex items-center gap-2 font-medium">
        {isUser ? (
          <span className="text-base opacity-50">Anda</span>
        ) : (
          <>
            <Image
              src="/waras.png"
              alt="Waras AI Logo"
              width={20}
              height={20}
              className="select-none"
              draggable="false"
              priority={isLast}
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
            aria-label={isCopied ? "Copied" : "Copy message"}
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

// Export memoized component to prevent re-rendering when props haven't changed
export const MessageItem = memo(MessageItemComponent);
