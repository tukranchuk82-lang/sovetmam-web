import type { Metadata, Viewport } from "next";
import {
  Manrope,
  PT_Serif,
  JetBrains_Mono,
  Nunito,
  Caveat,
  Marck_Script,
  Geist_Mono,
  Playfair_Display,
  Inter,
} from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";

// Ранний перехват события установки. Chrome выбрасывает beforeinstallprompt
// очень рано — иногда до того, как React-компоненты успеют повесить слушатель.
// Этот скрипт исполняется при разборе HTML (до гидрации) и сохраняет событие,
// чтобы кнопка «Установить приложение» затем им воспользовалась.
const INSTALL_PROMPT_CAPTURE = `(function(){
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    window.__deferredInstallPrompt = e;
    window.dispatchEvent(new Event('pwa-installable'));
  });
  window.addEventListener('appinstalled', function(){
    window.__deferredInstallPrompt = null;
  });
})();`;

// Шрифты тем. Базовые имена переменных не используются напрямую в утилитах —
// тема выбирает шрифт через --app-font-body / --app-font-head (см. globals.css).
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// Сериф для классической темы (официальный, «государственный» характер).
const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  weight: ["400", "700"],
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// Моноширинный — для неоновой/брутализм-темы.
const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jb",
  weight: ["400", "700", "800"],
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// Округлый дружелюбный — для тёплой пастельной темы.
const nunito = Nunito({
  variable: "--font-nunito",
  weight: ["400", "700", "800"],
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// Рукописный «карандашный» — для детской темы «Карандаш» (заголовки).
const caveat = Caveat({
  variable: "--font-caveat",
  weight: ["400", "700"],
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// Изящный размашистый каллиграфический — для подписи автора (с кириллицей).
const marckScript = Marck_Script({
  variable: "--font-marck",
  weight: ["400"],
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Элегантный сериф для заголовка-героя главной (по референсу).
const playfair = Playfair_Display({
  variable: "--font-playfair",
  weight: ["400", "500", "600"],
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// Inter — основной текст экранов по референсу.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  // Базовый адрес: от него Next достраивает все относительные ссылки в
  // мета-тегах — картинку карточки, канонические адреса страниц. Без него
  // поисковик получал бы «/og.png» без домена и не смог бы её загрузить.
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Шпаргалка для родителей — меры поддержки семей с детьми",
    template: "%s — Шпаргалка для родителей",
  },
  description:
    "Шпаргалка для родителей от «Совета матерей»: все меры поддержки семей с детьми — федеральные, региональные, муниципальные, от работодателя и вузов. Пройдите анкету и узнайте, что положено именно вам.",
  applicationName: "Шпаргалка для родителей",
  authors: [{ name: "Совет матерей" }],
  creator: "Совет матерей",
  publisher: "Совет матерей",
  // Канонический адрес страницы. Нужен, чтобы поисковик не считал разными
  // страницами один и тот же адрес с рекламной меткой на хвосте: ссылки из
  // рассылок и кнопки «Поделиться» приходят с ?utm=…, а страница-то одна.
  alternates: { canonical: "/" },
  // Разрешаем показывать в выдаче большие картинки и длинные описания —
  // без этого Google обрезает и то, и другое до минимума.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Карточка, которую видят в мессенджерах и соцсетях при пересылке ссылки.
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
    url: "/",
    title: "Шпаргалка для родителей — меры поддержки семей с детьми",
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Шпаргалка для родителей — меры поддержки семей с детьми",
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  // Подтверждение прав на сайт в Яндекс.Вебмастере и Google Search Console.
  // Коды выдают панели вебмастера; пока переменных нет — тегов просто не будет.
  verification: {
    yandex: process.env.YANDEX_VERIFICATION,
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  // Телефоны и адреса в текстах мер Safari иначе сам превращает в ссылки —
  // и ломает вёрстку карточек.
  formatDetection: { telephone: false, address: false },
  // iOS игнорирует manifest.json и берёт apple-touch-icon, причём прозрачность
  // в нём не поддерживает — подставляет под неё чёрный фон. Поэтому
  // apple-touch-icon.png нарисован на непрозрачной белой подложке.
  // Маскируемые иконки для Android — в manifest.json (purpose: maskable).
  // Было "/logo.png" — такого файла в public/ нет, ссылка вела в 404.
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    // iOS не умеет display: "fullscreen" из манифеста — статус-бар там скрыть
    // нельзя. Максимум, что доступно: "black-translucent" — контент уходит ПОД
    // статус-бар, и часы с батареей ложатся прямо на нашу синюю шапку, а не на
    // отдельную белую полосу. Отступ под них даёт env(safe-area-inset-top)
    // в шапке (см. app-shell.tsx).
    statusBarStyle: "black-translucent",
    title: "Шпаргалка",
  },
};

// Приложение установлено как fullscreen (manifest.json): системные полосы
// Android скрыты, окно занимает весь экран — включая область выреза камеры.
// viewportFit: "cover" включает env(safe-area-inset-*), которыми шапка и нижнее
// меню отступают от выреза и от зоны системного жеста.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Полосу за пределами нашего холста (область спрятанного статус-бара, вырез
  // камеры) система закрашивает этим цветом. Без него она была чёрной и резала
  // глаз над синей шапкой. Цвет — из градиента шапки, чтобы полоса слилась с
  // ней. Раньше theme_color убрали вовсе, потому что он был красным и давал
  // ту самую красную полосу сверху.
  themeColor: "#22457B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      data-theme="city"
      className={`${manrope.variable} ${ptSerif.variable} ${jetBrainsMono.variable} ${nunito.variable} ${caveat.variable} ${marckScript.variable} ${geistMono.variable} ${playfair.variable} ${inter.variable} antialiased`}
    >
      <body className="min-h-dvh bg-slate-300">
        <script dangerouslySetInnerHTML={{ __html: INSTALL_PROMPT_CAPTURE }} />
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
