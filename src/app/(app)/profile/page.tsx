import { INQUIRY_TYPE_LABEL } from "@/lib/inquiries";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LogOut,
  MessageSquare,
  FolderInput,
  CalendarCheck,
  ChevronRight,
  Clock,
  CheckCircle2,
  Sparkles,
  MapPin,
  Heart,
} from "lucide-react";
import {
  CHANNEL_COLORS,
  CHANNEL_LABELS,
  getCurrentDemoUser,
  ROLE_LABELS,
} from "@/lib/demo-auth";
import { getCurrentAppUser } from "@/lib/user-session";
import { logoutDemoUser } from "@/app/(app)/login/actions";
import { logout } from "@/app/(app)/login/onboarding-actions";
import { isAppAdmin, ROLE_LABELS as APP_ROLE_LABELS, type AppUser } from "@/lib/onboarding-db";
import { resolveUserAvatar } from "@/lib/avatar";
import { listInquiriesForUser } from "@/lib/inquiries-db";
import { listSavedSlugs } from "@/lib/saved-measures-db";
import { Avatar } from "@/components/avatar";
import { AvatarEditor } from "@/components/avatar-editor";
import { MessengerManager } from "@/components/messenger-manager";
import { Badge } from "@/components/ui/badge";
import { MotionFadeIn } from "@/components/motion";

