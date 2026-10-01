import { setCoordinatorChatNotifyChannelAction } from "@/app/(app)/profile/coordinator-chat/actions";
import type { MessengerChannel } from "@/lib/onboarding-db";
import { cn } from "@/lib/utils";

type Channel = MessengerChannel | "email";

const CHANNEL_LABEL: Record<Channel, string> = {
  email: "Почта",
  telegram: "Telegram",
  vk: "ВКонтакте",
  max: "MAX",
};

/**
 * Один канал уведомлений о новом ответе координатора — не два независимых
 * переключателя. Сделано без клиентского JS, как ViewModeSwitch: у каждой
 * кнопки свой formAction, активная — просто состояние из cookie/базы на
 * момент рендера сервером.
 */
export function CoordinatorChatNotifyPicker({
  current,
  available,
}: {
  current: Channel | null;
  available: Channel[];
}) {
  const options: (Channel | null)[] = [null, ...available];
  return (
    <form className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = current === opt;
        return (
          <button
            key={opt ?? "off"}
            type="submit"
            formAction={setCoordinatorChatNotifyChannelAction.bind(null, opt)}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-[#1B3A6B] bg-[#1B3A6B]/10 text-[#1B3A6B]"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {opt ? CHANNEL_LABEL[opt] : "Выключено"}
          </button>
        );
      })}
    </form>
  );
}
