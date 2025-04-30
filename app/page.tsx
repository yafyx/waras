"use client";

import Image from "next/image";
import { Message } from "ai";
import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import "highlight.js/styles/github-dark.css";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  User,
  HelpCircle,
  Settings,
  Share2,
  Copy,
  SendHorizonal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { InfoBoxes } from "@/components/info-boxes";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const [input, setInput] = useState("");
  const router = useRouter();
  const [awaitingResponse, setAwaitingResponse] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const onFormSubmit = (
    e:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    e.preventDefault();
    if (input.trim().length >= 3 && !awaitingResponse) {
      setAwaitingResponse(true);

      // Generate a new chat ID
      const chatId = uuidv4();

      // Create user message
      const userMessage: Message = {
        id: uuidv4(),
        role: "user",
        content: input.trim(),
        createdAt: new Date(),
      };

      // Save to localStorage
      localStorage.setItem(
        `chat-${chatId}`,
        JSON.stringify({
          id: chatId,
          messages: [userMessage],
        })
      );

      // Trigger refresh of the chat list
      window.dispatchEvent(new CustomEvent("waras:refreshChatList"));

      // Redirect directly to the chat ID page
      router.push(`/chat/${chatId}`);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <InitialLayout
        input={input}
        handleInputChange={handleInputChange}
        onFormSubmit={onFormSubmit}
        awaitingResponse={awaitingResponse}
      />
    </AnimatePresence>
  );
}

interface InitialLayoutProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFormSubmit: (
    e:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
  ) => void;
  awaitingResponse: boolean;
}

function InitialLayout({
  input,
  handleInputChange,
  onFormSubmit,
  awaitingResponse,
}: InitialLayoutProps) {
  return (
    <motion.section
      key="initial-layout"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex h-[100dvh] w-full flex-col items-center justify-center dark:bg-neutral-950 text-white"
    >
      <div className="relative flex w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 md:px-6">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-[60px]">
            <Image
              src="/waras.png"
              alt="Waras AI Logo"
              width={55}
              height={55}
              className="select-none"
              draggable="false"
            />
          </div>
          <h1 className="text-5xl font-serif flex items-center transform scale-y-125">
            Waras AI
          </h1>
        </div>
        {/* Input Area */}
        <div className="w-full">
          <InputArea
            input={input}
            handleInputChange={handleInputChange}
            onFormSubmit={onFormSubmit}
            awaitingResponse={awaitingResponse}
          />
        </div>
        {/* Info Boxes */}
        <div className="w-full">
          <InfoBoxes />
        </div>
        {/* Footer Text */}
        <p className="flex items-center gap-2 text-sm font-medium text-neutral-600 mt-2 bg-neutral-900/50 px-4 py-3 rounded-full border border-neutral-800 backdrop-blur-sm">
          <svg
            width="16"
            height="20"
            viewBox="0 0 16 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="size-4"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8 0C5.23858 0 3 2.23858 3 5V7.12602C1.27477 7.57006 0 9.1362 0 11V16C0 18.2091 1.79086 20 4 20H12C14.2091 20 16 18.2091 16 16V11C16 9.1362 14.7252 7.57006 13 7.12602V5C13 2.23858 10.7614 0 8 0ZM11 7V5C11 3.34315 9.6569 2 8 2C6.3431 2 5 3.34315 5 5V7H11ZM8 11C8.5523 11 9 11.4477 9 12V15C9 15.5523 8.5523 16 8 16C7.4477 16 7 15.5523 7 15V12C7 11.4477 7.4477 11 8 11Z"
              fill="currentColor"
            ></path>
          </svg>
          AI Chat Psikologi yang Aman & Anonim.
        </p>
      </div>
    </motion.section>
  );
}

interface ActiveChatLayoutProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFormSubmit: (
    e:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
  ) => void;
  awaitingResponse: boolean;
  allMessages: Message[];
  currentToolCall?: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

