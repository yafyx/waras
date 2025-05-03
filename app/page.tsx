"use client";

import Image from "next/image";
import { Message } from "ai";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { InfoBoxes } from "@/components/info-boxes";
import { v4 as uuidv4 } from "uuid";
import { Spotlight } from "@/components/ui/spotlight";
import { Button } from "@/components/ui/button";
import { useRef, useCallback } from "react";

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
    <div className="min-h-screen bg-neutral-900">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-0"></div>
      <Spotlight />
      <motion.div
        key="initial-layout"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 flex h-[100dvh] w-full flex-col items-center justify-center text-white"
      >
        <div className="relative flex w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 md:px-6">
          {/* Logo and Title */}
          <div className="flex items-center gap-3 mt-8">
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
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-40">
          <div className="flex gap-3">
            <a
              href="https://git.new/yfyx"
              target="_blank"
              className="font-medium hover:text-gray-400 transition-colors"
            >
              yfyx
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
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

  // Store function references to avoid circular dependencies
  const dragMoveRef = useRef<((e: MouseEvent) => void) | null>(null);
  const dragEndRef = useRef<(() => void) | null>(null);
  const touchMoveRef = useRef<((e: TouchEvent) => void) | null>(null);
  const touchEndRef = useRef<(() => void) | null>(null);

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

  const endDrag = useCallback(() => {
    dragStart.current = null;
    document.body.style.cursor = "";
  }, []);

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

  // Setup refs in useEffect
  useEffect(() => {
    dragMoveRef.current = (e: MouseEvent) => moveDrag(e.clientY);
    dragEndRef.current = () => {
      if (dragMoveRef.current)
        document.removeEventListener("mousemove", dragMoveRef.current);
      if (dragEndRef.current)
        document.removeEventListener("mouseup", dragEndRef.current);
      endDrag();
    };
    touchMoveRef.current = (e: TouchEvent) => {
      e.preventDefault();
      moveDrag(e.touches[0].clientY);
    };
    touchEndRef.current = () => {
      if (touchMoveRef.current)
        document.removeEventListener("touchmove", touchMoveRef.current);
      if (touchEndRef.current)
        document.removeEventListener("touchend", touchEndRef.current);
      endDrag();
    };
  }, [moveDrag, endDrag]);

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
      if (dragMoveRef.current)
        document.addEventListener("mousemove", dragMoveRef.current);
      if (dragEndRef.current)
        document.addEventListener("mouseup", dragEndRef.current);
    },
    [startDrag]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      startDrag(e.touches[0].clientY);
      if (touchMoveRef.current)
        document.addEventListener("touchmove", touchMoveRef.current);
      if (touchEndRef.current)
        document.addEventListener("touchend", touchEndRef.current);
    },
    [startDrag]
  );

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex w-full flex-col">
        <Textarea
          ref={textareaRefToUse}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Tanyakan masalah psikologi Anda..."
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
            "flex w-full border border-neutral-700 bg-neutral-800/80 px-4 py-3 text-base text-neutral-100 shadow-md placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 overflow-y-auto pr-12 rounded-t-xl rounded-b-none"
          )}
        />
        <Button
          type="submit"
          size="icon"
          disabled={awaitingResponse || !input.trim()}
          className={cn(
            "absolute right-3 top-3 flex items-center justify-center rounded-full bg-white text-black transition-all duration-200 ease-in-out hover:scale-110 disabled:bg-neutral-600 disabled:opacity-50 focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 active:bg-white active:text-neutral-900 active:transition-all active:duration-100",
            "h-10 w-10 cursor-pointer"
          )}
        >
          <ArrowUp className="size-5 stroke-[2]" />
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
