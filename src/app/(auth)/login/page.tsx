"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        setError(data.error || "Login failed. Please try again.");
        return;
      }

      router.push("/dashboard");
    } catch (e) {
      setError("Unable to login. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-8 dark:bg-[#020617]">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-cyan-500/10 blur-[120px] dark:bg-cyan-500/5" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-indigo-500/10 blur-[120px] dark:bg-indigo-500/5" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/70 p-6 shadow-2xl shadow-slate-200/50 backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-none sm:p-10">
          <div className="mb-8 text-center sm:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Welcome Back
            </h1>
            <p className="mt-2.5 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
              Please enter your details to sign in.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <label className="block group">
                <span className="text-sm font-semibold text-slate-700 transition-colors group-focus-within:text-cyan-600 dark:text-slate-300 dark:group-focus-within:text-cyan-400">
                  Email Address
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  required
                  className="login-input mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition-all focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-800 dark:focus:border-cyan-500"
                />
              </label>

              <label className="block group">
                <span className="text-sm font-semibold text-slate-700 transition-colors group-focus-within:text-cyan-600 dark:text-slate-300 dark:group-focus-within:text-cyan-400">
                  Password
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                  className="login-input mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition-all focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-800 dark:focus:border-cyan-500"
                />
              </label>
            </div>

            {error ? (
              <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-in fade-in zoom-in duration-300 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
                <svg className="size-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="relative w-full overflow-hidden rounded-2xl bg-slate-900 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-slate-800 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="size-5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </div>
              ) : (
                "Continue to Dashboard"
              )}
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Employee/TL login?{" "}
            <Link href="/employee-login" className="font-semibold text-cyan-700 dark:text-cyan-300">
              Use name and mobile
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
