# PRD — Monege (Product Requirements Document)

## 1. Ringkasan Produk
**Monege** adalah platform manajemen keuangan pribadi berbasis web yang membantu pengguna mencatat pemasukan, pengeluaran, utang/piutang, tabungan bertarget, tagihan berkala, dan budget harian dalam satu tempat — lengkap dengan visualisasi tren dan pengingat otomatis lewat push notification.

## 2. Latar Belakang & Tujuan
Banyak orang kesulitan mengontrol arus kas harian karena pencatatan tersebar (dompet fisik, e-wallet, catatan manual) dan tidak ada pengingat proaktif saat pengeluaran melebihi batas atau tagihan mendekati jatuh tempo.

**Tujuan produk:**
- Menyatukan pencatatan multi-dompet dalam satu dashboard.
- Memberi visibilitas real-time terhadap tren pemasukan vs pengeluaran.
- Membantu pengguna disiplin menabung dengan kalkulasi target otomatis.
- Mengingatkan pengguna secara proaktif (push notification) terkait tagihan dan budget harian.

## 3. Target Pengguna
- Individu yang ingin mengelola keuangan pribadi secara disiplin.
- Pengguna dengan banyak sumber dana (dompet, rekening, e-wallet) yang perlu dipisah tapi tetap terpantau.
- Pengguna yang punya utang/piutang dengan orang lain dan ingin melacaknya bersama arus kas utama.

## 4. Value Proposition (untuk Landing Page)
- **Multi-wallet dalam satu dashboard** — tidak perlu app terpisah per dompet.
- **Tag transaksi fleksibel** — kategorisasi sesuai kebutuhan sendiri.
- **Kalkulasi tabungan otomatis** — cukup set target, sistem hitung kebutuhan harian/mingguan/bulanan.
- **Pengingat proaktif** — push notification untuk tagihan & budget harian yang over/under.
- **Visualisasi tren** — pantau naik-turun keuangan seperti chart trading.
- **Dua tema visual** — Dark Mode & Soft Color Mode, nyaman di mata siang maupun malam.

## 5. Ruang Lingkup Fitur

### 5.1 Landing Page & Autentikasi
- Landing page publik: hero section, daftar fitur, kelebihan produk, CTA.
- Navbar: tombol **Login** & **Register**.
- **User story:** Sebagai calon pengguna, saya ingin memahami fitur Monege dari landing page sebelum mendaftar, supaya saya yakin sebelum membuat akun.
- **Acceptance criteria:**
  - Landing page dapat diakses tanpa login.
  - Navbar menampilkan Login/Register saat belum login, dan menu akun saat sudah login.

### 5.2 Manajemen Wallet
- CRUD wallet (nama, saldo awal, ikon/warna opsional).
- Wallet default **"Dompet"** otomatis dibuat saat user register.
- Transfer saldo antar wallet.
- **User story:** Sebagai pengguna, saya ingin membuat beberapa wallet, supaya saya bisa memisahkan dana sesuai tujuan (mis. Dompet, Tabungan, Rekening Bank).
- **Acceptance criteria:**
  - User tidak bisa menghapus wallet yang masih punya saldo/riwayat transaksi tanpa konfirmasi.
  - Transfer antar wallet tercatat sebagai transaksi keluar-masuk di kedua wallet.

### 5.3 Transaksi Pemasukan & Pengeluaran
- CRUD transaksi pemasukan/pengeluaran, terikat ke satu wallet.
- **Tag wajib diisi** saat input transaksi.
- Tag bisa dibuat baru oleh user (custom tag generator), contoh: "gaji", "makan", "transport".
- **User story:** Sebagai pengguna, saya ingin mencatat transaksi dengan tag, supaya saya bisa mengelompokkan pengeluaran sesuai kategori saya sendiri.
- **Acceptance criteria:**
  - Transaksi tanpa tag tidak bisa disimpan (validasi wajib).
  - Tag bersifat per-user (bukan global), bisa dipakai ulang di transaksi lain.

### 5.4 Utang & Piutang
- Catat **utang** (saya berutang ke orang lain) dan **piutang** (orang lain berutang ke saya).
- Pembayaran/pelunasan ditarik langsung dari saldo wallet yang dipilih.
- Status: belum lunas, lunas sebagian, lunas.
- **User story:** Sebagai pengguna, saya ingin mencatat utang dan piutang, supaya saya tahu siapa berutang ke saya dan saya berutang ke siapa, lengkap dengan histori pembayarannya.
- **Acceptance criteria:**
  - Pembayaran utang mengurangi saldo wallet terkait dan tercatat sebagai transaksi pengeluaran bertag "Bayar Utang".
  - Penerimaan piutang menambah saldo wallet dan tercatat sebagai pemasukan bertag "Terima Piutang".

