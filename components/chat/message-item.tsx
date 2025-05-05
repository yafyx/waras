"use client";

import { timeAgo } from "@/lib/utils";
import type { Message, ToolCall, ToolInvocation } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  ChevronDown,
  BookOpen,
  ExternalLink,
  Cog,
  CheckCircle,
  SearchCheck,
  Wrench,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LoadingIcon } from "@/components/icons";

interface MessageItemProps {
  message: Message;
  isLast: boolean;
}

const messageVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
};

const MarkdownContent = memo(({ content }: { content: string }) => {
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
        <div className="mt-6 border-t border-neutral-700/50 pt-2">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="sources" className="border-b-0">
              <AccordionTrigger className="flex items-center gap-2 py-2 text-sm hover:text-white transition-colors duration-200 hover:no-underline font-medium group cursor-pointer">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-neutral-400 group-hover:text-blue-400 transition-colors duration-200" />
                  <span className="group-hover:text-white transition-colors duration-200 flex items-center gap-2">
                    Referensi & Sumber Informasi
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-2 font-normal bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700/50 transition-colors duration-200"
                    >
                      {
                        sourcesContent
                          .split(/\n/)
                          .filter((line) => line.trim().length > 0).length
                      }{" "}
                      sumber
                    </Badge>
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-1 pt-2 pl-6 border-l-2 border-neutral-700/50">
                <div className="text-xs space-y-2">
                  <ReactMarkdown
                    rehypePlugins={[
                      [
                        rehypeExternalLinks,
                        {
                          target: "_blank",
                          rel: ["nofollow", "noopener", "noreferrer"],
                          properties: {
                            className:
                              "text-blue-400 hover:text-blue-300 transition-colors duration-200 hover:underline flex items-center gap-1 group",
                          },
                        },
                      ],
                      [
                        rehypeClassNames,
                        {
                          li: "mb-3 hover:text-neutral-200 transition-colors duration-200 relative pl-1",
                          p: "mb-2 hover:text-neutral-200 transition-colors duration-200",
                          a: "text-blue-400 hover:text-blue-300 transition-colors duration-200 hover:underline inline-flex items-center gap-1",
                          ul: "space-y-2 list-none pl-0",
                        },
                      ],
                    ]}
                    components={{
                      a: ({ node, ...props }) => (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a {...props}>
                                {props.children}
                                <ExternalLink className="h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity duration-200" />
                              </a>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <p>Buka di tab baru</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ),
                      li: ({ node, ...props }) => (
                        <li className="mb-3 hover:text-neutral-200 transition-colors duration-200 relative pl-1">
                          {props.children}
                        </li>
                      ),
                    }}
                  >
                    {sourcesContent}
                  </ReactMarkdown>
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

interface ToolInvocationDisplayProps {
  toolInvocation: ToolInvocation;
  isOpen: boolean;
}

const ToolInvocationDisplay = memo(
  ({ toolInvocation, isOpen }: ToolInvocationDisplayProps) => {
    const { state, toolName, args } = toolInvocation;
    const argsString = JSON.stringify(args, null, 2);

    return (
      <div className="mt-2 mb-4 border border-neutral-700/50 rounded-lg bg-neutral-800/30 text-sm overflow-hidden transition-all duration-200">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2 font-medium text-neutral-400">
            {state !== "result" ? (
              <div className="animate-spin dark:text-neutral-400 text-neutral-500">
                <LoadingIcon />
              </div>
            ) : (
              <SearchCheck className="h-4 w-4 text-green-500" />
            )}
            <span>
              {state === "partial-call" || state === "call"
                ? `Calling tool: ${toolName}...`
                : `Tool called: ${toolName}`}
            </span>
          </div>
        </div>
        {state !== "partial-call" && (
          <div className="px-3 pb-3 pt-0 border-t border-neutral-700/30">
            <Accordion type="single" collapsible className="w-full text-xs">
              <AccordionItem value="tool-details" className="border-b-0">
                <AccordionTrigger className="py-1 hover:no-underline justify-start gap-1 text-neutral-500 hover:text-neutral-300 transition-colors duration-200">
                  Details
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0">
                  {args && (
                    <details className="mb-2 cursor-pointer group">
                      <summary className="text-neutral-400 group-hover:text-neutral-200 transition-colors duration-200">
                        Arguments:
                      </summary>
                      <pre className="mt-1 p-2 bg-neutral-900/50 rounded text-[11px] overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-850">
                        <code>{argsString}</code>
                      </pre>
                    </details>
                  )}
                  {state === "result" && toolInvocation.result && (
                    <details className="cursor-pointer group" open>
                      <summary className="text-neutral-400 group-hover:text-neutral-200 transition-colors duration-200">
                        Result:
                      </summary>
                      <pre className="mt-1 p-2 bg-neutral-900/50 rounded text-[11px] overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-850">
                        <code>
                          {(() => {
                            try {
                              const result = toolInvocation.result;
                              if (
                                Array.isArray(result) &&
                                result.length > 0 &&
                                "similarity" in result[0]
                              ) {
                                const sortedResult = [...result].sort(
                                  (a, b) =>
                                    (b.similarity || 0) - (a.similarity || 0)
                                );
                                return JSON.stringify(sortedResult, null, 2);
                              }
                              return JSON.stringify(result, null, 2);
                            } catch (e) {
                              return JSON.stringify(
                                toolInvocation.result,
                                null,
                                2
                              );
                            }
                          })()}
                        </code>
                      </pre>
                    </details>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </div>
    );
  }
);
ToolInvocationDisplay.displayName = "ToolInvocationDisplay";

const haveToolsFinished = (message: Message): boolean => {
  return (
    !message.toolInvocations ||
    message.toolInvocations.length === 0 ||
    message.toolInvocations.every((invocation) => invocation.state === "result")
  );
};

function MessageItemComponent({ message, isLast }: MessageItemProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const [isCopied, setIsCopied] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const hasTools =
    message.toolInvocations && message.toolInvocations.length > 0;
  const toolsRunning = hasTools && !haveToolsFinished(message);
  const showContent =
    !isUser && !isSystem && message.content && haveToolsFinished(message);
  const showToolInvocations = !isUser && !isSystem && hasTools && showTools;

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isCopied) {
      timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isCopied]);

  if (message.role === "assistant" && !message.content && !hasTools) {
    return null;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setIsCopied(true);
    });
  };

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
          <>
            {toolsRunning && (
              <div className="flex items-center gap-2 text-sm text-neutral-400 py-2 px-3 bg-neutral-800/30 rounded-lg border border-neutral-700/30 mb-2">
                <div className="animate-spin dark:text-neutral-400 text-neutral-500">
                  <LoadingIcon />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">
                    Sebentar ya, saya sedang merenungkan pertanyaan Anda...
                  </span>
                  <span className="text-xs text-neutral-500">
                    Waras AI sedang mengumpulkan informasi...
                  </span>
                </div>
                <button
                  onClick={() => setShowTools(true)}
                  className="ml-auto text-xs text-neutral-400 hover:text-neutral-300 transition-colors"
                  aria-label="Tampilkan detail tools"
                >
                  Lihat Detail
                </button>
              </div>
            )}

            {hasTools && haveToolsFinished(message) && (
              <div className="flex justify-end mb-1">
                <button
                  onClick={() => setShowTools(!showTools)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all duration-200 text-xs group"
                  aria-label={
                    showTools ? "Sembunyikan tools" : "Tampilkan tools"
                  }
                >
                  <Wrench className="h-3 w-3 group-hover:rotate-45 transition-transform duration-300" />
                  <span>
                    {showTools ? "Sembunyikan Tools" : "Tampilkan Tools"}
                  </span>
                  <ChevronDown
                    className={`h-3 w-3 transition-transform duration-200 ${
                      showTools ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            )}

            {hasTools && (
              <AnimatePresence>
                {showToolInvocations && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {message.toolInvocations?.map((toolInvocation) => (
                      <ToolInvocationDisplay
                        key={toolInvocation.toolCallId}
                        toolInvocation={toolInvocation}
                        isOpen={showTools}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {showContent && <MarkdownContent content={message.content} />}
          </>
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

export const MessageItem = memo(MessageItemComponent);
