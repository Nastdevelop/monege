import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

export async function Navbar() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={32} />
          <span className="text-lg font-bold tracking-tight">Monege</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          <a href="#fitur" className="text-secondary transition-colors hover:text-primary">
            Fitur
          </a>
          <a href="#kelebihan" className="text-secondary transition-colors hover:text-primary">
            Kelebihan
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Buka Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-secondary transition-colors hover:text-primary"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