export const metadata = { title: "Личный кабинет" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const demoUser = await getCurrentDemoUser();
  const appUser = demoUser ? null : await getCurrentAppUser();
  if (!demoUser && !appUser) redirect("/login");
  if (appUser) return <AppUserProfile user={appUser} />;

  const user = demoUser!;

  const isAdmin = user.role === "owner" || user.role === "tech";
  const inquiries = await listInquiriesForUser(user.id);

  return (
    <div className="px-4 py-5">
      <MotionFadeIn>
        <div className="flex items-center gap-3">
          <Avatar name={user.name} color={user.avatarColor} size={64} />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-extrabold leading-tight">
              {user.name}
            </h1>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {user.username}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              <Badge
                variant="outline"
                style={{
                  borderColor: CHANNEL_COLORS[user.channel],
                  color: CHANNEL_COLORS[user.channel],
                }}
              >
                {CHANNEL_LABELS[user.channel]}
              </Badge>
              {user.role !== "user" && (
                <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
              )}
              {user.region && (
                <Badge variant="outline" className="gap-1">
                  <MapPin className="size-3" />
                  {user.region}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </MotionFadeIn>

      {/* Промо-баннер про подбор — только обычным пользователям (не Заказчику/Техспецу) */}
      {!isAdmin && (
        <MotionFadeIn delay={0.08}>
          <Link
            href="/podbor"
            className="mt-6 flex items-center gap-3 rounded-2xl bg-[#2d2d2d] p-4 text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,0.35)] transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-[0_14px_28px_-10px_rgba(0,0,0,0.45)]"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-[0_6px_16px_-6px_rgba(142,29,44,0.6)]">
              <Sparkles className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-snug">
                Заполните анкету о вашей семье
              </p>
              <p className="mt-0.5 text-xs text-white/75">
                Мы подберём меры поддержки именно для вас
              </p>
            </div>
            <ChevronRight className="size-5 shrink-0 text-white/60" />
          </Link>
        </MotionFadeIn>
      )}

      <MotionFadeIn delay={0.15}>
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Мои обращения
            </h2>
            <Link
              href="/profile/inquiries/new"
              className="text-xs font-semibold text-brand hover:underline"
            >
              + Новое
            </Link>
          </div>

          <div className="mt-2 space-y-2">
            {inquiries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center">
                <p className="text-sm font-medium">Пока ничего нет</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Оставьте обращение из карточки меры или по кнопке «Новое»
                  выше
                </p>
              </div>
            ) : (
              inquiries.map((inq) => (
                <Link
                  key={inq.id}
                  href={`/profile/inquiries/${inq.id}`}
                  className="block rounded-2xl bg-white p-3 text-foreground shadow-[0_8px_22px_-10px_rgba(0,0,0,0.18)] ring-1 ring-stone-100 transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-[0_12px_26px_-8px_rgba(0,0,0,0.25)]"
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {inq.status === "new" ? (
                          <Badge
                            variant="outline"
                            className="gap-1 text-amber-600"
                          >
                            <Clock className="size-3" /> ждёт ответа
                          </Badge>
                        ) : (
                          <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                            <CheckCircle2 className="size-3" /> отвечено
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px]">
                          {INQUIRY_TYPE_LABEL[inq.type]}
                        </Badge>
                      </div>
                      <p className="mt-1.5 font-semibold leading-snug">
                        {inq.subject}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {inq.body}
                      </p>
                    </div>
                    <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </MotionFadeIn>

      {isAdmin && (
        <MotionFadeIn delay={0.2}>
          <section className="mt-7">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Управление
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Доступно вам как {ROLE_LABELS[user.role].toLowerCase()}
            </p>
            <div className="mt-3 space-y-2">
              <AdminLink
                href="/admin/inquiries"
                icon={<MessageSquare className="size-5" />}
                title="Обращения"
                hint="Отвечать пользователям"
              />
              <AdminLink
                href="/admin/knowledge"
                icon={<FolderInput className="size-5" />}
                title="База знаний"
                hint="Загружать материалы для AI"
              />
              <AdminLink
                href="/admin"
                icon={<MessageSquare className="size-5" />}
                title="Каталог мер"
                hint="Добавлять и править меры"
              />
              <AdminLink
                href="/admin/verification"
                icon={<CalendarCheck className="size-5" />}
                title="Сверка"
                hint="Проверять меры по графику"
              />
            </div>
          </section>
        </MotionFadeIn>
      )}

      <form action={logoutDemoUser} className="mt-8">
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-muted-foreground hover:bg-stone-50"
        >
          <LogOut className="size-4" /> Выйти
        </button>
      </form>
    </div>
  );
}

// Личный кабинет обычного (email) пользователя.
async function AppUserProfile({ user }: { user: AppUser }) {
  const fullName = `${user.firstName} ${user.lastName}`;
  const initial = {
    telegram: user.telegramId != null,
    vk: user.vkId != null,
    max: user.maxId != null,
  };
  const inquiries = await listInquiriesForUser(user.id);
  const savedCount = (await listSavedSlugs(user.id)).length;
  return (
    <div className="px-4 py-5">
      <div className="flex items-center gap-3">
        <AvatarEditor avatar={resolveUserAvatar(user)} size={64} />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-extrabold leading-tight">
            {fullName}
          </h1>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {user.email}
          </p>
        </div>
      </div>

      {/* Промо-баннер про индивидуальный подбор мер */}
      <Link
        href="/podbor"
        className="mt-6 flex items-center gap-3 rounded-2xl bg-[#2d2d2d] p-4 text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,0.35)] transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-[0_14px_28px_-10px_rgba(0,0,0,0.45)]"
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-[0_6px_16px_-6px_rgba(142,29,44,0.6)]">
          <Sparkles className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug">
            Подберём меры под вашу семью
          </p>
          <p className="mt-0.5 text-xs text-white/75">
            Заполните короткую анкету — покажем, что положено именно вам
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-white/60" />
      </Link>

      {/* Избранное: быстрый вход в сохранённые меры */}
      <Link
        href="/saved"
        className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-3.5 text-foreground shadow-[0_8px_22px_-10px_rgba(0,0,0,0.18)] ring-1 ring-stone-100 transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-[0_12px_26px_-8px_rgba(0,0,0,0.25)]"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#8E1D2C]/10 text-[#8E1D2C]">
          <Heart className="size-5 fill-current" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug">Избранное</p>
          <p className="text-xs text-muted-foreground">
            {savedCount > 0
              ? `Сохранённых мер: ${savedCount}`
              : "Пока ничего не сохранено"}
          </p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Мои обращения
          </h2>
          <Link
            href="/profile/inquiries/new"
            className="text-xs font-semibold text-brand hover:underline"
          >
            + Новое
          </Link>
        </div>

        <div className="mt-2 space-y-2">
          {inquiries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center">
              <p className="text-sm font-medium">Пока нет обращений</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Задайте вопрос или предложите идею — из карточки меры или по
                кнопке «Новое» выше
              </p>
            </div>
          ) : (
            inquiries.map((inq) => (
              <Link
                key={inq.id}
                href={`/profile/inquiries/${inq.id}`}
                className="block rounded-2xl bg-white p-3 text-foreground shadow-[0_8px_22px_-10px_rgba(0,0,0,0.18)] ring-1 ring-stone-100 transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-[0_12px_26px_-8px_rgba(0,0,0,0.25)]"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {inq.status === "new" ? (
                        <Badge variant="outline" className="gap-1 text-amber-600">
                          <Clock className="size-3" /> ждёт ответа
                        </Badge>
                      ) : (
                        <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                          <CheckCircle2 className="size-3" /> отвечено
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px]">
                        {INQUIRY_TYPE_LABEL[inq.type]}
                      </Badge>
                    </div>
                    <p className="mt-1.5 font-semibold leading-snug">
                      {inq.subject}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {inq.body}
                    </p>
                  </div>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Мессенджеры
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Подключите один или несколько — так мы будем присылать подобранные
          меры, ответы и напоминания. Любой можно отключить.
        </p>
        <div className="mt-3">
          <MessengerManager initial={initial} />
        </div>
      </section>

      {isAppAdmin(user) && (
        <section className="mt-7">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Управление
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Доступно вам как {APP_ROLE_LABELS[user.role].toLowerCase()}
          </p>
          <div className="mt-3 space-y-2">
            <AdminLink
              href="/admin/inquiries"
              icon={<MessageSquare className="size-5" />}
              title="Обращения"
              hint="Отвечать пользователям"
            />
            <AdminLink
              href="/admin/knowledge"
              icon={<FolderInput className="size-5" />}
              title="База знаний"
              hint="Загружать материалы для AI"
            />
            <AdminLink
              href="/admin"
              icon={<MessageSquare className="size-5" />}
              title="Каталог мер"
              hint="Добавлять и править меры"
            />
          </div>
        </section>
      )}

      <form action={logout} className="mt-8">
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-muted-foreground hover:bg-stone-50"
        >
          <LogOut className="size-4" /> Выйти
        </button>
      </form>
    </div>
  );
}

function AdminLink({
  href,
  icon,
  title,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl bg-white p-3 text-foreground shadow-[0_8px_22px_-10px_rgba(0,0,0,0.18)] ring-1 ring-stone-100 transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-[0_12px_26px_-8px_rgba(0,0,0,0.25)]"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand text-white shadow-[0_4px_12px_-4px_rgba(142,29,44,0.5)]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug">{title}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
