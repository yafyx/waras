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
      document.addEventListener("mousemove", onDragMove);
      document.addEventListener("mouseup", onDragEnd);
    },
    [startDrag]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      startDrag(e.touches[0].clientY);
      document.addEventListener("touchmove", onTouchMove);
      document.addEventListener("touchend", onTouchEnd);
    },
    [startDrag]
  );

  const moveDrag = useCallback(
    (clientY: number) => {
      if (dragStart.current === null) return;
      const delta = dragStart.current - clientY;
      const newHeight = Math.max(
        minHeight,
        Math.min(maxHeight, startHeight.current + delta)
      );
      setTextareaHeight(newHeight);
    },
    [maxHeight, minHeight]
  );

  const onDragMove = useCallback(
    (e: MouseEvent) => {
      moveDrag(e.clientY);
    },
    [moveDrag]
  );

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling while dragging
      moveDrag(e.touches[0].clientY);
    },
    [moveDrag]
  );

  const endDrag = useCallback(() => {
    dragStart.current = null;
    document.body.style.cursor = "";
  }, []);

  const onDragEnd = useCallback(() => {
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", onDragEnd);
    endDrag();
  }, [endDrag, onDragMove]);

  const onTouchEnd = useCallback(() => {
    document.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("touchend", onTouchEnd);
    endDrag();
  }, [endDrag, onTouchMove]);

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
          onTouchStart={onTouchStart}
          className="cursor-ns-resize touch-none flex items-center justify-center h-6 w-full rounded-t-xl border-t border-x border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700/50 transition-colors"
        >
          <div className="w-10 h-1 bg-neutral-600 rounded-full mb-1"></div>
          <span className="sr-only">Drag to resize</span>
        </div>
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
    </form>
  );
});
