"use client";

import { Message } from "ai";
import { AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { MessageItem } from "@/components/chat/message-item";
import { Loading } from "@/components/chat/loading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { memo, useEffect, useRef, useState, useCallback } from "react";
import { InfoBoxes } from "@/components/info-boxes";
import { BlurFade } from "@/components/ui/blur-fade";

interface ChatBodyProps {
  allMessages: Message[];
  awaitingResponse: boolean;
  currentToolCall: string | undefined;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

// Create a separate component for the empty state to avoid hydration issues
// This ensures the component has consistent class names between server and client
const EmptyState = memo(function EmptyState() {
  return (
    <div className="w-full py-8 flex flex-col h-full justify-end">
      <div className="max-w-3xl mx-auto w-full px-4">
        {/* Logo and Title */}
        <BlurFade direction="up" delay={0.1}>
          <div className="flex items-center gap-3 justify-center mb-8">
            <div className="flex items-center justify-center h-[60px]">
              <Link href="/">
                <Image
                  src="/waras.png"
                  alt="Waras AI Logo"
                  width={55}
                  height={55}
                  className="select-none"
                  draggable="false"
                  priority
                />
              </Link>
            </div>
          </div>
        </BlurFade>

        {/* Info Boxes */}
        <InfoBoxes />
      </div>
    </div>
  );
});

// Helper to determine if we should render a message or not (virtualization)
const shouldRenderMessage = (index: number, allMessages: Message[]) => {
  // Always render the last 10 messages for the best user experience
  if (index >= allMessages.length - 10) return true;

  // For older messages, only render every other one if we have many
  if (allMessages.length > 20 && index % 2 !== 0) return false;

  return true;
};

// Memoized component to prevent unnecessary re-renders
export const ChatBody = memo(function ChatBody({
  allMessages,
  awaitingResponse,
  currentToolCall,
  messagesEndRef,
}: ChatBodyProps) {
  // Function to scroll to bottom
  const scrollToBottom = useCallback(
    (immediate = false) => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: immediate ? "auto" : "smooth",
          block: "end",
        });
      }
    },
    [messagesEndRef]
  );

  // Track if this is the initial mount
  const isInitialMount = useRef(true);
  // Track if we have attached a ResizeObserver
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  // State for error handling
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset error state when messages change
    setHasError(false);

    if (allMessages.length > 0) {
      if (isInitialMount.current) {
        // Use requestAnimationFrame to wait for DOM paint
        requestAnimationFrame(() => {
          try {
            scrollToBottom(true);
          } catch (error) {
            console.error("Error scrolling to bottom:", error);
            setHasError(true);
          }
          isInitialMount.current = false;
        });
      } else {
        try {
          scrollToBottom(false);
        } catch (error) {
          console.error("Error scrolling to bottom:", error);
          setHasError(true);
        }
      }
    }
  }, [allMessages.length, scrollToBottom]);

  // Use ResizeObserver to handle images or dynamic content
  useEffect(() => {
    if (!messagesEndRef.current) return;
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }
    // Only observe after initial mount
    if (!isInitialMount.current) {
      try {
        resizeObserverRef.current = new window.ResizeObserver(() => {
          scrollToBottom(true);
        });
        // Observe the parent node of the messagesEndRef (the chat container)
        if (messagesEndRef.current.parentNode) {
          resizeObserverRef.current.observe(
            messagesEndRef.current.parentNode as Element
          );
        }
      } catch (error) {
        console.error("Error setting up ResizeObserver:", error);
        setHasError(true);
      }
    }
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [allMessages.length, messagesEndRef, scrollToBottom]);

  return (
    <div className="flex flex-col h-full">
      {/* Always keep the flex-grow spacer to push content to bottom */}
      <div className="flex-grow"></div>
      <div className="flex flex-col">
        {allMessages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mx-auto w-full max-w-3xl flex flex-col gap-3 px-4 md:px-6 pb-4 pt-6">
            <div className="flex flex-col">
              <AnimatePresence initial={false} presenceAffectsLayout={false}>
                {allMessages.map((message, index) =>
                  shouldRenderMessage(index, allMessages) ? (
                    <MessageItem
                      key={message.id}
                      message={message}
                      isLast={
                        index === allMessages.length - 1 && !awaitingResponse
                      }
                    />
                  ) : null
                )}
              </AnimatePresence>
              {hasError && (
                <div className="text-center py-2 text-sm text-yellow-500">
                  Some content may not display correctly.
                  <button
                    onClick={() => window.location.reload()}
                    className="ml-2 underline hover:text-yellow-300"
                  >
                    Refresh
                  </button>
                </div>
              )}
              <div ref={messagesEndRef} className="h-0" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
