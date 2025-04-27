import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { InformationIcon, VercelIcon } from "./icons";

const ProjectOverview = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className="w-full max-w-[600px] my-4"
      initial={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="border rounded-lg p-4 flex flex-col gap-3 text-neutral-500 text-sm dark:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900/50 hover:shadow-sm transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="flex flex-row gap-2 items-center text-neutral-900 dark:text-neutral-50">
            <VercelIcon size={16} />
            <span className="text-neutral-500 dark:text-neutral-400">+</span>
            <InformationIcon />
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          >
            {expanded ? "Hide info" : "Learn more"}
          </button>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="mb-2">
                The{" "}
                <Link
                  href="https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat"
                  className="text-blue-500 hover:underline"
                  target="_blank"
                >
                  useChat
                </Link>{" "}
                hook along with the{" "}
                <Link
                  href="https://sdk.vercel.ai/docs/reference/ai-sdk-core/stream-text"
                  className="text-blue-500 hover:underline"
                  target="_blank"
                >
                  streamText
                </Link>{" "}
                function allows you to build applications with retrieval
                augmented generation (RAG) capabilities.
              </p>
              <p>
                Learn how to build this project by following this{" "}
                <Link
                  className="text-blue-500 hover:underline"
                  href="https://sdk.vercel.ai/docs/guides/rag-chatbot"
                  target="_blank"
                >
                  guide
                </Link>
                .
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ProjectOverview;
