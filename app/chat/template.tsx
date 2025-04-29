"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import React, { useRef, useEffect } from "react";

export default function ChatTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  // Ensure first render completes without animation delays
  useEffect(() => {
    isFirstRender.current = false;
    // Cleanup any potential memory leaks
    return () => {
      isFirstRender.current = true;
    };
  }, []);

  // Create a simplified version that doesn't clone all children
  // This improves performance by avoiding unnecessary React operations
  return (
    <AnimatePresence mode="sync" initial={isFirstRender.current ? false : true}>
      {React.isValidElement(children)
        ? React.cloneElement(children, { key: pathname })
        : children}
    </AnimatePresence>
  );
}
