# Desain — Monege (Design Document)

## 1. Prinsip Desain
- **Modern & minim clutter** — fokus ke angka dan tren, bukan dekorasi berlebihan.
- **Data-forward** — chart dan nominal jadi elemen visual utama tiap halaman.
- **Konsisten** — 1 sistem komponen dipakai di seluruh modul (wallet, transaksi, tabungan, tagihan).
- **Dua tema setara** — tidak ada tema yang jadi "default kelas dua"; keduanya didesain penuh, bukan cuma invert warna.

## 2. Dua Tema

### 2.1 Tema Gelap (Dark)
Latar gelap netral (bukan hitam pekat) supaya tidak terlalu kontras dan nyaman untuk penggunaan malam hari.

| Token | Nilai (HSL) | Kegunaan |
|---|---|---|
| `--bg` | `220 20% 10%` | Latar utama |
| `--surface` | `220 18% 14%` | Card, panel |
| `--surface-hover` | `220 18% 18%` | Hover state card |
| `--border` | `220 14% 22%` | Garis pembatas |
| `--text-primary` | `220 15% 95%` | Teks utama |
| `--text-secondary` | `220 10% 65%` | Teks sekunder/label |
| `--primary` | `160 70% 45%` | Aksen utama (tombol, link) — hijau teal |
| `--income` | `152 60% 48%` | Nominal pemasukan / chart naik |
| `--expense` | `0 65% 58%` | Nominal pengeluaran / chart turun |
| `--warning` | `38 90% 55%` | Reminder / budget mendekati limit |
| `--muted-tag-bg` | `220 16% 20%` | Background badge tag |

### 2.2 Tema Berwarna (Soft Color)
Bukan tema terang putih polos — memakai latar hangat/lembut (off-white kebiruan/kehijauan) dengan saturasi rendah, supaya tetap "berwarna" tapi tidak menyilaukan mata.

| Token | Nilai (HSL) | Kegunaan |
|---|---|---|
| `--bg` | `160 25% 94%` | Latar utama (hijau sangat muda, bukan putih) |
| `--surface` | `160 20% 98%` | Card, panel |
| `--surface-hover` | `160 25% 92%` | Hover state card |
| `--border` | `160 15% 85%` | Garis pembatas |
| `--text-primary` | `220 20% 18%` | Teks utama |
| `--text-secondary` | `220 10% 40%` | Teks sekunder/label |
| `--primary` | `160 55% 38%` | Aksen utama — teal lebih gelap dari dark mode |
| `--income` | `152 50% 40%` | Nominal pemasukan / chart naik |
| `--expense` | `0 55% 50%` | Nominal pengeluaran / chart turun |
| `--warning` | `38 80% 48%` | Reminder / budget mendekati limit |
| `--muted-tag-bg` | `160 20% 90%` | Background badge tag |

> Implementasi: token di atas didefinisikan sebagai CSS variables di `:root[data-theme="dark"]` dan `:root[data-theme="soft-color"]`, diatur lewat `next-themes` atau context sederhana, tersimpan di `User.themePref` (Prisma) + localStorage untuk preload sebelum hydration.

## 3. Tipografi
- Font: **Inter** atau **Plus Jakarta Sans** (geometris, mudah dibaca untuk angka).
- Skala:
  - Nominal besar (dashboard hero): `36px / 700`
  - Judul halaman: `24px / 600`
  - Judul card: `16px / 600`
  - Body: `14px / 400`
  - Caption/label tag: `12px / 500`
- Angka nominal selalu pakai **tabular numbers** (`font-variant-numeric: tabular-nums`) supaya rapi di tabel/chart.

