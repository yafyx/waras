"use client";

import { Message } from "ai";
import { useChat } from "ai/react";
import { motion } from "framer-motion";
import {
  useState,
  useRef,
  useEffect,
  useMemo,
  Suspense,
  useTransition,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { ChatHeader, ChatBody, InputArea } from "@/components/chat";
import {
  saveChatToLocalStorage,
  loadChatFromLocalStorage,
  isStorageAvailable,
} from "@/lib/chat-storage";
import { toast } from "sonner";
import { useOptimistic } from "react";

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
  const [storageAvailable] = useState(() => isStorageAvailable());
  const [isPending, startTransition] = useTransition();

  // Define filtered messages function before using it
  const getFilteredMessages = (msgs: Message[]) => {
    return msgs.filter(
      (m: Message) =>
        m.role === "user" || m.role === "assistant" || m.role === "system"
    );
  };

  // Set up optimistic messaging for instant UI feedback
  const [optimisticMessages, addOptimisticMessage] = useOptimistic<
    Message[],
    Message
  >(
    [], // Start with empty array
    (state, newMessage) => [...state, newMessage]
  );

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

      // Add system message to indicate tool is being used - wrapped in startTransition
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
    onError: (error) => {
      console.error("Chat error:", error);
      // Add system message to inform user of error - wrapped in startTransition
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
  });

  // Define allMessages here, after messages is defined
  const allMessages = useMemo(() => {
    return getFilteredMessages(messages);
  }, [messages]);

  // Merge optimistic messages with actual messages for display if needed
  const displayMessages = useMemo(() => {
    if (optimisticMessages.length === 0) return allMessages;

    // If we have real messages, use them; otherwise use the optimistic ones
    return allMessages.length > 0 ? allMessages : optimisticMessages;
  }, [allMessages, optimisticMessages]);

  // Save messages to localStorage whenever they change and redirect if needed
  useEffect(() => {
    if (messages.length > 0 && isResponseComplete && storageAvailable) {
      // Save chat state to localStorage using our utility function
      const success = saveChatToLocalStorage(chatId, allMessages);

      if (!success) {
        toast("Warning: Failed to save chat history.");
      }

      // Only redirect if we have a complete conversation and aren't already at the specific chat URL
      if (messages.length >= 2 && !pathname.includes(`/chat/${chatId}`)) {
        // Use replace instead of push to avoid back button issues
        router.replace(`/chat/${chatId}`);
      }
    }
  }, [
    messages,
    chatId,
    isResponseComplete,
    allMessages,
    pathname,
    router,
    storageAvailable,
  ]);

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

    // Add message optimistically for instant feedback - wrapped in startTransition
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

  // Use the helper function for the onFormSubmit handler
  const onFormSubmit = (
    e:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    handleFormSubmit(e);
  };

  // Show storage warning if localStorage isn't available
  useEffect(() => {
    if (!storageAvailable) {
      toast(
        "Warning: Local storage is not available. Chat history won't be saved."
      );
    }
  }, [storageAvailable]);

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
            allMessages={displayMessages}
            awaitingResponse={awaitingResponse || isPending}
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
              awaitingResponse={awaitingResponse || isPending}
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
