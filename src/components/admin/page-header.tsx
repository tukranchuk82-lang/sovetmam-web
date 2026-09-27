// Единая шапка раздела админки: иконка + заголовок + пояснение и, при
// необходимости, действие справа. Раньше каждый раздел рисовал заголовок
// по-своему — админка выглядела как несколько разных панелей.

export function AdminPageHeader({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="text-primary [&>svg]:size-6">{icon}</span>
          <h1
            className="text-[22px] font-bold leading-tight tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            {title}
          </h1>
        </div>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
