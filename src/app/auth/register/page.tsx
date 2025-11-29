export const dynamic = "force-dynamic"; // si ya lo usabas
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50">
      <RegisterForm />
    </main>
  );
}