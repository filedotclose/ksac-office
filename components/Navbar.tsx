"use client";

import React from "react";
import Image from "next/image";
import { IUser } from "@/types/user";

interface NavbarProps {
  user: IUser;
  onLogout?: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    } finally {
      if (onLogout) {
        onLogout();
      } else {
        window.location.href = "/login";
      }
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "dean":
      case "admin":
        return { label: "Dean KSAC / Admin", color: "bg-purple-100 text-purple-800 border-purple-200" };
      case "president":
        return { label: "President", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "vice_president":
        return { label: "Vice-President", color: "bg-blue-100 text-blue-800 border-blue-200" };
      default:
        return { label: role.toUpperCase(), color: "bg-slate-100 text-slate-800 border-slate-200" };
    }
  };

  const badge = getRoleBadge(user.role);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-900/10 bg-white/90 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/logos/kiit-clean.png"
              alt="KIIT University"
              className="h-9 sm:h-11 w-auto object-contain"
            />
            <div className="h-6 w-px bg-slate-300 hidden sm:block" />
            <img
              src="/logos/ksac-clean.png"
              alt="KSAC"
              className="h-8 sm:h-10 w-auto object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-tight">
              KSAC Office
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-emerald-700 tracking-wider uppercase">
              Event Planning &amp; Documentation Platform
            </span>
          </div>
        </div>

        {/* User profile & actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-xs sm:text-sm font-bold text-slate-800">{user.name}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${badge.color}`}>
                {badge.label}
              </span>
              {user.society && (
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  • {user.society}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 rounded-xl border border-red-200/80 transition-colors shadow-2xs cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
