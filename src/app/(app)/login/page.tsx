import Link from "next/link";
import { getCurrentDemoUser } from "@/lib/demo-auth";
import { LoginForm } from "@/components/login-form";
import { redirect } from "next/navigation";

export const metadata = { title: "Вход" };

export default async function LoginPage() {
  const user = await getCurrentDemoUser();
  if (user) redirect("/profile");

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-8">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-inset ring-white/30 backdrop-blur-md">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-8"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>
      <h1 className="mt-5 text-center text-2xl font-extrabold leading-tight">
        Совет&nbsp;матерей
      </h1>
      <p className="mt-1.5 max-w-[260px] text-center text-sm text-white/85">
        Войдите через удобный мессенджер, чтобы пользоваться подбором и
        обращениями
      </p>

      <LoginForm />

      <Link
        href="/"
        className="mt-6 text-sm text-white/80 hover:text-white"
      >
        ← Без входа, посмотреть каталог
      </Link>
    </div>
  );
}
