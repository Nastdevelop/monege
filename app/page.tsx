import Link from "next/link";
import {
  Wallet,
  Tags,
  Coins,
  PiggyBank,
  TrendingUp,
  CalendarClock,
  BellRing,
  Calculator,
  Palette,
  ShieldCheck,
} from "lucide-react";
import { Navbar } from "@/components/navbar";

const features = [
  {
    icon: Wallet,
    title: "Multi-Wallet",
    desc: "Pisahkan dana per dompet, rekening, atau e-wallet. Transfer antar wallet dengan sekali klik.",
  },
  {
    icon: Tags,
    title: "Tag Transaksi",
    desc: "Kategorisasi sesuai kebutuhanmu. Buat tag sendiri langsung dari form transaksi.",
  },
  {
    icon: Coins,
    title: "Utang & Piutang",
    desc: "Tahu siapa berutang ke kamu dan kamu berutang ke siapa, lengkap dengan histori pembayaran.",
  },
  {
    icon: PiggyBank,
    title: "Tabungan Bertarget",
    desc: "Set target dan tenggat — sistem hitung otomatis berapa yang harus kamu sisihkan tiap hari.",
  },
  {
    icon: TrendingUp,
    title: "Grafik Tren",
    desc: "Pantau naik-turun pemasukan dan pengeluaran seperti membaca chart trading.",
  },
  {
    icon: CalendarClock,
    title: "Tagihan & Reminder",
    desc: "Jangan sampai telat bayar. Atur pengingat custom untuk setiap tagihan berkala.",
  },
];

const advantages = [
  {
    icon: BellRing,
    title: "Pengingat Proaktif",
    desc: "Push notification saat budget harian melebihi batas atau tagihan mendekati jatuh tempo.",
  },
  {
    icon: Calculator,
    title: "Kalkulasi Otomatis",
    desc: "Kebutuhan menabung harian, mingguan, dan bulanan dihitung ulang setiap ada perubahan.",
  },
  {
    icon: Palette,
    title: "Dua Tema Nyaman",
    desc: "Dark Mode untuk malam hari, Soft Color untuk siang hari — keduanya didesain penuh.",
  },
  {
    icon: ShieldCheck,
    title: "Data Milikmu",
    desc: "Setiap data terikat ke akunmu dan terlindungi autentikasi per-user.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
          <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-secondary">
            Manajemen keuangan pribadi, satu tempat
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Kelola arus kas tanpa pencatatan{" "}
            <span className="text-accent">tercecer</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-secondary sm:text-lg">
            Pemasukan, pengeluaran, utang/piutang, tabungan bertarget, tagihan,
            dan budget harian — semuanya menyatu dalam satu dashboard dengan
            visualisasi tren dan pengingat otomatis.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/register"
              className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Mulai Gratis
            </Link>
            <a
              href="#fitur"
              className="rounded-lg border border-line bg-surface px-6 py-3 text-sm font-semibold transition-colors hover:bg-surface-hover"
            >
              Lihat Fitur
            </a>
          </div>
        </section>

        <section id="fitur" className="border-t border-line bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              Semua yang kamu butuhkan untuk disiplin finansial
            </h2>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-line bg-surface p-6 transition-colors hover:bg-surface-hover"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted-tag text-accent">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-secondary">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="kelebihan" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              Kenapa Monege beda
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {advantages.map((a) => (
                <div key={a.title} className="text-center sm:text-left">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <a.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{a.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-secondary">
                    {a.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-surface/40">
          <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center sm:px-6">
            <h2 className="max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">
              Mulai kelola keuanganmu hari ini
            </h2>
            <p className="mt-4 max-w-md text-secondary">
              Gratis, cukup email dan password. Wallet pertamamu sudah kami
              siapkan otomatis.
            </p>
            <Link
              href="/register"
              className="mt-8 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Mulai Gratis
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-sm text-secondary sm:px-6">
          <span>© 2026 Monege</span>
          <span>Dibuat untuk hidup lebih teratur</span>
        </div>
      </footer>
    </div>
  );
}