function ActiveChatLayout({
  input,
  handleInputChange,
  onFormSubmit,
  awaitingResponse,
  allMessages,
  currentToolCall,
  messagesEndRef,
}: ActiveChatLayoutProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  return (
    <motion.section
      key="active-chat-layout"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex h-[100dvh] w-full text-white dark:bg-neutral-950"
    >
      <aside className="hidden lg:block w-[278px] flex-shrink-0 p-4 border-r border-neutral-800">
        <Card className="h-full border-neutral-700 bg-neutral-900 flex flex-col overflow-hidden shadow-none">
          <CardHeader className="border-b border-neutral-700 px-4 py-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Image
                src="/waraslogo.png"
                alt="Waras AI Logo"
                className="size-6"
                width={24}
                height={24}
              />
              <span className="text-xs font-medium">Waras AI</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-neutral-400 hover:text-white hover:bg-neutral-700"
            >
              <Plus className="size-3" />
            </Button>
          </CardHeader>
          <div className="flex-grow overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-800">
            <h5 className="px-2 mb-2 text-neutral-500 text-xs font-medium uppercase tracking-wider">
              Riwayat Percakapan
            </h5>
            <div className="flex flex-col gap-1.5">
              <Button
                variant="ghost"
                className="flex h-auto flex-col items-start rounded-lg border border-neutral-700/50 px-3 py-2 hover:bg-neutral-800/70 bg-neutral-800 w-full justify-start text-left"
              >
                <p className="line-clamp-1 text-sm font-medium text-neutral-100">
                  Percakapan Baru
                </p>
                <p className="text-xs text-neutral-400">Baru saja</p>
              </Button>
              <Button
                variant="ghost"
                className="flex h-auto flex-col items-start rounded-lg border border-transparent px-3 py-2 hover:bg-neutral-800/70 hover:border-neutral-700/50 w-full justify-start text-left"
              >
                <p className="line-clamp-1 text-sm font-medium text-neutral-100">
                  Diskusi tentang Kecemasan
                </p>
                <p className="text-xs text-neutral-400">Kemarin</p>
              </Button>
            </div>
          </div>
          <CardFooter className="p-3 border-t border-neutral-800">
            <Button
              variant="outline"
              className="w-full border-neutral-700 hover:bg-neutral-800 text-xs"
            >
              Pengaturan Akun
            </Button>
          </CardFooter>
        </Card>
      </aside>

      <section className="relative flex w-full flex-col">
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between p-3 backdrop-blur-md bg-neutral-900/80 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Image
              src="/waraslogo.png"
              alt="Waras AI Logo"
              className="size-6"
              width={24}
              height={24}
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

        <div className="flex flex-1 flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-850">
          <div className="flex-grow"></div>
          <section className="flex w-full flex-col px-4 md:px-6 pb-4 pt-6">
            <div className="mx-auto w-full max-w-3xl">
              <AnimatePresence initial={false}>
                {allMessages.map((message, index) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    isLast={
                      index === allMessages.length - 1 && !awaitingResponse
                    }
                  />
                ))}
              </AnimatePresence>
              {awaitingResponse && <Loading tool={currentToolCall} />}
              <div ref={messagesEndRef} className="h-0" />
            </div>
          </section>
        </div>

        <section className="absolute right-4 top-4 lg:right-6 lg:top-6 flex gap-2 z-10">
          <Button
            size="icon"
            variant="default"
            className="rounded-xl h-8 w-8 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="size-3" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="rounded-xl h-8 w-8 bg-neutral-700/50 hover:bg-neutral-700 text-neutral-300 hover:text-white"
          >
            <HelpCircle className="size-3" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="rounded-xl h-8 w-8 bg-neutral-700/50 hover:bg-neutral-700 text-neutral-300 hover:text-white"
          >
            <Settings className="size-3" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="rounded-xl h-8 w-8 bg-neutral-700/50 hover:bg-neutral-700 text-neutral-300 hover:text-white"
          >
            <Share2 className="size-3" />
          </Button>
        </section>

        <section className="sticky bottom-0 w-full p-3 md:p-4 z-20 bg-neutral-900/95 pt-8">
          <div className="max-w-3xl mx-auto">
            <InputArea
              input={input}
              handleInputChange={handleInputChange}
              onFormSubmit={onFormSubmit}
              awaitingResponse={awaitingResponse}
              textareaRef={textareaRef}
            />
          </div>
        </section>
      </section>
    </motion.section>
  );
}

interface MessageItemProps {
  message: Message;
  isLast: boolean;
}

