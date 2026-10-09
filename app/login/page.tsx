"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 bg-[#f7fbf8]">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-10 shadow-xl shadow-emerald-950/5 border border-slate-200/80">
        {/* Institutional Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-3 mb-4">
            <img src="/logos/kiit-clean.png" alt="KIIT" className="h-12 w-auto object-contain" />
            <div className="h-8 w-px bg-slate-300" />
            <img src="/logos/ksac-clean.png" alt="KSAC" className="h-11 w-auto object-contain" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            KSAC Office
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-emerald-700 mt-1">
            Office of the Dean, Student Affairs (KSAC)
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Event Planning, Formal Notesheets &amp; Documentation Portal
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. deanksac@kiit.ac.in or president.fed@kiit.ac.in"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Authenticating..." : "Sign In to KSAC Office"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200/80 text-center">
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Authorized access for Dean KSAC, Faculty Coordinators, Society Presidents, and Vice-Presidents.
          </p>
        </div>
      </div>
    </div>
  );
}
