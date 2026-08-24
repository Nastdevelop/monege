import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-4xl font-bold text-accent">404</p>
      <h2 className="text-lg font-semibold">Halaman tidak ditemukan</h2>
      <p className="max-w-sm text-sm text-secondary">
        Halaman yang kamu cari tidak ada atau sudah dipindahkan.
      </p>
      <Link
        href="/dashboard"
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
      >
        Ke Dashboard
      </Link>
    </div>
  );
}
