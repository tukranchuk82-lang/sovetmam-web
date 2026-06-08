import type { Metadata } from "next";
import { Manrope, Geist_Mono } from "next/font/google";
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

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Совет матерей — меры поддержки семей с детьми",
    template: "%s — Совет матерей",
  },
  description:
    "Каталог федеральных и региональных мер государственной поддержки для семей с детьми и будущих родителей. Пройдите анкету и узнайте, что положено именно вам.",
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
      className={`${manrope.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-dvh bg-stone-200">
        <script dangerouslySetInnerHTML={{ __html: INSTALL_PROMPT_CAPTURE }} />
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
