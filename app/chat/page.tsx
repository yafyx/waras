"use client";

import { Message } from "ai";
import { useChat } from "ai/react";
import { motion } from "framer-motion";
import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const [toolCall, setToolCall] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
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
    maxSteps: 5, // Increased from 4 to 5 to allow for more complex interactions
    // Removed experimental_throttle which may be causing incomplete responses
    onToolCall({ toolCall }: { toolCall: { toolName: string } }) {
      setToolCall(toolCall.toolName);
      setIsResponseComplete(false);
    },
    onFinish: () => {
      setIsResponseComplete(true);

      // When the response is complete, check if we have messages and redirect to a specific chat ID
      if (messages.length > 0) {
        // Save chat to localStorage with all messages including the latest response
        const timeoutId = setTimeout(() => {
          // Small delay to ensure all message updates are processed
          // Filter messages to include only user and assistant messages
          const filteredMessages = getFilteredMessages(messages);

          localStorage.setItem(
            `chat-${chatId}`,
            JSON.stringify({
              id: chatId,
              messages: filteredMessages,
            })
          );

          // Redirect to the chat with the UUID if not already there
          if (!pathname.includes(`/chat/${chatId}`)) {
            router.push(`/chat/${chatId}`);
          }
        }, 300);

        return () => clearTimeout(timeoutId); // Clean up timeout
      }
    },
  });

  // Define allMessages here, after messages is defined
  const allMessages = useMemo(() => {
    return getFilteredMessages(messages);
  }, [messages]);

  // Check for pending query on page load
  useEffect(() => {
    const pendingQuery = localStorage.getItem("pendingChatQuery");
    const queryParam = searchParams.get("query");

    if (pendingQuery && !hasAutoSubmitted) {
      // Clear the pending query
      localStorage.removeItem("pendingChatQuery");
      setInput(pendingQuery);

      // Use setTimeout to ensure state update has completed
      setTimeout(() => {
        const event = new Event(
          "submit"
        ) as unknown as React.FormEvent<HTMLFormElement>;
        handleSubmit(event);
        setHasAutoSubmitted(true);
      }, 100);
    } else if (queryParam && !hasAutoSubmitted) {
      // Handle query from URL parameters
      const decodedQuery = decodeURIComponent(queryParam);
      setInput(decodedQuery);

      // Submit automatically
      setTimeout(() => {
        const event = new Event(
          "submit"
        ) as unknown as React.FormEvent<HTMLFormElement>;
        handleSubmit(event);
        setHasAutoSubmitted(true);
      }, 100);
    }
  }, [searchParams, hasAutoSubmitted, setInput, handleSubmit]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0 && isResponseComplete) {
      localStorage.setItem(
        `chat-${chatId}`,
        JSON.stringify({
          id: chatId,
          messages: allMessages,
        })
      );
    }
  }, [messages, chatId, isResponseComplete, allMessages]);

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
        <div className="flex-1 overflow-y-auto flex flex-col justify-end">
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
