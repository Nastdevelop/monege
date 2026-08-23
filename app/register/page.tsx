import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";

export const metadata = {
  title: "Daftar — Monege",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Buat akun baru"
      subtitle="Gratis — wallet pertamamu dibuat otomatis"
    >
      <AuthForm mode="register" />
    </AuthShell>
  );
}
