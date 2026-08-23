import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

export async function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={36} />
            <span className="text-xl font-bold tracking-tight">Monege</span>
          </Link>
          <h1 className="mt-3 text-xl font-semibold">{title}</h1>
          <p className="text-center text-sm text-secondary">{subtitle}</p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-6">
          {children}
        </div>

        <div className="mt-6 flex justify-center">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
