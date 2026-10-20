"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyMeasureStatuses, setMeasureStatusAction } from "@/app/(app)/podbor/status-actions";
import { AuthPromptModal } from "@/components/auth-prompt-modal";
import type { MeasureStatus } from "@/lib/measure-status-db";

type Ctx = {
  statusOf: (slug: string) => MeasureStatus | null;
  /** Поставить ответ; повторное нажатие на тот же ответ снимает его. */
  choose: (slug: string, status: MeasureStatus) => void;
};

const MeasureStatusContext = createContext<Ctx | null>(null);

/**
 * Общий стор ответов «пользуюсь / не подавал(а) / отказали». Загружается один
 * раз для вошедшего человека; гостя при попытке ответить мягко приглашаем
 * войти — как с избранным.
 */
export function MeasureStatusProvider({ authed, children }: { authed: boolean; children: React.ReactNode }) {
  const router = useRouter();
  const [map, setMap] = useState<Record<string, MeasureStatus>>({});
  const [prompt, setPrompt] = useState(false);

  useEffect(() => {
    if (!authed) return;
    let alive = true;
    getMyMeasureStatuses()
      .then((m) => {
        if (alive) setMap(m);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [authed]);

  const statusOf = useCallback((slug: string) => (authed ? (map[slug] ?? null) : null), [authed, map]);

  const choose = useCallback(
    (slug: string, status: MeasureStatus) => {
      if (!authed) {
        setPrompt(true);
        return;
      }
      const prev = map[slug] ?? null;
      const next = prev === status ? null : status;
      // Оптимистично меняем сразу, при сбое возвращаем как было.
      setMap((m) => {
        const copy = { ...m };
        if (next === null) delete copy[slug];
        else copy[slug] = next;
        return copy;
      });
      const rollback = () =>
        setMap((m) => {
          const copy = { ...m };
          if (prev === null) delete copy[slug];
          else copy[slug] = prev;
          return copy;
        });
      setMeasureStatusAction(slug, next)
        .then((res) => {
          if (!res.authed) {
            rollback();
            setPrompt(true);
          }
        })
        .catch(rollback);
    },
    [authed, map],
  );

  return (
    <MeasureStatusContext.Provider value={{ statusOf, choose }}>
      {children}
      <AuthPromptModal
        open={prompt}
        title="Ответы — для своих"
        text="Отмечать, оформили ли вы меру, могут только вошедшие пользователи. Войдите — и ваши отметки сохранятся."
        onLogin={() => {
          setPrompt(false);
          router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        }}
        onClose={() => setPrompt(false)}
      />
    </MeasureStatusContext.Provider>
  );
}

export function useMeasureStatus(): Ctx {
  const ctx = useContext(MeasureStatusContext);
  if (!ctx) throw new Error("useMeasureStatus должен вызываться внутри <MeasureStatusProvider>");
  return ctx;
}
