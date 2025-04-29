"use client";

import { Message } from "ai";
import { useChat } from "ai/react";
import { motion } from "framer-motion";
import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, usePathname } from "next/navigation";
import { ChatHeader, ChatBody, InputArea } from "@/components/chat";

// Animation variants
const variants = {
  hidden: { opacity: 0 },
  enter: { opacity: 1 },
  exit: { opacity: 0 },
};

interface ChatPageProps {}

export default function ChatPage({}: ChatPageProps) {
  const params = useParams();
  const pathname = usePathname();
  const chatId = params.id as string;

  const [toolCall, setToolCall] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [hasLoadedInitialMessages, setHasLoadedInitialMessages] =
    useState(false);
  const [isResponseComplete, setIsResponseComplete] = useState(true);

  // Helper function to filter messages
  const getFilteredMessages = (msgs: Message[]) => {
    return msgs.filter(
      (m: Message) => m.role === "user" || m.role === "assistant"
    );
  };

  // Load existing chat from localStorage
  useEffect(() => {
    if (chatId) {
      const savedChat = localStorage.getItem(`chat-${chatId}`);
      if (savedChat) {
        try {
          const parsedChat = JSON.parse(savedChat);
          setInitialMessages(parsedChat.messages || []);
          setHasLoadedInitialMessages(true);
        } catch (error) {
          console.error("Error parsing saved chat:", error);
          setHasLoadedInitialMessages(true);
        }
      } else {
        setHasLoadedInitialMessages(true);
      }
    }
  }, [chatId]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    status,
    setMessages,
  } = useChat({
    maxSteps: 5, // Increased from 4 to 5
    // Removed experimental_throttle which may be causing incomplete responses
    id: chatId,
    initialMessages: hasLoadedInitialMessages ? initialMessages : undefined,
    onToolCall({ toolCall }: { toolCall: { toolName: string } }) {
      setToolCall(toolCall.toolName);
      setIsResponseComplete(false);
    },
    onFinish: () => {
      setIsResponseComplete(true);

      // When the response is complete, save the updated chat
      if (messages.length > 0) {
        // Small delay to ensure all message updates are processed
        const timeoutId = setTimeout(() => {
          // Filter messages to include only user and assistant messages
          const filteredMessages = getFilteredMessages(messages);

          // Save chat to localStorage
          localStorage.setItem(
            `chat-${chatId}`,
            JSON.stringify({
              id: chatId,
              messages: filteredMessages,
            })
          );
        }, 300);

        return () => clearTimeout(timeoutId); // Clean up timeout
      }
    },
  });

  // Set initial messages after loading
  useEffect(() => {
    if (
      hasLoadedInitialMessages &&
      initialMessages.length > 0 &&
      messages.length === 0
    ) {
      setMessages(initialMessages);
    }
  }, [hasLoadedInitialMessages, initialMessages, messages.length, setMessages]);

  const allMessages = useMemo(() => {
    return getFilteredMessages(messages);
  }, [messages]);

  // Also save messages to localStorage whenever they change
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

  // Handle form submission with optional direct input
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

      {/* Main content area that scrolls */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 overflow-y-auto flex flex-col justify-end">
          <ChatBody
            allMessages={allMessages}
            awaitingResponse={awaitingResponse}
            currentToolCall={currentToolCall}
            messagesEndRef={messagesEndRef}
          />
        </div>

        <section className="w-full p-3 md:p-4 z-20 bg-background">
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
