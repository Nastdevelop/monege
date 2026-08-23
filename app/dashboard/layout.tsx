import type { ReactNode } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarNav, BottomNav } from "@/components/app-nav";
import { Providers } from "@/components/providers";
import { NotificationsBell } from "@/components/notifications-bell";
import { Logo } from "@/components/logo";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
        <Link href="/" className="mb-8 flex items-center gap-2 px-2">
          <Logo size={32} />
          <span className="text-lg font-bold tracking-tight">Monege</span>
        </Link>

        <SidebarNav />

        <div className="mt-auto flex items-center gap-3 border-t border-line pt-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted-tag text-sm font-semibold text-accent">
            {(user?.name ?? "?").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-secondary">{user?.email}</p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-background/80 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <Logo size={28} />
            <span className="font-bold tracking-tight">Monege</span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-6 lg:px-8 lg:pb-10">
          <Providers>{children}</Providers>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="post">
      <button
        type="submit"
        aria-label="Keluar"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-secondary transition-colors hover:bg-surface-hover hover:text-expense"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </form>
  );
}
