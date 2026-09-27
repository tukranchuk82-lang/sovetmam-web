import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutGrid,
  MessageSquare,
  FolderInput,
  Share2,
  CalendarCheck,
  Users,
  Gauge,
  Inbox,
  HelpCircle,
  Landmark,
  Heart,
  ShieldCheck,
} from "lucide-react";
import { countNewInquiries } from "@/lib/inquiries-db";
import { countNewBotHelpRequests } from "@/lib/bot-help";
import { countOpenDisputes } from "@/lib/measure-disputes";
import { getCurrentStaff } from "@/lib/user-session";
import { ALLOWED_VIEW_MODES, effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { ROLE_LABELS } from "@/lib/onboarding-db";
import { AdminNavLink } from "@/components/admin/nav-link";
import { ViewModeSwitch } from "@/components/view-mode-switch";
import { OrgName } from "@/components/org-name";

export const metadata = {
  title: "Админ-панель",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Тёмно-синий сайдбар — единственная тёмная поверхность в админке, поэтому
// цвета заданы здесь напрямую, а не через токены темы (см. .admin-shell
// в globals.css — это про светлую рабочую область).
const SIDEBAR_BG = "linear-gradient(180deg, #16233F 0%, #101A30 100%)";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Доступ для владельца, техспеца и координатора. Остальных — на вход (там
  // уже залогиненного, но не-сотрудника, перекинет в личный кабинет).
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin");

  const mode = await getViewMode(staff.role);
  const scope = effectiveAdminScope(staff.role, mode);
  // У владельца/техспеца, пробующих режим координатора «на себе», региона
  // нет — тогда координаторский экран показывает данные по всем регионам
  // разом, а не пустоту.
  const region = scope === "coordinator" ? staff.region : null;

  const newInquiries = await countNewInquiries(scope === "coordinator" ? (region ?? undefined) : undefined);
  // Заявки на кабинет и спорные меры — общая, не региональная очередь.
  const newRequests = scope !== "coordinator" ? await countNewBotHelpRequests() : 0;
  const openDisputes = scope !== "coordinator" ? await countOpenDisputes() : 0;

  const isCoordinatorScope = scope === "coordinator";
  const initials = `${staff.firstName?.[0] ?? ""}${staff.lastName?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div className="admin-shell flex min-h-dvh w-full bg-background text-foreground">
      {/* ── Сайдбар — только широкий экран ─────────────────────────────── */}
      <aside
        className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto px-3.5 py-5 md:flex"
        style={{ background: SIDEBAR_BG }}
      >
        <div className="px-2 pb-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
            Админ-панель
            {isCoordinatorScope && region ? ` · ${region}` : ""}
          </p>
          <Link href="/admin" className="block truncate font-bold leading-tight text-white hover:text-white/85">
            <OrgName />
          </Link>
        </div>

        <nav className="flex flex-col gap-0.5">
          {isCoordinatorScope ? (
            <>
              <AdminNavLink href="/admin" icon={<Gauge />} exact variant="sidebar">
                Сводка
              </AdminNavLink>
              <AdminNavLink href="/admin/inquiries" icon={<MessageSquare />} badge={newInquiries} variant="sidebar">
                Обращения
              </AdminNavLink>
              <AdminNavLink href="/admin/measures" icon={<LayoutGrid />} variant="sidebar">
                Меры региона
              </AdminNavLink>
              <AdminNavLink href="/admin/region-survey" icon={<Users />} variant="sidebar">
                Анкеты региона
              </AdminNavLink>
              <AdminNavLink href="/admin/region-saved" icon={<Heart />} variant="sidebar">
                Избранное региона
              </AdminNavLink>
            </>
          ) : (
            <>
              <AdminNavLink href="/admin" icon={<Gauge />} exact variant="sidebar">
                Сводка
              </AdminNavLink>
              <AdminNavLink href="/admin/measures" icon={<LayoutGrid />} variant="sidebar">
                Каталог мер
              </AdminNavLink>
              <AdminNavLink href="/admin/users" icon={<Users />} variant="sidebar">
                Пользователи
              </AdminNavLink>

              <div className="my-2.5 h-px bg-white/10" />

              <AdminNavLink href="/admin/representatives" icon={<Landmark />} variant="sidebar">
                Координаторы в регионах
              </AdminNavLink>
              <AdminNavLink href="/admin/inquiries" icon={<MessageSquare />} badge={newInquiries} variant="sidebar">
                Обращения
              </AdminNavLink>
              <AdminNavLink href="/admin/requests" icon={<Inbox />} badge={newRequests} variant="sidebar">
                Заявки на кабинет
              </AdminNavLink>
              <AdminNavLink href="/admin/verification" icon={<CalendarCheck />} variant="sidebar">
                Сверка
              </AdminNavLink>
              <AdminNavLink href="/admin/disputes" icon={<HelpCircle />} badge={openDisputes} variant="sidebar">
                Спорные меры
              </AdminNavLink>

              <div className="my-2.5 h-px bg-white/10" />

              <AdminNavLink href="/admin/share" icon={<Share2 />} variant="sidebar">
                Откуда приходят
              </AdminNavLink>
              <AdminNavLink href="/admin/knowledge" icon={<FolderInput />} variant="sidebar">
                База знаний
              </AdminNavLink>
              {/* Управление ролями — технический раздел: аккаунты
                  координаторов, техспецов, передача прав владельца. Видно
                  только в режиме техспеца; владелец доберётся сюда, переключившись. */}
              {scope === "tech" && (
                <AdminNavLink href="/admin/staff" icon={<ShieldCheck />} variant="sidebar">
                  Доступ и роли
                </AdminNavLink>
              )}
            </>
          )}
        </nav>

        <div className="mt-auto flex items-center gap-2.5 border-t border-white/10 px-2 pt-4">
          <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-white/[0.14] text-[11px] font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-semibold text-white">
              {staff.firstName} {staff.lastName}
            </p>
            <p className="text-[11px] text-white/50">{ROLE_LABELS[staff.role]}</p>
          </div>
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        {/* ── Шапка на телефоне: лого, переключатель, ряд-таблетка навигации ── */}
        <header className="sticky top-0 z-10 border-b bg-card/95 px-4 py-3 backdrop-blur md:hidden">
          {/* Заголовок и переключатель — друг под другом, не в один ряд:
              у владельца/техспеца в переключателе теперь 4 кнопки, и рядом
              с названием на узком экране они просто не помещаются —
              наезжали друг на друга. */}
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Админ-панель
              {isCoordinatorScope && region ? ` · ${region}` : ""}
            </p>
            <Link href="/admin" className="block truncate font-bold leading-none hover:text-primary">
              <OrgName />
            </Link>
          </div>
          <ViewModeSwitch
            mode={mode}
            available={ALLOWED_VIEW_MODES[staff.role]}
            className="mt-2.5"
            userTo="/"
          />

          <nav className="mt-3 flex flex-wrap gap-1.5">
            {isCoordinatorScope ? (
              <>
                <AdminNavLink href="/admin" icon={<Gauge className="size-4" />} exact>
                  Сводка
                </AdminNavLink>
                <AdminNavLink href="/admin/inquiries" icon={<MessageSquare className="size-4" />} badge={newInquiries}>
                  Обращения
                </AdminNavLink>
                <AdminNavLink href="/admin/measures" icon={<LayoutGrid className="size-4" />}>
                  Меры региона
                </AdminNavLink>
                <AdminNavLink href="/admin/region-survey" icon={<Users className="size-4" />}>
                  Анкеты региона
                </AdminNavLink>
                <AdminNavLink href="/admin/region-saved" icon={<Heart className="size-4" />}>
                  Избранное региона
                </AdminNavLink>
              </>
            ) : (
              <>
                <AdminNavLink href="/admin" icon={<Gauge className="size-4" />} exact>
                  Сводка
                </AdminNavLink>
                <AdminNavLink href="/admin/measures" icon={<LayoutGrid className="size-4" />}>
                  Каталог мер
                </AdminNavLink>
                <AdminNavLink href="/admin/users" icon={<Users className="size-4" />}>
                  Пользователи
                </AdminNavLink>
                <AdminNavLink href="/admin/representatives" icon={<Landmark className="size-4" />}>
                  Координаторы в регионах
                </AdminNavLink>
                <AdminNavLink href="/admin/inquiries" icon={<MessageSquare className="size-4" />} badge={newInquiries}>
                  Обращения
                </AdminNavLink>
                <AdminNavLink href="/admin/requests" icon={<Inbox className="size-4" />} badge={newRequests}>
                  Заявки на кабинет
                </AdminNavLink>
                <AdminNavLink href="/admin/verification" icon={<CalendarCheck className="size-4" />}>
                  Сверка
                </AdminNavLink>
                <AdminNavLink href="/admin/disputes" icon={<HelpCircle className="size-4" />} badge={openDisputes}>
                  Спорные меры
                </AdminNavLink>
                <AdminNavLink href="/admin/share" icon={<Share2 className="size-4" />}>
                  Откуда приходят
                </AdminNavLink>
                <AdminNavLink href="/admin/knowledge" icon={<FolderInput className="size-4" />}>
                  База знаний
                </AdminNavLink>
                {scope === "tech" && (
                  <AdminNavLink href="/admin/staff" icon={<ShieldCheck className="size-4" />}>
                    Доступ и роли
                  </AdminNavLink>
                )}
              </>
            )}
          </nav>
        </header>

        {/* ── Тонкая шапка на широком экране: только переключатель режима —
            название уже в сайдбаре, заголовок раздела рисует сама страница ── */}
        <div className="sticky top-0 z-10 hidden items-center justify-end border-b bg-card/70 px-6 py-2.5 backdrop-blur md:flex">
          <ViewModeSwitch mode={mode} available={ALLOWED_VIEW_MODES[staff.role]} userTo="/" />
        </div>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