## 4. Komponen UI Kunci
- **Card Ringkasan Wallet** — nama wallet, saldo besar, ikon jenis wallet, mini sparkline tren 7 hari.
- **Badge Tag** — pill kecil dengan `--muted-tag-bg`, warna teks mengikuti tema, ada tombol "+" untuk buat tag baru langsung dari form transaksi.
- **Form Transaksi** — toggle Pemasukan/Pengeluaran (warna berubah ke `--income`/`--expense`), input nominal besar di tengah, dropdown/search tag wajib diisi.
- **Chart Card** — line chart dengan gradient fill tipis di bawah garis, warna sesuai `--income`/`--expense`, toggle rentang waktu (7H/30H/12B) di pojok kanan atas.
- **Progress Tabungan** — progress bar melengkung (radial) menampilkan % target tercapai + teks "Rp X/hari untuk capai target".
- **List Tagihan** — item dengan status dot (belum jatuh tempo/mendekati/lewat), tanggal reminder ditampilkan sebagai chip kecil.
- **Notification Toast/Panel** — ikon berbeda per tipe (BILL_REMINDER, BUDGET_OVER, BUDGET_UNDER), warna `--warning` atau `--expense`.

## 5. Layout & Alur Halaman

### 5.1 Landing Page
- Navbar: logo Monege (kiri), menu Fitur/Kelebihan (tengah), tombol **Login** & **Register** (kanan).
- Hero: headline + subheadline + CTA "Mulai Gratis" → Register.
- Section "Fitur": grid card tiap modul (wallet, tag, tabungan, chart, reminder, budget).
- Section "Kelebihan": 3-4 poin value proposition dengan ikon.
- Footer sederhana.

### 5.2 Dashboard (setelah login)
- Header: total saldo gabungan semua wallet + toggle tema.
- Grid card wallet (horizontal scroll di mobile).
- 2 Chart Card (pemasukan & pengeluaran) berdampingan (stack di mobile).
- Widget ringkas: tagihan terdekat, status budget harian hari ini.

### 5.3 Wallet Detail
- Saldo wallet + tombol Transfer, Tambah Transaksi.
- List transaksi wallet tersebut, infinite scroll.

### 5.4 Form Transaksi (modal/drawer)
- Toggle jenis, input nominal, pilih wallet, pilih/buat tag, catatan, tanggal.

### 5.5 Halaman Tabungan
- List saving goals sebagai card dengan progress radial.
- Detail goal: kalkulasi per hari/minggu/bulan, tombol "Tambah Kontribusi".

### 5.6 Halaman Detailing/Laporan
- Filter bar sticky di atas (tag, wallet, rentang tanggal, jenis).
- Ringkasan total di bawah filter (mis. "Total pengeluaran (tag: makan) = Rp500.000").
- Tabel/list transaksi hasil filter.

### 5.7 Halaman Tagihan
- List tagihan dengan status & tanggal jatuh tempo.
- Form tambah tagihan + multi reminder date.

### 5.8 Halaman Budget Harian
- List aturan budget (pemasukan minimal, pengeluaran per tag, target nabung).
- Indikator status hari ini per aturan: on track / over / under.

### 5.9 Settings
- Toggle tema (Dark / Soft Color).
- Kelola izin push notification.
- Kelola tag (rename/hapus).

## 6. Iconography, Spacing, Radius
- Ikon: **Lucide Icons** (garis tipis, konsisten dengan gaya minimal-modern).
- Spacing scale: kelipatan 4px (4, 8, 12, 16, 24, 32, 48).
- Radius: `12px` untuk card, `8px` untuk input/button, `999px` untuk badge/pill.
- Shadow: sangat halus (`0 1px 3px rgba(0,0,0,0.08)` di Soft Color, `0 1px 3px rgba(0,0,0,0.4)` di Dark) — hindari shadow tebal.

## 7. Responsive Behavior
- Breakpoint utama: mobile (`<640px`), tablet (`640–1024px`), desktop (`>1024px`).
- Navigasi utama: sidebar di desktop, bottom navigation bar di mobile (Dashboard, Transaksi, Tabungan, Laporan, Settings).
- Card wallet & chart bertumpuk vertikal di mobile, grid horizontal di desktop.

## 8. Aksesibilitas
- Kontras warna teks vs background memenuhi WCAG AA di kedua tema (terutama `--text-secondary` di Soft Color, perlu dicek ulang saat implementasi).
- Semua elemen interaktif punya focus state yang terlihat jelas (outline `--primary`).
- Ikon status (over/under/lunas) tidak hanya mengandalkan warna, tapi juga bentuk/label teks untuk pengguna buta warna.
