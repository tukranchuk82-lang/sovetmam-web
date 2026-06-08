"use client";

import { Children, isValidElement } from "react";
import { motion } from "motion/react";

/**
 * Простое появление с лёгким сдвигом вверх. Подходит для отдельных секций.
 */
export function MotionFadeIn({
  children,
  delay = 0,
  y = 12,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Каскадное появление списка — каждый ребёнок появляется с задержкой.
 * Передавайте серверные компоненты как children — обёртка клиентская.
 */
export function MotionStagger({
  children,
  stagger = 0.06,
  initialDelay = 0,
  className,
  itemClassName,
}: {
  children: React.ReactNode;
  stagger?: number;
  initialDelay?: number;
  className?: string;
  itemClassName?: string;
}) {
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <div className={className}>
      {items.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.45,
            delay: initialDelay + i * stagger,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={itemClassName}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

/**
 * «Прыгающий» бейдж/иконка — лёгкая пульсация при появлении.
 */
export function MotionPop({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 240,
        damping: 18,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
