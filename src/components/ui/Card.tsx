"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export function Card({ children, className, hover = true }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_80px_rgba(2,8,23,0.38)] backdrop-blur-xl",
        hover && "hover:-translate-y-1 hover:border-cyan-400/40",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
