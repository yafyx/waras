"use client";

import { timeAgo } from "@/lib/utils";
import type { Message, ToolCall } from "ai";
import { motion } from "framer-motion";
import { Copy, Check, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import rehypeClassNames from "rehype-class-names";
import Image from "next/image";
import { useState, useEffect, memo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  // Split content to separate main content and sources
  const parts = content.split(/\n\n+Sumber:/);
  const mainContent = parts[0];
  const hasSources = parts.length > 1;
  const sourcesContent = hasSources ? parts[1].trim() : "";

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
        {mainContent}
      </ReactMarkdown>

      {hasSources && (
        <div className="mt-6 border-t border-neutral-700/50 text-neutral-400 text-xs">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="sources" className="border-b-0">
              <AccordionTrigger className="flex items-center gap-2 py-2 text-xs hover:text-white transition-colors duration-200 hover:no-underline font-medium group cursor-pointer">
                <span className="group-hover:text-white transition-colors duration-200">
                  Referensi & Sumber Informasi
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-1">
                <div className="hover:border-neutral-400 transition-colors duration-200 text-xs">
                  <div className="hover:text-neutral-300 transition-colors duration-200">
                    <ReactMarkdown
                      rehypePlugins={[
                        [
                          rehypeExternalLinks,
                          {
                            target: "_blank",
                            rel: ["nofollow", "noopener", "noreferrer"],
                            properties: {
                              className:
                                "text-blue-400 hover:text-blue-300 transition-colors duration-200 hover:underline",
                            },
                          },
                        ],
                        [
                          rehypeClassNames,
                          {
                            li: "mb-2 hover:text-neutral-200 transition-colors duration-200",
                            p: "mb-2 hover:text-neutral-200 transition-colors duration-200",
                            a: "text-blue-400 hover:text-blue-300 transition-colors duration-200 hover:underline",
                          },
                        ],
                      ]}
                    >
                      {sourcesContent}
                    </ReactMarkdown>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  );
});

MarkdownContent.displayName = "MarkdownContent";

// Check if a message is currently invoking tools
const isInvokingTools = (message: Message) => {
  // Look for tool calls in the message
  const toolCalls = ("tools" in message ? message.tools : []) as Array<{
    state: string;
    toolName: string;
  }>;

  if (!toolCalls || toolCalls.length === 0) {
    return false;
  }

  // Check if any tool is in "partial-call" or "call" state
  return toolCalls.some(
    (tool) => tool.state === "partial-call" || tool.state === "call"
  );
};

// Memoized message item component
function MessageItemComponent({ message, isLast }: MessageItemProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const [isCopied, setIsCopied] = useState(false);

  // Moved useEffect higher to ensure it's not seen as conditional
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isCopied) {
      timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000); // Reset after 2 seconds
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isCopied]);

  // Check if this message is currently invoking tools
  const toolsInProgress = !isUser && !isSystem && isInvokingTools(message);

  // If tools are being invoked, don't show content yet
  if (toolsInProgress && !message.content) {
    return null;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setIsCopied(true);
    });
  };

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
          <MarkdownContent content={message.content} />
        )}
      </div>

      {!isUser && (
        <div className="flex items-center gap-8 py-4 text-sm">
          <p className="flex items-center gap-3 font-medium opacity-50">
            {timeAgo(message.createdAt)}
          </p>
          <button
            className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            onClick={handleCopy}
            disabled={isCopied}
            aria-label={isCopied ? "Copied" : "Copy message"}
          >
            {isCopied ? (
              <>
                <Check className="size-3" />
                <span className="capitalize">Disalin!</span>
              </>
            ) : (
              <>
                <Copy className="size-3" />
                <span className="capitalize">Salin</span>
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
