"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

interface AnimatedSectionProps extends HTMLMotionProps<"section"> {
  animationIndex: number;
}

export function AnimatedSection({
  animationIndex,
  children,
  className,
  ...props
}: AnimatedSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px 0px -20% 0px" }}
      transition={{ duration: 0.5, delay: animationIndex * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.section>
  );
}
