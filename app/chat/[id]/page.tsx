"use client";

import { Message } from "ai";
import { useChat } from "ai/react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, useMemo, useTransition } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ChatBody, InputArea } from "@/components/chat";
import {
  loadChatFromLocalStorage,
  saveChatToLocalStorage,
  isStorageAvailable,
} from "@/lib/chat-storage";
import { toast } from "sonner";
import { useOptimistic } from "react";
import { ChevronDown } from "lucide-react";

const variants = {
  hidden: { opacity: 0 },
  enter: { opacity: 1 },
  exit: { opacity: 0 },
};

interface ChatPageProps {}

export default function ChatPage({}: ChatPageProps) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const chatId = params.id as string;

  const [toolCall, setToolCall] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [hasLoadedInitialMessages, setHasLoadedInitialMessages] =
    useState(false);
  const [isResponseComplete, setIsResponseComplete] = useState(true);
  const [storageAvailable] = useState(() => isStorageAvailable());
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const getFilteredMessages = (msgs: Message[]) => {
    return msgs.filter(
      (m: Message) =>
        m.role === "user" || m.role === "assistant" || m.role === "system"
    );
  };

  useEffect(() => {
    if (initialMessages.length > 0) {
      const firstUserMessage = initialMessages.find((m) => m.role === "user");
      if (firstUserMessage?.content) {
        document.title = `${firstUserMessage.content} - Waras AI`;
      }
    }
  }, [initialMessages]);

  // Load existing chat from localStorage - with debouncing
  useEffect(() => {
    if (!chatId) return;

    const loadChat = () => {
      try {
        if (!storageAvailable) {
          setLoadingError(
            "Local storage is not available. Unable to load chat history."
          );
          setHasLoadedInitialMessages(true);
          return;
        }

        // Use our utility to load chat messages
        const messages = loadChatFromLocalStorage(chatId);
        setInitialMessages(messages);

        if (messages.length === 0) {
          setLoadingError(
            "No chat history found. This chat may have been deleted or never existed."
          );
        }
      } catch (error) {
        console.error("Error loading saved chat:", error);
        setLoadingError("Failed to load chat history.");
      } finally {
        setHasLoadedInitialMessages(true);
      }
    };

    // Use requestAnimationFrame to load chat data during idle time
    requestAnimationFrame(loadChat);

    return () => {
      setHasLoadedInitialMessages(false);
      setLoadingError(null);
    };
  }, [chatId, storageAvailable]);

  // Set up optimistic rendering for new messages
  const [optimisticMessages, addOptimisticMessage] = useOptimistic<
    Message[],
    Message
  >(initialMessages, (state, newMessage) => [...state, newMessage]);

  const chatOptions = useMemo(
    () => ({
      maxSteps: 5,
      id: chatId,
      initialMessages: hasLoadedInitialMessages ? initialMessages : undefined,
      onToolCall({ toolCall }: { toolCall: { toolName: string } }) {
        setToolCall(toolCall.toolName);
        setIsResponseComplete(false);

        // Add system message to indicate tool is being used
        startTransition(() => {
          const systemMessage: Message = {
            id: Date.now().toString() + "-system",
            role: "system",
            content: `Using ${toolCall.toolName} tool...`,
            createdAt: new Date(),
          };
          addOptimisticMessage(systemMessage);
        });
      },
      onFinish: () => {
        setIsResponseComplete(true);
      },
      onError: (error: Error) => {
        console.error("Chat error:", error);
        startTransition(() => {
          const errorMessage: Message = {
            id: Date.now().toString() + "-error",
            role: "system",
            content: `Error: ${
              error.message ||
              "Something went wrong with the chat. Please try again."
            }`,
            createdAt: new Date(),
          };
          addOptimisticMessage(errorMessage);
        });
        setIsResponseComplete(true);
        toast.error("Chat error. Please try again.");
      },
    }),
    [chatId, hasLoadedInitialMessages, initialMessages, addOptimisticMessage]
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
    if (messages.length === 0 || !isResponseComplete || !storageAvailable)
      return;

    const saveTimeout = setTimeout(() => {
      const success = saveChatToLocalStorage(chatId, allMessages);

      if (!success) {
        toast("Failed to save chat history.");
      }
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [messages, chatId, isResponseComplete, allMessages, storageAvailable]);

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

    // Add the message optimistically - wrapped in startTransition
    startTransition(() => {
      const optimisticUserMessage: Message = {
        id: Date.now().toString(),
        content: trimmedInput,
        role: "user",
        createdAt: new Date(),
      };

      addOptimisticMessage(optimisticUserMessage);
    });

    // Let the useChat hook handle the submission
    handleSubmit(e as React.FormEvent<HTMLFormElement>);
    textareaRef.current?.focus();
  };

  const onFormSubmit = (
    e:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    handleFormSubmit(e);
  };

  // Show loading error if there was a problem
  useEffect(() => {
    if (loadingError) {
      toast(loadingError);
    }
  }, [loadingError]);

  // Show button if user is not at the bottom
  useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const threshold = 120; // px from bottom
      const isAtBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        threshold;
      setShowScrollToBottom(!isAtBottom);
    };
    const container = scrollContainerRef.current;
    if (container) container.addEventListener("scroll", handleScroll);
    return () => {
      if (container) container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function handleScrollToBottom() {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }

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
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-850 flex flex-col justify-end"
        >
          <ChatBody
            allMessages={allMessages}
            awaitingResponse={awaitingResponse || isPending}
            currentToolCall={currentToolCall}
            messagesEndRef={messagesEndRef}
          />
        </div>
        <section className="sticky bottom-0 w-full z-20">
          <div className="relative">
            <div className="absolute -top-12 inset-x-0 h-12 bg-gradient-to-b from-transparent to-background pointer-events-none z-10"></div>
            <div className="max-w-3xl mx-auto px-2 pb-2 sm:pb-4 relative">
              <InputArea
                input={input}
                textareaRef={textareaRef}
                handleInputChange={handleInputChange}
                onFormSubmit={onFormSubmit}
                awaitingResponse={awaitingResponse || isPending}
                showScrollToBottom={showScrollToBottom}
                onScrollToBottom={handleScrollToBottom}
              />
              <AnimatePresence>
                {showScrollToBottom && (
                  <motion.button
                    type="button"
                    onClick={handleScrollToBottom}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="absolute cursor-pointer -top-10 right-2 z-30 flex items-center justify-center rounded-full bg-neutral-800 text-white shadow-lg border border-neutral-700 transition-all duration-200 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 h-8 w-8"
                    aria-label="Scroll to bottom"
                  >
                    <ChevronDown className="size-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
