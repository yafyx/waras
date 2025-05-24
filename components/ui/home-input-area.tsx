"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function HomeInputArea({
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