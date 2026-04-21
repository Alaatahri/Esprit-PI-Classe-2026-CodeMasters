"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FadeInWhenVisibleProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  margin?: string;
};

export function FadeInWhenVisible({
  children,
  className,
  delay = 0,
  y = 12,
  margin = "-24px",
}: FadeInWhenVisibleProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin }}
      transition={{
        duration: 0.42,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