### 5.5 Tabungan Bertarget
- Buat target tabungan: nominal target + tanggal target.
- Sistem otomatis menghitung kebutuhan menabung per hari/minggu/bulan.
- Kontribusi tabungan mengurangi saldo wallet sumber, masuk ke "pos" tabungan.
- **User story:** Sebagai pengguna, saya ingin membuat target tabungan dengan nominal dan waktu tertentu, supaya sistem bisa memberi tahu saya berapa yang harus saya sisihkan secara berkala.
- **Acceptance criteria:**
  - Kalkulasi otomatis update setiap kali user menambah kontribusi (sisa target dan sisa waktu direkalkulasi).
  - Progress tabungan ditampilkan dalam persentase dan nominal.

### 5.6 Visualisasi/Chart
- 2 chart tren (line chart): pemasukan dan pengeluaran, per hari/minggu/bulan.
- **User story:** Sebagai pengguna, saya ingin melihat grafik naik-turun pemasukan dan pengeluaran saya, supaya saya bisa mengenali pola keuangan saya dengan cepat.
- **Acceptance criteria:**
  - User bisa mengganti rentang waktu (7 hari, 30 hari, 12 bulan).
  - Chart menampilkan titik data dengan tooltip nominal & tanggal.

### 5.7 Detailing & Laporan
- Pencarian & filter transaksi (default: semua tag).
- Filter berdasarkan tag, wallet, rentang tanggal, jenis (pemasukan/pengeluaran).
- Menampilkan total nominal sesuai filter aktif (mis. "Total pengeluaran (tag: makan) = Rp500.000").
- **User story:** Sebagai pengguna, saya ingin mencari dan memfilter transaksi berdasarkan tag, supaya saya tahu berapa total yang saya keluarkan/dapatkan per kategori.
- **Acceptance criteria:**
  - Total nominal otomatis update setiap filter berubah.
  - Filter default menampilkan total keseluruhan (tanpa filter tag).

### 5.8 Tagihan & Reminder
- Buat tagihan dengan tanggal jatuh tempo (mis. bayar listrik tgl 30).
- User bisa mengatur tanggal reminder custom (mis. diingatkan tgl 25 & 30).
- **User story:** Sebagai pengguna, saya ingin membuat tagihan dengan pengingat custom, supaya saya tidak lupa membayar sebelum jatuh tempo.
- **Acceptance criteria:**
  - Satu tagihan bisa punya lebih dari satu tanggal reminder.
  - Tagihan berstatus lunas otomatis menonaktifkan reminder yang tersisa.

### 5.9 Budget Harian Default
- User set target harian: minimal pemasukan, maksimal pengeluaran per tag, target nabung.
- Contoh: pemasukan harus ≥ Rp50.000/hari, pengeluaran tag "makan" ≤ Rp5.000/hari, nabung ≥ Rp45.000/hari.
- Budget bisa diedit kapan saja (tidak fixed selamanya).
- **User story:** Sebagai pengguna, saya ingin menetapkan target harian, supaya saya diingatkan ketika realisasi hari itu over/under dari target.
- **Acceptance criteria:**
  - Sistem membandingkan realisasi harian vs target setiap akhir hari (atau real-time).
  - Status ditampilkan per kategori: tercapai / over / under.

### 5.10 Notifikasi Push
- Push notification (browser/mobile web push) untuk:
  - Reminder tagihan (poin 5.8).
  - Peringatan budget harian over/under (poin 5.9).
- **User story:** Sebagai pengguna, saya ingin menerima push notification ketika tagihan mendekati jatuh tempo atau budget harian tidak terpenuhi, supaya saya bisa segera bertindak.
- **Acceptance criteria:**
  - User harus memberi izin notifikasi browser terlebih dahulu.
  - Notifikasi bisa dimatikan/diatur ulang lewat halaman Settings.

### 5.11 Preferensi Tema
- Dua tema visual: **Dark** dan **Soft Color** (tidak terlalu terang).
- Tersimpan sebagai preferensi per user.
- **User story:** Sebagai pengguna, saya ingin memilih tema tampilan, supaya aplikasi nyaman digunakan sesuai kondisi pencahayaan.

## 6. Kebutuhan Non-Fungsional
- **Responsif**: layak dipakai di desktop maupun mobile browser (web responsive, bukan native app).
- **Keamanan**: password hashing, proteksi endpoint per-user (tidak bisa akses data user lain).
- **Performa**: dashboard utama termasuk chart harus load < 2 detik pada kondisi data wajar.
- **Reliabilitas notifikasi**: reminder terjadwal harus konsisten dicek (via scheduler), tidak boleh terlewat.

## 7. Di Luar Cakupan (v1)
- Multi-currency.
- Multi-user share wallet (keluarga/tim) — dipertimbangkan untuk v2.
- Native mobile app (iOS/Android).
- Integrasi langsung ke rekening bank/e-wallet (open banking).

## 8. Metrik Keberhasilan
- % pengguna aktif yang membuat minimal 1 wallet tambahan selain default.
- % pengguna yang mengaktifkan push notification.
- Rata-rata jumlah transaksi tercatat per user per minggu.
- % tagihan yang dibayar sebelum jatuh tempo setelah reminder aktif.
