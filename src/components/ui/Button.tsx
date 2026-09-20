"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  href?: string;
}

export function Button({
  children,
  variant = "primary",
  className,
  href,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400";
  const variants = {
    primary: "bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30",
    secondary: "border border-white/10 bg-white/5 text-slate-100 backdrop-blur hover:bg-white/10",
    ghost: "text-slate-300 hover:bg-white/10 hover:text-white",
  };

  if (href) {
    return (
      <Link
        href={href}
        className={cn(base, variants[variant], className)}
      >
        <motion.span
          className="inline-flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          {children}
        </motion.span>
      </Link>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={cn(base, variants[variant], className)}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}
