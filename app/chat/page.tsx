"use client";

import { Message } from "ai";
import { useChat } from "ai/react";
import { motion } from "framer-motion";
import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { ChatHeader, ChatBody, InputArea } from "@/components/chat";

// Animation variants
const variants = {
  hidden: { opacity: 0 },
  enter: { opacity: 1 },
  exit: { opacity: 0 },
};

interface ChatPageProps {}

function ChatPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const [toolCall, setToolCall] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isResponseComplete, setIsResponseComplete] = useState(true);
  const [chatId] = useState(() => uuidv4());

  // Define filtered messages function before using it
  const getFilteredMessages = (msgs: Message[]) => {
    return msgs.filter(
      (m: Message) => m.role === "user" || m.role === "assistant"
    );
  };

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    status,
    setInput,
  } = useChat({
    id: chatId,
    maxSteps: 5,
    onToolCall({ toolCall }: { toolCall: { toolName: string } }) {
      setToolCall(toolCall.toolName);
      setIsResponseComplete(false);
    },
    onFinish: () => {
      setIsResponseComplete(true);
    },
  });

  // Define allMessages here, after messages is defined
  const allMessages = useMemo(() => {
    return getFilteredMessages(messages);
  }, [messages]);

  // Save messages to localStorage whenever they change and redirect if needed
  useEffect(() => {
    if (messages.length > 0 && isResponseComplete) {
      // Save chat state to localStorage
      localStorage.setItem(
        `chat-${chatId}`,
        JSON.stringify({
          id: chatId,
          messages: allMessages,
        })
      );

      // Trigger refresh of the chat list
      window.dispatchEvent(new CustomEvent("waras:refreshChatList"));

      // Only redirect if we have a complete conversation and aren't already at the specific chat URL
      if (messages.length >= 2 && !pathname.includes(`/chat/${chatId}`)) {
        // Use replace instead of push to avoid back button issues
        router.replace(`/chat/${chatId}`);
      }
    }
  }, [messages, chatId, isResponseComplete, allMessages, pathname, router]);

  const currentToolCall = useMemo(() => {
    const tools = messages.slice(-1)[0]?.toolInvocations;
    if (tools && toolCall === tools[0]?.toolName) {
      return tools[0].toolName;
    } else {
      return undefined;
    }
  }, [toolCall, messages]);

  const awaitingResponse = useMemo(() => {
    return status === "submitted" || status === "streaming";
  }, [status]);

  // Helper function to handle form submission with optional direct input
  const handleFormSubmit = async (
    e:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLTextAreaElement>,
    directInput?: string
  ) => {
    e.preventDefault();
    const trimmedInput = directInput || input.trim();

    // More strict validation to prevent empty submissions
    if (!trimmedInput || trimmedInput === "") return;
    if (awaitingResponse) return;

    setIsResponseComplete(false);

    // Let the useChat hook handle the submission
    handleSubmit(e as React.FormEvent<HTMLFormElement>);
    textareaRef.current?.focus();
  };

  // Use the helper function for the onFormSubmit handler
  const onFormSubmit = (
    e:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    handleFormSubmit(e);
  };

  return (
    <motion.div
      key={pathname}
      initial="hidden"
      animate="enter"
      exit="exit"
      variants={variants}
      transition={{ duration: 0.15, type: "tween" }}
      className="flex flex-col h-screen"
    >
      <ChatHeader />

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-850 flex flex-col justify-end">
          <ChatBody
            allMessages={allMessages}
            awaitingResponse={awaitingResponse}
            currentToolCall={currentToolCall}
            messagesEndRef={messagesEndRef}
          />
        </div>

        <section className="sticky bottom-0 w-full p-3 md:p-4 z-20 bg-background">
          <div className="max-w-3xl mx-auto">
            <InputArea
              input={input}
              textareaRef={textareaRef}
              handleInputChange={handleInputChange}
              onFormSubmit={onFormSubmit}
              awaitingResponse={awaitingResponse}
            />
          </div>
        </section>
      </div>
    </motion.div>
  );
}

export default function ChatPage({}: ChatPageProps) {
  return (
    <Suspense fallback={<div>Loading chat...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}
