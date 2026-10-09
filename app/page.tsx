"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KIIT_LOGO_BASE64,
  KSAC_LOGO_BASE64,
} from "@/lib/documentAssets";

interface CalendarEvent {
  id: string;
  name: string;
  society: string;
  date: string; // YYYY-MM-DD
  time: string;
  venue: string;
  category: "approved" | "previous";
  budget?: string;
  mode: "OFFLINE" | "ONLINE" | "HYBRID";
}

// Demo & Official Event Catalog (Approved upcoming & previous society events)
const SAMPLE_EVENTS: CalendarEvent[] = [
  {
    id: "ev-1",
    name: "KRONOS 2026 - Annual Tech Symposium",
    society: "Codex & Web Society",
    date: "2026-10-24",
    time: "10:00 AM - 6:00 PM",
    venue: "Campus 25 Auditorium",
    category: "approved",
    budget: "Rs. 1,45,000/-",
    mode: "OFFLINE",
  },
  {
    id: "ev-2",
    name: "MUN KIIT 2026 - Diplomatic Conclave",
    society: "Model United Nations (MUN)",
    date: "2026-10-28",
    time: "9:00 AM - 5:00 PM",
    venue: "Campus 6 Auditorium",
    category: "approved",
    budget: "Rs. 2,10,000/-",
    mode: "OFFLINE",
  },
  {
    id: "ev-3",
    name: "SYMPHONY 2026 - Central Music Festival",
    society: "Music Society (KSAC)",
    date: "2026-11-05",
    time: "5:30 PM - 9:30 PM",
    venue: "Campus 13 KSAC Grounds",
    category: "approved",
    budget: "Rs. 95,000/-",
    mode: "OFFLINE",
  },
  {
    id: "ev-4",
    name: "INNOVENTURE - Flagship Hackathon",
    society: "E-Cell KIIT",
    date: "2026-09-18",
    time: "24 Hours Hack",
    venue: "Campus 15 Auditorium",
    category: "previous",
    budget: "Rs. 1,75,000/-",
    mode: "OFFLINE",
  },
  {
    id: "ev-5",
    name: "LIT-FEST - Odisha Literary Gathering",
    society: "Wordsmith Society",
    date: "2026-09-29",
    time: "11:00 AM - 4:00 PM",
    venue: "Campus 7 Central Hall",
    category: "previous",
    budget: "Rs. 60,000/-",
    mode: "OFFLINE",
  },
];

