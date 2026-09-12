"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [registerMessage, setRegisterMessage] = useState<string | null>(null);

  return (
    <>
      <form
        className="mt-5 space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          const form = new FormData(event.currentTarget);
          const email = String(form.get("email") ?? "").trim();
          const password = String(form.get("password") ?? "");
          const result = await signIn("credentials", { email, password, callbackUrl: "/", redirect: false });
          if (!result || result.error) {
            setError("Invalid credentials.");
            return;
          }
          window.location.href = result.url ?? "/";
        }}
      >
        <input name="email" type="email" required placeholder="Email" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input name="password" type="password" required placeholder="Password" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button type="submit" className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Login</button>
      </form>

      {error ? <p className="mt-2 text-xs text-rose-700">{error}</p> : null}

      <form
        className="mt-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setRegisterMessage(null);
          const form = new FormData(event.currentTarget);
          const payload = {
            name: String(form.get("name") ?? "").trim(),
            email: String(form.get("newEmail") ?? "").toLowerCase().trim(),
            password: String(form.get("newPassword") ?? ""),
          };
          const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            setRegisterMessage("Registration failed. Try another email.");
            return;
          }

          setRegisterMessage("Registration successful. Logging you in...");
          const result = await signIn("credentials", {
            email: payload.email,
            password: payload.password,
            callbackUrl: "/",
            redirect: false,
          });
          if (!result || result.error) {
            setRegisterMessage("Registered, but login failed. Please login manually.");
            return;
          }
          window.location.href = result.url ?? "/";
        }}
      >
        <h2 className="mb-2 mt-6 text-xl">Create account</h2>
        <div className="space-y-3">
          <input name="name" required placeholder="Full name" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input name="newEmail" type="email" required placeholder="Email" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input name="newPassword" type="password" minLength={8} required placeholder="Password" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100">Register & login</button>
        </div>
      </form>

      {registerMessage ? <p className="mt-2 text-xs text-slate-600">{registerMessage}</p> : null}
    </>
  );
}
