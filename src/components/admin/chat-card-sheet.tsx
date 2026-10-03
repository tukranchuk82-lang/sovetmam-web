"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";
import { Drawer } from "@/components/admin/ui/drawer";

/**
 * Карточка клиента на узких экранах: свёрнута, открывается по нажатию.
 * Содержимое готовит сервер и передаёт сюда как children — клиентский код
 * отвечает только за открытие и закрытие панели.
 */
export function ChatCardSheet({ name, children }: { name: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 text-[13px] font-semibold text-[#16233F] xl:hidden"
      >
        <UserRound className="size-4" />
        Карточка
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title={name} subtitle="Карточка клиента">
        {children}
      </Drawer>
    </>
  );
}
