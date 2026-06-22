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

// Раннее применение выбранной темы (до отрисовки) — чтобы не было мигания.
const THEME_INIT = `(function(){try{var q=new URLSearchParams(location.search).get('theme');var t=q||localStorage.getItem('sm-theme')||'city';document.documentElement.setAttribute('data-theme',t);if(q)localStorage.setItem('sm-theme',q);}catch(e){document.documentElement.setAttribute('data-theme','city');}})();`;

export const metadata: Metadata = {
  title: {
    default: "Шпаргалка для родителей — меры поддержки семей с детьми",
    template: "%s — Шпаргалка для родителей",
  },
  description:
    "Шпаргалка для родителей от «Совета матерей»: все меры поддержки семей с детьми — федеральные, региональные, муниципальные, от работодателя и вузов. Пройдите анкету и узнайте, что положено именно вам.",
  icons: { icon: "/logo.png", apple: "/icon-192.png" },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "«Совет матерей»",
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
      suppressHydrationWarning
      className={`${manrope.variable} ${ptSerif.variable} ${jetBrainsMono.variable} ${nunito.variable} ${caveat.variable} ${marckScript.variable} ${geistMono.variable} ${playfair.variable} ${inter.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="min-h-dvh bg-slate-300">
        <script dangerouslySetInnerHTML={{ __html: INSTALL_PROMPT_CAPTURE }} />
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
