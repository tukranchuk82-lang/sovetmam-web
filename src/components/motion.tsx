import { Children, isValidElement } from "react";
import { cn } from "@/lib/utils";

/**
 * Появление секций — на ЧИСТОМ CSS (keyframes sm-fade-up в globals.css).
 * Важно: контент виден по умолчанию (opacity:1) и анимируется через CSS, а не
 * прячется до запуска JS. Иначе при медленной/несработавшей гидратации
 * (например, через туннель) содержимое осталось бы невидимым.
 */
export function MotionFadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  /** Не используется (оставлено для совместимости вызовов). */
  y?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("sm-fade-up", className)}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}

/**
 * Каскадное появление списка — каждый ребёнок с нарастающей CSS-задержкой.
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
        <div
          key={i}
          className={cn("sm-fade-up", itemClassName)}
          style={{ animationDelay: `${initialDelay + i * stagger}s` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

/** «Прыгающее» появление бейджа/иконки — CSS-анимация sm-pop. */
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
    <div
      className={cn("sm-pop", className)}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
