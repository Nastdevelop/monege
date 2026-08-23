# TRD — Monege (Technical Requirements Document)

## 1. Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Styling | Tailwind CSS + CSS Variables (untuk 2 tema) |
| Auth | Auth.js (NextAuth) — Credentials Provider (email + password) |
| Charting | Recharts |
| Push Notification | Web Push API (VAPID) via package `web-push` + Service Worker |
| Scheduler | Vercel Cron Jobs / node-cron (untuk cek reminder & budget harian) |
| State/Data Fetching | Server Actions + React Query (client cache) |
| Deployment | Vercel (app) + Neon/Supabase/self-hosted (PostgreSQL) |

## 2. Arsitektur Sistem (High Level)

```
[Browser: Next.js Client + Service Worker]
        |  (HTTPS)
[Next.js Server: App Router + Server Actions/API Routes]
        |
   [Auth.js] --- session/JWT
        |
   [Prisma ORM]
        |
   [PostgreSQL]

[Cron Job (Vercel Cron)] --> hit endpoint /api/cron/check-reminders
        --> query Bill & DailyBudget yang jatuh tempo hari ini
        --> generate Notification record
        --> kirim Web Push via `web-push` ke subscription user
```

## 3. Skema Database (Prisma)

```prisma
// schema.prisma

model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  passwordHash  String
  themePref     Theme    @default(DARK)
  createdAt     DateTime @default(now())

  wallets       Wallet[]
  tags          Tag[]
  debts         Debt[]
  savingGoals   SavingGoal[]
  bills         Bill[]
  dailyBudgets  DailyBudget[]
  notifications Notification[]
  pushSubs      PushSubscription[]
}

enum Theme {
  DARK
  SOFT_COLOR
}

model Wallet {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  name        String
  balance     Decimal  @default(0)
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())

  transactions Transaction[]
  debts        Debt[]
  savingGoals  SavingGoal[]
}

model Tag {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  name      String
  createdAt DateTime @default(now())

  transactions Transaction[]

  @@unique([userId, name])
}

enum TransactionType {
  INCOME
  EXPENSE
  TRANSFER
}

model Transaction {
  id          String          @id @default(cuid())
  walletId    String
  wallet      Wallet          @relation(fields: [walletId], references: [id])
  tagId       String
  tag         Tag             @relation(fields: [tagId], references: [id])
  type        TransactionType
  amount      Decimal
  note        String?
  date        DateTime        @default(now())
  createdAt   DateTime        @default(now())
}

enum DebtDirection {
  I_OWE      // utang saya ke orang lain
  OWED_TO_ME // piutang orang lain ke saya
}

enum DebtStatus {
  UNPAID
  PARTIAL
  PAID
}

model Debt {
  id          String        @id @default(cuid())
  userId      String
  user        User          @relation(fields: [userId], references: [id])
  walletId    String
  wallet      Wallet        @relation(fields: [walletId], references: [id])
  personName  String
  direction   DebtDirection
  amount      Decimal
  paidAmount  Decimal       @default(0)
  status      DebtStatus    @default(UNPAID)
  dueDate     DateTime?
  createdAt   DateTime      @default(now())

  payments DebtPayment[]
}

model DebtPayment {
  id        String   @id @default(cuid())
  debtId    String
  debt      Debt     @relation(fields: [debtId], references: [id])
  amount    Decimal
  paidAt    DateTime @default(now())
}

model SavingGoal {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  walletId      String
  wallet        Wallet   @relation(fields: [walletId], references: [id])
  title         String
  targetAmount  Decimal
  targetDate    DateTime
  currentAmount Decimal  @default(0)
  createdAt     DateTime @default(now())

  contributions SavingContribution[]
}

model SavingContribution {
  id            String     @id @default(cuid())
  savingGoalId  String
  savingGoal    SavingGoal @relation(fields: [savingGoalId], references: [id])
  amount        Decimal
  contributedAt DateTime   @default(now())
}

model Bill {
  id         String         @id @default(cuid())
  userId     String
  user       User           @relation(fields: [userId], references: [id])
  title      String
  amount     Decimal
  dueDate    DateTime
  isPaid     Boolean        @default(false)
  createdAt  DateTime       @default(now())

  reminders  BillReminder[]
}

model BillReminder {
  id           String   @id @default(cuid())
  billId       String
  bill         Bill     @relation(fields: [billId], references: [id])
  remindAt     DateTime
  isSent       Boolean  @default(false)
}

model DailyBudget {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  tagName      String?  // null = aturan pemasukan/nabung umum, diisi = per tag pengeluaran
  type         TransactionType // INCOME (min target) / EXPENSE (max limit)
  targetAmount Decimal
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
}

enum NotificationType {
  BILL_REMINDER
  BUDGET_OVER
  BUDGET_UNDER
}

model Notification {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id])
  type      NotificationType
  title     String
  message   String
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())
}

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())
}
```

