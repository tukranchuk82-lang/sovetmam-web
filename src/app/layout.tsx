import type { Metadata } from "next";
import { Manrope, PT_Serif, Geist_Mono } from "next/font/google";
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

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// Сериф для крупных заголовков — официальный, «государственный» характер
// (как в референсе «Шпаргалка для родителей»).
const ptSerif = PT_Serif({
  variable: "--font-serif",
  weight: ["400", "700"],
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      className={`${manrope.variable} ${ptSerif.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-dvh bg-slate-300">
        <script dangerouslySetInnerHTML={{ __html: INSTALL_PROMPT_CAPTURE }} />
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
