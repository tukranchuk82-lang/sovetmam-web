import "server-only";

/**
 * Заготовка под будущий внутренний чат «координатор ↔ подписчик» (Таня
 * попросила предусмотреть техническую возможность, механику самого чата
 * распишет отдельно). Схема сообщений уже есть — таблица
 * coordinator_messages (миграция 0032) — а вот отправка уведомления в бота
 * координатору пока не подключена: неизвестно, через какого бота и по
 * какому триггеру это должно уходить (см. src/lib/telegram-подобные заготовки
 * в other проектах для образца, когда дойдём до этого).
 *
 * Пока — просто лог, как и другие заглушки уведомлений в этом проекте
 * (см. src/lib/notify/email.ts: [stub] в консоль, когда транспорт не настроен).
 */
export async function notifyCoordinatorAboutMessage(params: {
  coordinatorTelegramChatId: string | null;
  region: string;
  fromUserName: string;
  preview: string;
}): Promise<void> {
  if (!params.coordinatorTelegramChatId) {
    console.log(
      `[coordinator-chat][stub] координатору региона «${params.region}» некуда слать: телеграм не привязан. От ${params.fromUserName}: ${params.preview}`,
    );
    return;
  }
  console.log(
    `[coordinator-chat][stub] отправила бы в чат ${params.coordinatorTelegramChatId}: новое сообщение от ${params.fromUserName} (${params.region}) — «${params.preview}»`,
  );
}
