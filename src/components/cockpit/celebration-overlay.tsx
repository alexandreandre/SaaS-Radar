"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type CelebrationVariant = "created" | "milestone" | "complete";

type CelebrationOverlayProps = {
  show: boolean;
  message: string;
  variant?: CelebrationVariant;
  onDone?: () => void;
};

function ConfettiBurst() {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: 10 + (i * 17) % 80,
    delay: (i * 0.07) % 0.3,
    color: ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"][i % 5],
    rotate: (i * 47) % 360,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, y: 0, rotate: p.rotate }}
          animate={{ opacity: 0, y: 280, rotate: p.rotate + 720 }}
          transition={{ duration: 1.2, delay: p.delay, ease: "easeOut" }}
          className="absolute top-0 h-2 w-2 rounded-sm"
          style={{ left: `${p.left}%`, backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}

export function CelebrationOverlay({
  show,
  message,
  variant = "milestone",
  onDone,
}: CelebrationOverlayProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);
    if (!show) return;
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, variant === "complete" ? 3500 : 2800);
    return () => clearTimeout(timer);
  }, [show, variant, onDone]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className={cn(
            "fixed bottom-6 left-1/2 z-[100] w-[min(92vw,24rem)] -translate-x-1/2",
            "overflow-hidden rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 shadow-lg backdrop-blur-sm"
          )}
        >
          {variant === "milestone" || variant === "complete" ? <ConfettiBurst /> : null}
          <p className="relative text-center text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            {message}
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