function MessageItem({ message, isLast }: MessageItemProps) {
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  const messageContent = message.content || "";
  const parts = messageContent.split(/\n\n+Sumber:/);
  const mainContent = parts[0];
  const hasSources = parts.length > 1;
  const sourcesContent = hasSources ? parts[1].trim() : "";

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex flex-col gap-2 py-4"
    >
      <p className="flex items-center gap-2 font-medium">
        {isUser ? (
          <>
            <User className="size-6 text-blue-400" />
            <span className="text-base opacity-50">Anda</span>
          </>
        ) : (
          <>
            <Image
              className="size-6 rounded-full"
              src="/waraslogo.png"
              alt="Waras AI Logo"
              width={24}
              height={24}
            />
            <span className="text-base opacity-50">Waras AI</span>
          </>
        )}
      </p>

      <div className="flex flex-col gap-2 text-neutral-300 text-base">
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div
            className="text-sm text-neutral-100 overflow-hidden"
            id="markdown"
          >
            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-p:my-2 prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-pre:bg-[#282c34] prose-pre:p-3 prose-code:bg-neutral-700 dark:prose-code:bg-neutral-700 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:rounded overflow-hidden">
              <ReactMarkdown
                rehypePlugins={[
                  rehypeSlug,
                  [rehypeAutolinkHeadings, { behavior: "wrap" }],
                  [rehypeHighlight, { ignoreMissing: true }],
                  [
                    rehypeExternalLinks,
                    {
                      target: "_blank",
                      rel: ["nofollow", "noopener", "noreferrer"],
                    },
                  ],
                ]}
              >
                {mainContent}
              </ReactMarkdown>
            </div>

            {hasSources && (
              <div className="mt-4 pt-3 border-t border-neutral-700 text-neutral-400 text-xs">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1" className="border-b-0">
                    <AccordionTrigger className="flex items-center gap-1 py-0 font-medium text-xs hover:text-neutral-200 hover:no-underline">
                      <span>Referensi & Sumber Informasi</span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-0">
                      <div className="pl-6 mt-2 border-l-2 border-neutral-600 prose prose-sm dark:prose-invert prose-a:text-blue-400 hover:prose-a:underline">
                        <ReactMarkdown
                          rehypePlugins={[
                            [
                              rehypeExternalLinks,
                              {
                                target: "_blank",
                                rel: ["nofollow", "noopener", "noreferrer"],
                              },
                            ],
                          ]}
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
        )}
      </div>

      {!isUser && (
        <div className="flex items-center gap-8 py-4 text-sm">
          <p className="flex items-center gap-3 font-medium opacity-50">
            {timeAgo(message.createdAt)}
          </p>
          <button
            className="text-neutral-400 hover:text-white"
            onClick={handleCopy}
          >
            <p className="flex items-center gap-3 font-medium">
              <Copy className="size-3" />
              Copy
            </p>
          </button>
          <p className="ml-auto flex items-center gap-3 font-medium opacity-20">
            <span className="hidden lg:block text-sm">Waras AI</span>
          </p>
        </div>
      )}
    </motion.section>
  );
}

interface LoadingProps {
  tool?: string;
}

function Loading({ tool }: LoadingProps) {
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
          className="size-6 rounded-full"
          src="/waraslogo.png"
          alt="Waras AI Logo"
          width={24}
          height={24}
        />
        <span className="text-base opacity-50">Waras AI</span>
      </p>
      <div className="flex items-center gap-2 text-neutral-300">
        <div className="flex gap-1">
          <span className="animate-bounce [animation-delay:-0.3s] inline-block w-1.5 h-1.5 bg-current rounded-full"></span>
          <span className="animate-bounce [animation-delay:-0.15s] inline-block w-1.5 h-1.5 bg-current rounded-full"></span>
          <span className="animate-bounce inline-block w-1.5 h-1.5 bg-current rounded-full"></span>
        </div>
        <span className="text-base">
          {tool ? `Memproses (${tool})...` : "Berpikir..."}
        </span>
      </div>
    </motion.div>
  );
}

function timeAgo(date: Date | string | undefined): string {
  if (!date) return "";

  // Ensure we have a valid Date object
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check if dateObj is a valid Date
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return "";
  }

  const seconds = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " tahun lalu";

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " bulan lalu";

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " hari lalu";

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " jam lalu";

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " menit lalu";

  return "baru saja";
}

