"use client";

import { Message } from "ai";
import { useChat } from "ai/react";
import { motion } from "framer-motion";
import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, usePathname } from "next/navigation";
import { ChatHeader, ChatBody, InputArea } from "@/components/chat";
import dynamic from "next/dynamic";

// Animation variants with reduced duration
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

  // Load existing chat from localStorage - with debouncing
  useEffect(() => {
    if (!chatId) return;

    const loadChat = () => {
      try {
        const savedChat = localStorage.getItem(`chat-${chatId}`);
        if (savedChat) {
          const parsedChat = JSON.parse(savedChat);
          setInitialMessages(parsedChat.messages || []);
        }
      } catch (error) {
        console.error("Error parsing saved chat:", error);
      } finally {
        setHasLoadedInitialMessages(true);
      }
    };

    // Use requestAnimationFrame to load chat data during idle time
    requestAnimationFrame(loadChat);

    return () => {
      setHasLoadedInitialMessages(false);
    };
  }, [chatId]);

  const chatOptions = useMemo(
    () => ({
      maxSteps: 5,
      id: chatId,
      initialMessages: hasLoadedInitialMessages ? initialMessages : undefined,
      onToolCall({ toolCall }: { toolCall: { toolName: string } }) {
        setToolCall(toolCall.toolName);
        setIsResponseComplete(false);
      },
      onFinish: () => {
        setIsResponseComplete(true);

        // Save chat with a small delay and throttle
        if (messages.length > 0) {
          // Throttle saving to localStorage
          const timeoutId = setTimeout(() => {
            try {
              const filteredMessages = getFilteredMessages(messages);
              // Use a smaller JSON representation
              localStorage.setItem(
                `chat-${chatId}`,
                JSON.stringify({
                  id: chatId,
                  messages: filteredMessages,
                })
              );

              // Trigger refresh of the chat list
              window.dispatchEvent(new CustomEvent("waras:refreshChatList"));
            } catch (error) {
              console.error("Error saving chat:", error);
            }
          }, 500);

          return () => clearTimeout(timeoutId);
        }
      },
    }),
    [chatId, hasLoadedInitialMessages, initialMessages]
  );

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    status,
    setMessages,
    append,
  } = useChat(chatOptions);

  // Set initial messages after loading and auto-submit if needed
  useEffect(() => {
    if (
      hasLoadedInitialMessages &&
      initialMessages.length === 1 &&
      messages.length === 0 &&
      initialMessages[0].role === "user"
    ) {
      setMessages([]); // Clear messages before sending
      // Use append to send the user message to the model
      append({
        id: initialMessages[0].id,
        role: initialMessages[0].role,
        content: initialMessages[0].content,
        createdAt: initialMessages[0].createdAt,
      });
    }
  }, [
    hasLoadedInitialMessages,
    initialMessages,
    messages.length,
    setMessages,
    append,
  ]);

  const allMessages = useMemo(() => {
    return getFilteredMessages(messages);
  }, [messages]);

  // Throttled localStorage updates
  useEffect(() => {
    if (messages.length === 0 || !isResponseComplete) return;

    const saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem(
          `chat-${chatId}`,
          JSON.stringify({
            id: chatId,
            messages: allMessages,
          })
        );

        // Trigger refresh of the chat list
        window.dispatchEvent(new CustomEvent("waras:refreshChatList"));
      } catch (error) {
        console.error("Error saving messages to localStorage:", error);
      }
    }, 1000);

    return () => clearTimeout(saveTimeout);
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
      transition={{ duration: 0.1, type: "tween" }}
      className="flex flex-col h-screen"
    >
      <ChatHeader />

      {/* Main content area that scrolls */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-850 flex flex-col justify-end">
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
