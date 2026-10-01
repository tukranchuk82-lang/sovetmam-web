"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";

/**
 * Боковая панель справа: детали записи открываются рядом со списком, не
 * сдвигая и не удлиняя его (раньше карточка раскрывалась «аккордеоном» и
 * список прыгал под пальцем/курсором).
 */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-[#101A30]/40 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col bg-card shadow-[-24px_0_60px_-20px_rgba(16,26,48,0.4)] outline-none transition-transform duration-200 data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full">
          <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
            <div className="min-w-0">
              <Dialog.Title className="truncate text-base font-bold leading-tight">{title}</Dialog.Title>
              {subtitle && (
                <Dialog.Description className="mt-0.5 truncate text-[13px] text-muted-foreground">
                  {subtitle}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label="Закрыть"
              className="-mr-1.5 grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