export default function LandingPage() {
  const router = useRouter();

  // 1. Digital Clock State
  const [clockTime, setClockTime] = useState<string>("");
  const [clockDate, setClockDate] = useState<string>("");

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      // IST Time representation
      const timeStr = now.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      const dateStr = now.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      setClockTime(timeStr);
      setClockDate(dateStr);
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Interactive Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 9, 1)); // Oct 2026
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "approved" | "previous">("all");

  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const getEventsForDay = (day: number) => {
    const formattedDay = String(day).padStart(2, "0");
    const formattedMonth = String(currentMonth + 1).padStart(2, "0");
    const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    return SAMPLE_EVENTS.filter((e) => e.date === dateStr);
  };

  const filteredEventList = SAMPLE_EVENTS.filter((e) => {
    if (activeTab === "all") return true;
    return e.category === activeTab;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Top University Brand Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={KIIT_LOGO_BASE64}
              alt="KIIT University"
              className="h-10 sm:h-12 w-auto object-contain"
            />
            <div className="h-8 w-px bg-slate-800" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={KSAC_LOGO_BASE64}
              alt="KSAC"
              className="h-10 sm:h-12 w-auto object-contain"
            />
            <div>
              <div className="font-black text-sm sm:text-base tracking-wider text-white">
                KSAC OFFICE
              </div>
              <div className="text-[10px] sm:text-xs text-emerald-400 font-bold uppercase tracking-widest hidden md:block">
                KIIT Student Activity Centre - Administrative Portal
              </div>
            </div>
          </div>

          {/* Live Digital Clock Header Display */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end bg-slate-900/90 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl shadow-inner">
              <div className="text-xs font-mono font-black text-emerald-400 tracking-wider">
                {clockTime || "12:00:00 PM"} <span className="text-[10px] text-emerald-500 font-bold">IST</span>
              </div>
              <div className="text-[10px] font-semibold text-slate-400">
                {clockDate || "KIIT Bhubaneswar"}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                Sign In
              </Link>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <span>+</span> Add New Event
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Hero & Welcome Banner */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full space-y-10">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/60 border border-slate-800/80 p-6 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Office of the Dean, KIIT Student Activity Centre (KSAC)
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">KSAC OFFICE</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                The centralized portal for KIIT University student societies. File rough event ideas, build official A4 printable proposals, request campus security &amp; dignitary felicitation materials, and track 3-tier approvals seamlessly from <strong className="text-white">Student Lead &rarr; FIC &rarr; Dean KSAC</strong>.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-900/40 transition active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-lg">+</span> Add New Event / Proposal
                </button>
                <Link
                  href="/login"
                  className="px-5 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-bold text-sm transition"
                >
                  Login (Student / FIC / Dean)
                </Link>
              </div>
            </div>

            {/* Live Clock Card */}
            <div className="lg:col-span-4 bg-slate-900/80 border border-slate-700/80 rounded-2xl p-6 backdrop-blur-md shadow-xl text-center space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Official Campus Clock (IST)
              </div>
              <div className="text-3xl sm:text-4xl font-mono font-black text-emerald-400 tracking-tight py-1">
                {clockTime || "12:00:00 PM"}
              </div>
              <div className="text-xs font-semibold text-slate-300">
                {clockDate || "KIIT Deemed to be University"}
              </div>
              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-around">
                <div>
                  <span className="block font-bold text-white">40+</span>
                  Active Societies
                </div>
                <div className="h-6 w-px bg-slate-800" />
                <div>
                  <span className="block font-bold text-white">100%</span>
                  Statutory A4 Ready
                </div>
                <div className="h-6 w-px bg-slate-800" />
                <div>
                  <span className="block font-bold text-emerald-400">3-Tier</span>
                  Student-FIC-Dean
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Event Calendar Section */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>Event Calendar</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                  Approved &amp; Previous Society Events
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Browse through upcoming approved events and past landmark activities conducted by KSAC societies.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === "all" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                All Events
              </button>
              <button
                onClick={() => setActiveTab("approved")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === "approved" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Approved Upcoming
              </button>
              <button
                onClick={() => setActiveTab("previous")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === "previous" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Previous Events
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Interactive Month Grid */}
            <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="font-black text-base sm:text-lg text-white">
                  {monthNames[currentMonth]} {currentYear}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                    title="Previous Month"
                  >
                    &larr; Prev
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                    title="Next Month"
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>

              {/* Weekday Header */}
              <div className="grid grid-cols-7 gap-1 text-center py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-16 sm:h-20 rounded-xl bg-slate-900/30" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayEvents = getEventsForDay(day);
                  const hasApproved = dayEvents.some((e) => e.category === "approved");
                  const hasPrevious = dayEvents.some((e) => e.category === "previous");

                  return (
                    <div
                      key={`day-${day}`}
                      onClick={() => setSelectedDayEvents(dayEvents)}
                      className={`h-16 sm:h-20 rounded-xl p-1.5 flex flex-col justify-between border transition cursor-pointer ${
                        dayEvents.length > 0
                          ? "bg-slate-900/90 hover:bg-slate-800/90 border-slate-700 shadow-sm"
                          : "bg-slate-900/40 border-slate-800/40 text-slate-500"
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-300">{day}</span>
                      <div className="space-y-1">
                        {hasApproved && (
                          <div className="w-full bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-bold text-emerald-300 rounded px-1 py-0.5 truncate">
                            Approved
                          </div>
                        )}
                        {hasPrevious && (
                          <div className="w-full bg-indigo-500/20 border border-indigo-500/40 text-[9px] font-bold text-indigo-300 rounded px-1 py-0.5 truncate">
                            Past Event
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Calendar Legend */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500" />
                  Dean KSAC Approved Event
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-indigo-500/30 border border-indigo-500" />
                  Past Society Milestone
                </span>
              </div>
            </div>

            {/* Event List Feed */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  {selectedDayEvents.length > 0 ? "Events on Selected Date" : "Featured Society Events"}
                </h3>
                {selectedDayEvents.length > 0 && (
                  <button
                    onClick={() => setSelectedDayEvents([])}
                    className="text-xs text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {(selectedDayEvents.length > 0 ? selectedDayEvents : filteredEventList).map((event) => (
                  <div
                    key={event.id}
                    className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition space-y-2.5 shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          event.category === "approved"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                        }`}
                      >
                        {event.category === "approved" ? "Approved Upcoming" : "Previous Event"}
                      </span>
                      <span className="text-xs font-bold text-slate-400 font-mono">
                        {event.date}
                      </span>
                    </div>

                    <h4 className="font-black text-base text-white leading-snug">
                      {event.name}
                    </h4>

                    <div className="text-xs text-slate-400 space-y-1">
                      <div>
                        <strong className="text-slate-300">Society:</strong> {event.society}
                      </div>
                      <div>
                        <strong className="text-slate-300">Venue:</strong> {event.venue} ({event.mode})
                      </div>
                      <div>
                        <strong className="text-slate-300">Timing:</strong> {event.time}
                      </div>
                      {event.budget && (
                        <div>
                          <strong className="text-slate-300">Sanctioned Budget:</strong>{" "}
                          <span className="text-emerald-400 font-bold">{event.budget}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid: Rough Requests, Multi-tier, Security, Banners */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-4">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm">
              01
            </div>
            <h4 className="font-black text-white text-sm">Rough Pre-Requests</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Submit quick event concepts (Name, Date, Budget) for swift Dean/FIC approval before drafting full documents.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-sm">
              02
            </div>
            <h4 className="font-black text-white text-sm">3-Tier Hierarchy</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Structured pipeline: Student Lead &rarr; Faculty In-Charge (FIC) review &rarr; Dean KSAC final approval.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-sm">
              03
            </div>
            <h4 className="font-black text-white text-sm">Security &amp; Protocol</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Requisition campus guards, night surveillance, Sambalpuri shawls, brass diya lamps, and VIP delegate kits.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm">
              04
            </div>
            <h4 className="font-black text-white text-sm">Banners, Posters &amp; Budget</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stage backdrops (12x8 ft), standees, A3 posters, and an independent budget page with official signatories.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p className="font-bold text-slate-400">
          KIIT Student Activity Centre (KSAC) &bull; Kalinga Institute of Industrial Technology (KIIT)
        </p>
        <p className="mt-1 text-[11px]">
          Deemed to be University, Bhubaneswar, Odisha, India &bull; Official Event Operations Portal
        </p>
      </footer>
    </div>
  );
}
