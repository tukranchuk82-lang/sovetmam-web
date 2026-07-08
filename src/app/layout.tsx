import type { Metadata } from "next";
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
  title: {
    default: "Шпаргалка для родителей — меры поддержки семей с детьми",
    template: "%s — Шпаргалка для родителей",
  },
  description:
    "Шпаргалка для родителей от «Совета матерей»: все меры поддержки семей с детьми — федеральные, региональные, муниципальные, от работодателя и вузов. Пройдите анкету и узнайте, что положено именно вам.",
  // iOS игнорирует manifest.json и берёт apple-touch-icon, причём прозрачность
  // в нём не поддерживает — подставляет под неё чёрный фон. Поэтому
  // apple-touch-icon.png нарисован на непрозрачной белой подложке.
  // Маскируемые иконки для Android — в manifest.json (purpose: maskable).
  // Было "/logo.png" — такого файла в public/ нет, ссылка вела в 404.
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Шпаргалка",
  },
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
