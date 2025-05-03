"use client";
import React from "react";
import { motion } from "motion/react";

type SpotlightProps = {
  gradientFirst?: string;
  gradientSecond?: string;
  gradientThird?: string;
  translateY?: number;
  width?: number;
  height?: number;
  smallWidth?: number;
  duration?: number;
  isStatic?: boolean;
};

export const Spotlight = ({
  gradientFirst = "radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(210, 100%, 85%, .08) 0, hsla(210, 100%, 55%, .02) 50%, hsla(210, 100%, 45%, 0) 80%)",
  gradientSecond = "radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, .06) 0, hsla(210, 100%, 55%, .02) 80%, transparent 100%)",
  gradientThird = "radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, .04) 0, hsla(210, 100%, 45%, .02) 80%, transparent 100%)",
  translateY = -350,
  width = 560,
  height = 1380,
  smallWidth = 240,
  duration = 1.5,
  isStatic = false,
}: SpotlightProps = {}) => {
  // Responsive width and height adjustments
  const mobileWidth = Math.floor(width * 0.7);
  const mobileHeight = Math.floor(height * 0.7);
  const mobileSmallWidth = Math.floor(smallWidth * 0.7);
  const mobileTranslateY = Math.floor(translateY * 0.8);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration }}
      className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden"
    >
      {/* Left side spotlight */}
      <motion.div
        initial={{ x: -50, opacity: 0.3 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: duration * 1.2, ease: "easeOut" }}
        className="absolute top-0 left-0 w-full h-full z-40 pointer-events-none"
      >
        <div
          style={{
            transform: `translateY(${translateY}px) rotate(-45deg)`,
            background: gradientFirst,
            width: `${width}px`,
            height: `${height}px`,
          }}
          className="absolute top-0 left-0 max-sm:hidden"
        />

        <div
          style={{
            transform: `translateY(${mobileTranslateY}px) rotate(-45deg)`,
            background: gradientFirst,
            width: `${mobileWidth}px`,
            height: `${mobileHeight}px`,
          }}
          className="absolute top-0 left-0 hidden max-sm:block"
        />

        <div
          style={{
            transform: "rotate(-45deg) translate(5%, -50%)",
            background: gradientSecond,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className="absolute top-0 left-0 origin-top-left max-sm:hidden"
        />

        <div
          style={{
            transform: "rotate(-45deg) translate(5%, -50%)",
            background: gradientSecond,
            width: `${mobileSmallWidth}px`,
            height: `${mobileHeight}px`,
          }}
          className="absolute top-0 left-0 origin-top-left hidden max-sm:block"
        />

        <div
          style={{
            transform: "rotate(-45deg) translate(-180%, -70%)",
            background: gradientThird,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className="absolute top-0 left-0 origin-top-left max-sm:hidden"
        />

        <div
          style={{
            transform: "rotate(-45deg) translate(-180%, -70%)",
            background: gradientThird,
            width: `${mobileSmallWidth}px`,
            height: `${mobileHeight}px`,
          }}
          className="absolute top-0 left-0 origin-top-left hidden max-sm:block"
        />
      </motion.div>

      {/* Right side spotlight - hidden on mobile */}
      <motion.div
        initial={{ x: 50, opacity: 0.3 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: duration * 1.2, ease: "easeOut" }}
        className="absolute top-0 right-0 w-full h-full z-40 pointer-events-none max-sm:hidden"
      >
        <div
          style={{
            transform: `translateY(${translateY}px) rotate(45deg)`,
            background: gradientFirst,
            width: `${width}px`,
            height: `${height}px`,
          }}
          className="absolute top-0 right-0"
        />

        <div
          style={{
            transform: "rotate(45deg) translate(-5%, -50%)",
            background: gradientSecond,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className="absolute top-0 right-0 origin-top-right"
        />

        <div
          style={{
            transform: "rotate(45deg) translate(180%, -70%)",
            background: gradientThird,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className="absolute top-0 right-0 origin-top-right"
        />
      </motion.div>
    </motion.div>
  );
};
