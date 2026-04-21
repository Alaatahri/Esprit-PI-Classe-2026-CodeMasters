"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Transition douce entre les vues de l’espace connecté (fade léger, sans effet tape-à-l’œil).
 */
export default function EspaceTemplate({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className="w-full">{children}</div>;
  }

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
