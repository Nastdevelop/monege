import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";

export const metadata = {
  title: "Masuk — Monege",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Masuk ke akunmu"
      subtitle="Lanjutkan mengelola keuanganmu"
    >
      <AuthForm mode="login" />
    </AuthShell>
  );
}