interface InputAreaProps {
  input: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFormSubmit: (
    e:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
  ) => void;
  awaitingResponse: boolean;
}

function InputArea({
  input,
  textareaRef,
  handleInputChange,
  onFormSubmit,
  awaitingResponse,
}: InputAreaProps) {
  const [textareaHeight, setTextareaHeight] = useState(100);
  const minHeight = 100;
  const maxHeight = 300;
  const dragStart = useRef<number | null>(null);
  const startHeight = useRef<number>(100);
  const internalRef = useRef<HTMLTextAreaElement>(null);

  // Use the provided ref or fall back to our internal ref
  const textareaRefToUse = textareaRef || internalRef;

  const startDrag = useCallback(
    (clientY: number) => {
      dragStart.current = clientY;
      startHeight.current = textareaHeight;
      document.body.style.cursor = "ns-resize";
    },
    [textareaHeight]
  );

  const onDragStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      startDrag(e.clientY);
      document.addEventListener("mousemove", onDragMove);
      document.addEventListener("mouseup", onDragEnd);
    },
    [startDrag]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      startDrag(e.touches[0].clientY);
      document.addEventListener("touchmove", onTouchMove);
      document.addEventListener("touchend", onTouchEnd);
    },
    [startDrag]
  );

  const moveDrag = useCallback(
    (clientY: number) => {
      if (dragStart.current === null) return;
      const delta = clientY - dragStart.current;
      const newHeight = Math.max(
        minHeight,
        Math.min(maxHeight, startHeight.current + delta)
      );
      setTextareaHeight(newHeight);
    },
    [maxHeight, minHeight]
  );

  const onDragMove = useCallback(
    (e: MouseEvent) => {
      moveDrag(e.clientY);
    },
    [moveDrag]
  );

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling while dragging
      moveDrag(e.touches[0].clientY);
    },
    [moveDrag]
  );

  const endDrag = useCallback(() => {
    dragStart.current = null;
    document.body.style.cursor = "";
  }, []);

  const onDragEnd = useCallback(() => {
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", onDragEnd);
    endDrag();
  }, [endDrag, onDragMove]);

  const onTouchEnd = useCallback(() => {
    document.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("touchend", onTouchEnd);
    endDrag();
  }, [endDrag, onTouchMove]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (
        e.key === "Enter" &&
        !e.shiftKey &&
        !awaitingResponse &&
        input.trim()
      ) {
        e.preventDefault();
        onFormSubmit(e);
      }
    },
    [awaitingResponse, input, onFormSubmit]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (input.trim() && !awaitingResponse) {
        onFormSubmit(e);
      }
    },
    [input, awaitingResponse, onFormSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex w-full flex-col">
        <Textarea
          ref={textareaRefToUse}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Tanyakan masalah psikologis Anda..."
          rows={1}
          disabled={awaitingResponse}
          style={{
            height: `${textareaHeight}px`,
            borderBottomLeftRadius: "0",
            borderBottomRightRadius: "0",
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`,
          }}
          className={cn(
            "flex w-full border border-neutral-700 bg-neutral-800/80 px-4 py-3 text-base text-neutral-100 shadow-md placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 overflow-y-auto pr-12 rounded-t-xl rounded-b-none"
          )}
        />
        <Button
          type="submit"
          size="icon"
          disabled={awaitingResponse || !input.trim()}
          className={cn(
            "absolute right-2 top-2 flex items-center justify-center rounded-lg bg-blue-600 text-white transition-colors duration-200 ease-in-out hover:bg-blue-700 disabled:bg-neutral-600 disabled:opacity-70",
            "h-8 w-8"
          )}
        >
          <SendHorizonal className="size-4" />
        </Button>
        <div
          onMouseDown={onDragStart}
          onTouchStart={onTouchStart}
          className="cursor-ns-resize touch-none flex items-center justify-center h-6 w-full rounded-b-xl border-b border-x border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700/50 transition-colors"
        >
          <div className="w-10 h-1 bg-neutral-600 rounded-full mb-1"></div>
          <span className="sr-only">Drag to resize</span>
        </div>
      </div>
    </form>
  );
}
