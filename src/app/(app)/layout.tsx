import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto flex h-dvh max-w-[480px] flex-col overflow-hidden bg-white shadow-2xl">

      {/* Маленькая полоска-индикатор прототипа. Уберём после согласования. */}
      <div className="shrink-0 bg-amber-50/80 px-3 py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-amber-800 backdrop-blur">
        Прототип · данные демонстрационные
      </div>
      <AppHeader />
      <main className="flex-1 overflow-y-auto overscroll-contain bg-white text-foreground">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