## 4. Modul API / Server Actions

| Modul | Endpoint/Action | Deskripsi |
|---|---|---|
| Auth | `POST /api/auth/register`, `[...nextauth]` | Register & login |
| Wallet | `walletActions.ts` (create, update, delete, transfer) | CRUD + transfer |
| Transaction | `transactionActions.ts` (create, update, delete, list+filter) | CRUD + filter by tag/wallet/date |
| Tag | `tagActions.ts` (create, list) | Tag per-user |
| Debt | `debtActions.ts` (create, pay, list) | Utang/piutang + pembayaran |
| Saving | `savingActions.ts` (create, contribute, calcSchedule) | Target tabungan + kalkulasi |
| Bill | `billActions.ts` (create, markPaid, setReminders) | Tagihan + reminder |
| Budget | `budgetActions.ts` (create, update, getStatusToday) | Budget harian + status realisasi |
| Chart | `GET /api/chart/trend?range=` | Data agregat untuk line chart |
| Notification | `GET /api/notifications`, push subscribe endpoint | List & subscribe push |
| Cron | `GET /api/cron/check-reminders` (dilindungi secret) | Dipanggil scheduler harian |

## 5. Autentikasi & Otorisasi
- Auth.js dengan Credentials Provider, password di-hash pakai `bcrypt`.
- Semua Server Action/API route memvalidasi `session.user.id` dan memastikan resource yang diakses milik user tersebut (row-level check via Prisma `where: { userId }`).
- Middleware Next.js untuk redirect ke `/login` jika mengakses route ter-protect (`/dashboard/**`) tanpa sesi aktif.

## 6. Notifikasi Push — Alur Teknis
1. Saat user mengizinkan notifikasi di browser, client mendaftar Service Worker (`/public/sw.js`) dan membuat `PushSubscription` via `Notification.requestPermission()` + `registration.pushManager.subscribe()`.
2. Subscription (endpoint, p256dh, auth) dikirim ke server dan disimpan di tabel `PushSubscription`.
3. **Vercel Cron** (mis. tiap jam, atau minimal 1x/hari) memanggil `/api/cron/check-reminders`:
   - Cek `BillReminder` yang `remindAt` = hari ini & `isSent = false` → kirim push + catat `Notification` + set `isSent = true`.
   - Hitung realisasi harian per `DailyBudget` aktif vs transaksi hari berjalan → jika over/under → kirim push + catat `Notification`.
4. Pengiriman push memakai library `web-push` dengan VAPID keys (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`) di environment variable.
5. Endpoint cron dilindungi header secret (`CRON_SECRET`) agar tidak bisa dipanggil publik.

## 7. Kalkulasi Otomatis Tabungan
```
sisaNominal = targetAmount - currentAmount
sisaHari   = (targetDate - today) dalam hari

perHari   = sisaNominal / sisaHari
perMinggu = perHari * 7
perBulan  = perHari * 30
```
Direkalkulasi setiap kali ada `SavingContribution` baru atau setiap kali goal dibuka di UI.

## 8. Environment Variables
```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@monege.app
CRON_SECRET=
```

## 9. Strategi Testing
- Unit test untuk logic kalkulasi (tabungan, status budget harian) — Vitest.
- Integration test untuk Server Actions kritikal (transaksi, transfer wallet, pembayaran utang) — memastikan saldo konsisten.
- E2E dasar (login, buat transaksi, buat tagihan) — Playwright (opsional v1.1).

## 10. Deployment & CI/CD
- Repo di GitHub, deploy otomatis ke Vercel dari branch `main`.
- Migrasi database via `prisma migrate deploy` dijalankan sebagai build step / GitHub Action sebelum deploy.
- Vercel Cron dikonfigurasi di `vercel.json` untuk memanggil endpoint reminder secara berkala.
