import type { Metadata } from "next";
import {
  Manrope,
  PT_Serif,
  JetBrains_Mono,
  Nunito,
  Geist_Mono,
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

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Раннее применение выбранной темы (до отрисовки) — чтобы не было мигания.
const THEME_INIT = `(function(){try{var q=new URLSearchParams(location.search).get('theme');var t=q||localStorage.getItem('sm-theme');if(t){document.documentElement.setAttribute('data-theme',t);if(q)localStorage.setItem('sm-theme',q);}}catch(e){}})();`;

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
    title: "Совет матерей",
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
      className={`${manrope.variable} ${ptSerif.variable} ${jetBrainsMono.variable} ${nunito.variable} ${geistMono.variable} antialiased`}
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
