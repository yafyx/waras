"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { SendHorizonal } from "lucide-react";
import { useState, useRef, useCallback, memo } from "react";

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
  isChatActive?: boolean;
}

// Memoize the component to prevent unnecessary re-renders
export const InputArea = memo(function InputArea({
  input,
  textareaRef,
  handleInputChange,
  onFormSubmit,
  awaitingResponse,
  isChatActive,
}: InputAreaProps) {
  const [textareaHeight, setTextareaHeight] = useState(60);
  const minHeight = 60;
  const maxHeight = 300;
  const dragStart = useRef<number | null>(null);
  const startHeight = useRef<number>(60);
  const internalRef = useRef<HTMLTextAreaElement>(null);

  // Use the provided ref or fall back to our internal ref
  const textareaRefToUse = textareaRef || internalRef;

  // Memoize the event handlers to prevent recreating on each render
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

  const onDragStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      dragStart.current = e.clientY;
      startHeight.current = textareaHeight;
      document.addEventListener("mousemove", onDragMove);
      document.addEventListener("mouseup", onDragEnd);
      document.body.style.cursor = "ns-resize";
    },
    [textareaHeight]
  );

  const onDragMove = useCallback(
    (e: MouseEvent) => {
      if (dragStart.current === null) return;
      const delta = dragStart.current - e.clientY;
      const newHeight = Math.max(
        minHeight,
        Math.min(maxHeight, startHeight.current + delta)
      );
      setTextareaHeight(newHeight);
    },
    [maxHeight, minHeight]
  );

  const onDragEnd = useCallback(() => {
    dragStart.current = null;
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", onDragEnd);
    document.body.style.cursor = "";
  }, [onDragMove]);

  // Use passive event handlers for better touch performance
  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (input.trim() && !awaitingResponse) {
        onFormSubmit(e);
      }
    },
    [input, awaitingResponse, onFormSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex w-full flex-col">
        <div
          onMouseDown={onDragStart}
          className="cursor-ns-resize flex items-center justify-center h-6 w-full rounded-t-xl border-t border-x border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700/50 transition-colors"
        >
          <div className="w-10 h-1 bg-neutral-600 rounded-full mb-1"></div>
          <span className="sr-only">Drag to resize</span>
        </div>
        <Textarea
          ref={textareaRefToUse}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Tulis pesan Anda di sini..."
          rows={1}
          disabled={awaitingResponse}
          style={{
            height: `${textareaHeight}px`,
            borderTopLeftRadius: "0",
            borderTopRightRadius: "0",
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`,
          }}
          className="flex w-full border border-neutral-700 bg-neutral-800/80 px-4 py-3 text-base text-neutral-100 shadow-md placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 overflow-y-auto pr-12 rounded-b-xl rounded-t-none"
        />
        <Button
          type="submit"
          size="icon"
          disabled={awaitingResponse || !input.trim() || input.trim() === ""}
          className={cn(
            "absolute right-2 bottom-2 flex items-center justify-center rounded-lg bg-blue-600 text-white transition-colors duration-200 ease-in-out hover:bg-blue-700 disabled:bg-neutral-600 disabled:opacity-70",
            "h-8 w-8"
          )}
        >
          <SendHorizonal className="size-4" />
        </Button>
      </div>
      <p className="text-sm text-center text-neutral-500/50 mt-2 px-2">
        Waras AI dapat membuat kesalahan. Pertimbangkan untuk memeriksa
        informasi penting.
      </p>
    </form>
  );
});
