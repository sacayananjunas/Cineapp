import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-3xl">Login</h1>

        <LoginForm />
      </section>
    </div>
  );
}
