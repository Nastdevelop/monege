import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { getSessionUser } from "@/lib/auth";
import { ActionOverlayProvider } from "@/components/action-overlay";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Monege — Manajemen Keuangan Pribadi",
  description:
    "Catat pemasukan, pengeluaran, utang/piutang, tabungan bertarget, tagihan, dan budget harian dalam satu dashboard.",
  icons: { icon: "/logo.png" },
};

const themeInitScript = (fallback: string) => `(function(){try{var t=localStorage.getItem("monege-theme");if(t!=="dark"&&t!=="soft-color"){t="${fallback}"}document.documentElement.setAttribute("data-theme",t)}catch(e){document.documentElement.setAttribute("data-theme","${fallback}")}})()`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();
  const fallback = user?.themePref === "SOFT_COLOR" ? "soft-color" : "dark";

  return (
    <html
      lang="id"
      data-theme={fallback}
      className={`${jakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript(fallback) }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ActionOverlayProvider>{children}</ActionOverlayProvider>
      </body>
    </html>
  );
}
