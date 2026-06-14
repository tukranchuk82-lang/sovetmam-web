import { cn } from "@/lib/utils";

/**
 * Заголовок секции в стиле «Шпаргалки»: тёмно-синий сериф капсом по центру
 * с короткой чертой-акцентом снизу.
 */
export function SectionHeading({
  children,
  subtitle,
  accent = "navy",
  className,
}: {
  children: React.ReactNode;
  subtitle?: string;
  accent?: "navy" | "red";
  className?: string;
}) {
  return (
    <div className={cn("text-center", className)}>
      <h2 className="sm-h2 font-serif text-xl font-bold uppercase leading-tight tracking-wide text-foreground">
        {children}
      </h2>
      <span
        className={cn(
          "sm-h2-rule mx-auto mt-2 block h-1 w-12 rounded-full",
          accent === "red" ? "bg-accent-red" : "bg-brand",
        )}
      />
      {subtitle && (
        <p className="mx-auto mt-3 max-w-[340px] text-sm leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}
