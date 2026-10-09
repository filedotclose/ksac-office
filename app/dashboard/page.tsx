"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IUser } from "@/types/user";
import Navbar from "@/components/Navbar";
import StudentEventProposals from "@/components/dashboard/StudentEventProposals";
import DeanEventController from "@/components/dashboard/DeanEventController";
import FICViewController from "@/components/dashboard/FICViewController";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<"controller" | "fic" | "builder">("controller");

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        setUser(data.user);
        if (data.user?.role === "dean" || data.user?.role === "admin") {
          setActiveView("controller");
        } else if (data.user?.role === "fic") {
          setActiveView("fic");
        } else {
          setActiveView("builder");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7fbf8] text-slate-600">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-sm tracking-wide text-slate-700">Verifying KSAC Office credentials...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isDeanOrAdmin = user.role === "dean" || user.role === "admin";
  const isFIC = user.role === "fic";
  const authorizedSocieties = Array.isArray(user.societyPositions) && user.societyPositions.length > 0
    ? user.societyPositions
    : user.society
    ? [{ society: user.society, position: user.position || "President" }]
    : [{ society: "KSAC", position: "Lead" }];

  return (
    <div className="min-h-screen flex flex-col bg-[#f7fbf8]">
      <Navbar user={user} onLogout={() => router.replace("/login")} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Institutional Authority Navigation for Dean / Admin */}
        {isDeanOrAdmin && (
          <div className="mb-6 flex items-center justify-between bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView("controller")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  activeView === "controller"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Dean Controller &amp; Mailer
              </button>
              <button
                onClick={() => setActiveView("fic")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  activeView === "fic"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                FIC Review Mode
              </button>
              <button
                onClick={() => setActiveView("builder")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  activeView === "builder"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Proposal Builder &amp; Drafts
              </button>
            </div>
            <span className="hidden md:inline-block text-[11px] font-bold text-slate-500 pr-3">
              Institutional Authority Mode
            </span>
          </div>
        )}

        {/* View switching based on role and selected view */}
        {isDeanOrAdmin && activeView === "controller" ? (
          <DeanEventController />
        ) : (isDeanOrAdmin && activeView === "fic") || isFIC ? (
          <FICViewController user={user} />
        ) : (
          <StudentEventProposals user={user} authorizedSocieties={authorizedSocieties} />
        )}
      </main>
    </div>
  );
}
