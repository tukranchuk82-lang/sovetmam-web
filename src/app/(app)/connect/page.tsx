import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getCurrentAppUser } from "@/lib/user-session";
import { ConnectMessenger } from "@/components/connect-messenger";

export const metadata = { title: "Подключение мессенджера" };
export const dynamic = "force-dynamic";

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentAppUser();
  if (!user) redirect("/login");
  const { next } = await searchParams;
  const nextUrl = next && next.startsWith("/") ? next : "/";

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-[#1B3A6B] text-white shadow-[0_10px_24px_-8px_rgba(27,58,107,0.55)]">
        <MessageCircle className="size-8" />
      </div>
      <h1
        className="mt-5 text-[26px] font-normal leading-tight text-[#1A1A1A]"
        style={{ fontFamily: "var(--font-playfair), serif" }}
      >
        Последний шаг
      </h1>
      <p className="mt-2 max-w-[300px] text-sm text-[#6b7078]">
        Подключите мессенджер — так мы сможем присылать вам подобранные меры,
        ответы и напоминания. Выберите удобный:
      </p>

      <div className="mt-6 w-full max-w-[340px]">
        <ConnectMessenger next={nextUrl} />
      </div>
    </div>
  );
}
