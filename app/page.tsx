"use client";

import { InfoBoxes } from "@/components/info-boxes";
import { HomeInputArea } from "@/components/ui/home-input-area"; // Updated import
import { Spotlight } from "@/components/ui/spotlight";
import { Message } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

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
      | React.KeyboardEvent<HTMLTextAreaElement>,
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
        }),
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
      | React.KeyboardEvent<HTMLTextAreaElement>,
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
            <HomeInputArea
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
      | React.KeyboardEvent<HTMLTextAreaElement>,
  ) => void;
  awaitingResponse: boolean;
}
