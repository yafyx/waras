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
  }, []);

  // Clone children to ensure React keys are properly set for AnimatePresence
  const childrenWithKeys = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      // Pass the pathname as key to ensure unique keys between routes
      return React.cloneElement(child, {
        key: pathname,
      });
    }
    return child;
  });

  return (
    <AnimatePresence mode="wait" initial={isFirstRender.current ? false : true}>
      {childrenWithKeys}
    </AnimatePresence>
  );
}
