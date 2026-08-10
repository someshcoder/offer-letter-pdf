"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function EmployeeLoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/employee-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mobileNumber }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        setError(data.error || "Login failed. Please try again.");
        return;
      }
      router.push(data.redirectTo || "/employee-dashboard");
    } catch {
      setError("Unable to login. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-8 dark:bg-[#020617]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-cyan-500/10 blur-[120px] dark:bg-cyan-500/5" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-indigo-500/10 blur-[120px] dark:bg-indigo-500/5" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/70 p-6 shadow-2xl shadow-slate-200/50 backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-none sm:p-10">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
              Employee / TL Login
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Login with name & mobile
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Employees and TLs can open their dashboard from here.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Full Name
                </span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Employee name"
                  required
                  className="login-input mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition-all focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-800 dark:focus:border-cyan-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Mobile Number
                </span>
                <input
                  value={mobileNumber}
                  onChange={(event) => setMobileNumber(event.target.value)}
                  placeholder="Registered mobile number"
                  required
                  className="login-input mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition-all focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-800 dark:focus:border-cyan-500"
                />
              </label>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-slate-900 px-6 py-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {loading ? "Signing in..." : "Open My Dashboard"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Admin/HR login?{" "}
            <Link href="/login" className="font-semibold text-cyan-700 dark:text-cyan-300">
              Use email login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
