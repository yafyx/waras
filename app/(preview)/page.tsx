"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Message } from "ai";
import { useChat } from "@ai-sdk/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown, { Options } from "react-markdown";
import React from "react";
import ProjectOverview from "@/components/project-overview";
import { LoadingIcon, SendIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Chat() {
  const [toolCall, setToolCall] = useState<string>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    status,
  } = useChat({
    maxSteps: 4,
    experimental_throttle: 50,
    onToolCall({ toolCall }: { toolCall: { toolName: string } }) {
      setToolCall(toolCall.toolName);
    },
    onError: (error: Error) => {
      toast.error(
        "Batas permintaan tercapai! Silakan coba lagi dalam beberapa saat ya."
      );
    },
  });

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (messages.length > 0) setIsExpanded(true);
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const currentToolCall = useMemo(() => {
    const tools = messages?.slice(-1)[0]?.toolInvocations;
    if (tools && toolCall === tools[0].toolName) {
      return tools[0].toolName;
    } else {
      return undefined;
    }
  }, [toolCall, messages]);

  const awaitingResponse = useMemo(() => {
    return status === "submitted" || status === "streaming";
  }, [status]);

  const allMessages = useMemo(() => {
    return messages.filter(
      (m: Message) => m.role === "user" || m.role === "assistant"
    );
  }, [messages]);

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim().length >= 3 && !awaitingResponse) {
      handleSubmit(e);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex justify-center items-start sm:pt-16 min-h-screen w-full dark:bg-neutral-900 px-4 md:px-0 py-4">
      <div className="flex flex-col items-center w-full max-w-[500px]">
        <ProjectOverview />
        <motion.div
          animate={{
            minHeight: isExpanded ? 400 : 0,
            padding: isExpanded ? 16 : 0,
          }}
          transition={{
            type: "spring",
            bounce: 0.3,
          }}
          className={cn(
            "rounded-2xl w-full overflow-hidden shadow-lg transition-shadow duration-300",
            isExpanded ? "bg-neutral-200 dark:bg-neutral-800" : "bg-transparent"
          )}
        >
          <div className="flex flex-col w-full justify-between gap-4 h-full">
            <div className="flex-grow overflow-y-auto max-h-[350px] scrollbar-thin scrollbar-thumb-neutral-400 dark:scrollbar-thumb-neutral-700 px-2 py-2">
              <AnimatePresence>
                {allMessages.length > 0 ? (
                  <div className="flex flex-col gap-6 py-2">
                    {allMessages.map((message, index) => (
                      <MessageItem
                        key={message.id}
                        message={message}
                        isLast={
                          index === allMessages.length - 1 && !awaitingResponse
                        }
                      />
                    ))}
                    {awaitingResponse && <Loading tool={currentToolCall} />}
                    <div ref={messagesEndRef} />
                  </div>
                ) : null}
              </AnimatePresence>
            </div>

            <form
              onSubmit={onFormSubmit}
              className="flex space-x-2 mt-2 sticky bottom-0 z-10 bg-neutral-200 dark:bg-neutral-800 rounded-xl p-2 shadow-md"
            >
              <Input
                className="bg-neutral-100 text-base w-full text-neutral-700 dark:bg-neutral-700 dark:placeholder:text-neutral-400 dark:text-neutral-300 rounded-lg px-4 py-3 border border-neutral-300 dark:border-neutral-600 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-200 shadow-sm"
                minLength={3}
                required
                value={input}
                placeholder="Tanyakan apa saja kepada saya..."
                onChange={handleInputChange}
                ref={inputRef}
                disabled={awaitingResponse}
                autoComplete="off"
              />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                disabled={input.trim().length < 3 || awaitingResponse}
                className="bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400 dark:hover:bg-neutral-500 text-neutral-700 dark:text-neutral-200 rounded-lg shadow transition-all duration-200 focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <SendIcon />
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const MessageItem = ({
  message,
  isLast,
}: {
  message: Message;
  isLast: boolean;
}) => {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "px-4 py-3 rounded-2xl max-w-[90%] shadow-md transition-all duration-200",
        isUser
          ? "bg-blue-500 text-white self-end"
          : "bg-neutral-300 dark:bg-neutral-700 self-start"
      )}
    >
      {isUser ? (
        <div className="text-sm">{message.content}</div>
      ) : (
        <AssistantMessage message={message} />
      )}
    </motion.div>
  );
};

const AssistantMessage = ({ message }: { message: Message | undefined }) => {
  if (message === undefined) return null;

  // Split message content to separate main content from citations
  const messageContent = message.content || "";
  const parts = messageContent.split(/\n\n+Sumber:/);
  const mainContent = parts[0];
  const hasSources = parts.length > 1;
  // Process the source content to remove extra whitespace
  const sourcesContent = hasSources ? parts[1].trim() : "";

  return (
    <div
      className="whitespace-pre-wrap font-mono anti text-sm text-neutral-800 dark:text-neutral-200 overflow-hidden"
      id="markdown"
    >
      <div className="overflow-hidden">
        <MemoizedReactMarkdown>{mainContent}</MemoizedReactMarkdown>

        {hasSources && (
          <div className="mt-4 pt-3 border-t border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs">
            <details className="group">
              <summary className="flex items-center gap-1 cursor-pointer hover:text-neutral-800 dark:hover:text-neutral-200 font-medium transition-colors duration-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-open:rotate-90 transition-transform duration-200"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span>Referensi & Sumber Informasi</span>
              </summary>
              <div className="pl-6 mt-2 border-l-2 border-neutral-300 dark:border-neutral-600">
                <div id="markdown" className="inline">
                  <MemoizedReactMarkdown>
                    {sourcesContent}
                  </MemoizedReactMarkdown>
                </div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

const Loading = ({ tool }: { tool?: string }) => {
  const toolName =
    tool === "getInformation"
      ? "Sedang mencari informasi"
      : tool === "addResource"
      ? "Sedang menambahkan informasi"
      : "Sedang berpikir";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring" }}
      className="overflow-hidden flex justify-start items-center px-4 py-3 rounded-2xl bg-neutral-300 dark:bg-neutral-700 self-start max-w-[90%] shadow-md"
    >
      <div className="flex flex-row gap-2 items-center">
        <div className="animate-spin dark:text-neutral-400 text-neutral-500">
          <LoadingIcon />
        </div>
        <div className="text-neutral-500 dark:text-neutral-400 text-sm flex items-center gap-1">
          {toolName} <span className="animate-bounce">...</span>
        </div>
      </div>
    </motion.div>
  );
};

const MemoizedReactMarkdown: React.FC<Options> = React.memo(
  ReactMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);
