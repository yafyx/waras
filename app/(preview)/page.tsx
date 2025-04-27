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
      toast.error("You've been rate limited, please try again later!");
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
            padding: isExpanded ? 12 : 0,
          }}
          transition={{
            type: "spring",
            bounce: 0.3,
          }}
          className={cn(
            "rounded-lg w-full overflow-hidden",
            isExpanded ? "bg-neutral-200 dark:bg-neutral-800" : "bg-transparent"
          )}
        >
          <div className="flex flex-col w-full justify-between gap-2 h-full">
            <div className="flex-grow overflow-y-auto max-h-[350px] scrollbar-thin scrollbar-thumb-neutral-400 dark:scrollbar-thumb-neutral-700 px-2">
              <AnimatePresence>
                {allMessages.length > 0 ? (
                  <div className="flex flex-col gap-4 py-2">
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

            <form onSubmit={onFormSubmit} className="flex space-x-2 mt-2">
              <Input
                className="bg-neutral-100 text-base w-full text-neutral-700 dark:bg-neutral-700 dark:placeholder:text-neutral-400 dark:text-neutral-300"
                minLength={3}
                required
                value={input}
                placeholder="Ask me anything..."
                onChange={handleInputChange}
                ref={inputRef}
                disabled={awaitingResponse}
              />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                disabled={input.trim().length < 3 || awaitingResponse}
                className="bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400 dark:hover:bg-neutral-500 text-neutral-700 dark:text-neutral-200"
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        "px-3 py-2 rounded-lg max-w-[90%]",
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
          <div className="mt-4 pt-2 border-t border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 text-xs">
            <div className="flex items-baseline gap-1">
              <span>Sumber:</span>
              <div id="markdown" className="inline">
                <MemoizedReactMarkdown>{sourcesContent}</MemoizedReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Loading = ({ tool }: { tool?: string }) => {
  const toolName =
    tool === "getInformation"
      ? "Getting information"
      : tool === "addResource"
      ? "Adding information"
      : "Thinking";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring" }}
      className="overflow-hidden flex justify-start items-center px-3 py-2 rounded-lg bg-neutral-300 dark:bg-neutral-700 self-start max-w-[90%]"
    >
      <div className="flex flex-row gap-2 items-center">
        <div className="animate-spin dark:text-neutral-400 text-neutral-500">
          <LoadingIcon />
        </div>
        <div className="text-neutral-500 dark:text-neutral-400 text-sm">
          {toolName}...
        </div>
      </div>
    </motion.div>
  );
};

const MemoizedReactMarkdown: React.FC<Options> = React.memo(
  ReactMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);
