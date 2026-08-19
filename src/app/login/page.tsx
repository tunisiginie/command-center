import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5">
      <h1 className="mb-6 text-xl font-semibold text-foreground">Command Center</h1>
      <AuthForm />
    </main>
  );
}
