import { cn } from "@/lib/utils";

/**
 * Каркас страницы админки: заголовок, пояснение, действия справа, контент.
 * Один источник отступов и иерархии для всех разделов — раньше каждый
 * экран собирал шапку и поля по-своему.
 */
export function AdminPage({
  icon,
  title,
  description,
  actions,
  children,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-4 pb-10 pt-6 md:px-8", className)}>
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            {icon && (
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#F6EDE8] text-[#8E1D2C] [&>svg]:size-[18px]">
                {icon}
              </span>
            )}
            <h1
              className="text-2xl font-bold leading-tight tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              {title}
            </h1>
          </div>
          {description && (
            <p className="mt-1.5 max-w-[62ch] text-[13.5px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      <div className="mt-5">{children}</div>
    </div>
  );
}
