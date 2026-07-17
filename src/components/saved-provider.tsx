"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { getMySavedSlugs, toggleSavedAction } from "@/app/(app)/saved/actions";
import { AuthPromptModal } from "@/components/auth-prompt-modal";

type SavedContextValue = {
  ready: boolean;
  isSaved: (slug: string) => boolean;
  /** Переключить сохранение меры (оптимистично + запрос на сервер). */
  toggle: (slug: string) => void;
};

const SavedContext = createContext<SavedContextValue | null>(null);

/**
 * Общий стор избранного для всех «сердечек» приложения. Грузит слаги один раз
 * при монтировании (для авторизованного), дальше карточки и кнопки читают/пишут
 * из этого набора — без запроса на каждую карточку. Гостя при попытке сохранить
 * отправляем на вход.
 */
export function SavedProvider({
  authed,
  children,
}: {
  authed: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [slugs, setSlugs] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(!authed);
  // Окно «войдите, чтобы сохранять» — показываем гостю вместо резкого редиректа.
  const [promptOpen, setPromptOpen] = useState(false);

  useEffect(() => {
    // Слаги грузим только для авторизованного. Для гостя набор остаётся пустым,
    // а чтения дополнительно защищены проверкой authed ниже (стор не «протекает»
    // между сессиями).
    if (!authed) return;
    let alive = true;
    getMySavedSlugs()
      .then((list) => {
        if (alive) setSlugs(new Set(list));
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [authed]);

  const isSaved = useCallback(
    (slug: string) => authed && slugs.has(slug),
    [authed, slugs],
  );

  const goLogin = useCallback(() => {
    const next = encodeURIComponent(
      window.location.pathname + window.location.search,
    );
    router.push(`/login?next=${next}`);
  }, [router]);

  const toggle = useCallback(
    (slug: string) => {
      if (!authed) {
        setPromptOpen(true);
        return;
      }
      // Оптимистично переключаем локально, затем подтверждаем на сервере.
      setSlugs((prev) => {
        const copy = new Set(prev);
        if (copy.has(slug)) copy.delete(slug);
        else copy.add(slug);
        return copy;
      });
      toggleSavedAction(slug)
        .then((res) => {
          if (!res.authed) {
            // Сессия истекла между загрузкой и кликом — тоже мягко приглашаем.
            setSlugs((prev) => {
              const copy = new Set(prev);
              copy.delete(slug);
              return copy;
            });
            setPromptOpen(true);
            return;
          }
          // Приводим к авторитетному состоянию с сервера.
          setSlugs((prev) => {
            const copy = new Set(prev);
            if (res.saved) copy.add(slug);
            else copy.delete(slug);
            return copy;
          });
        })
        .catch(() => {
          // Ошибка сети — откатываем оптимистичное переключение (флипаем назад).
          setSlugs((prev) => {
            const copy = new Set(prev);
            if (copy.has(slug)) copy.delete(slug);
            else copy.add(slug);
            return copy;
          });
        });
    },
    [authed],
  );

  return (
    <SavedContext.Provider value={{ ready, isSaved, toggle }}>
      {children}
      <AuthPromptModal
        open={promptOpen}
        onLogin={() => {
          setPromptOpen(false);
          goLogin();
        }}
        onClose={() => setPromptOpen(false)}
      />
    </SavedContext.Provider>
  );
}

export function useSaved(): SavedContextValue {
  const ctx = useContext(SavedContext);
  if (!ctx) {
    throw new Error("useSaved должен вызываться внутри <SavedProvider>");
  }
  return ctx;
}
