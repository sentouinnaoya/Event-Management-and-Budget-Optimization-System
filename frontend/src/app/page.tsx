"use client";

import Link from "next/link";
import { useAppSelector } from "../lib/hooks";

const features = [
  {
    title: "Budget engine",
    description:
      "Allocate budgets by category, track spending in real time, and get alerted before you go over.",
    icon: "💰",
  },
  {
    title: "Guests & registration",
    description:
      "Public registration links, approval workflows, and attendance tracking for every event.",
    icon: "🎟️",
  },
  {
    title: "Vendors & staff",
    description:
      "Manage vendors, service agreements, staff roles, and task assignments from one place.",
    icon: "🤝",
  },
  {
    title: "Reports & insights",
    description:
      "Budget, expense, attendance, and staff performance reports that update as your event grows.",
    icon: "📊",
  },
  {
    title: "Team collaboration",
    description:
      "Organizer and admin roles with clear separation, so everyone works on the right things.",
    icon: "👥",
  },
  {
    title: "Status tracking",
    description:
      "Follow every event from draft to published, ongoing, and completed — all in one timeline.",
    icon: "🗓️",
  },
];

const steps = [
  {
    step: "01",
    title: "Create an event",
    description:
      "Set your event details, capacity, and registration window. Save it as a draft until you are ready.",
  },
  {
    step: "02",
    title: "Plan the budget",
    description:
      "Split your budget into categories, bring on vendors and staff, and assign tasks.",
  },
  {
    step: "03",
    title: "Publish & register",
    description:
      "Share the registration link, approve guests, and track expenses as they happen.",
  },
  {
    step: "04",
    title: "Execute & report",
    description:
      "Run the event, mark attendance, and review reports to see what worked and what did not.",
  },
];

export default function Home() {
  const { user, initialized } = useAppSelector((s) => s.auth);
  const authed = initialized && user;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              E
            </span>
            <span className="text-base font-semibold">EMBOS</span>
          </Link>
          <nav className="flex items-center gap-3">
            {authed ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            Plan · Organize · Execute · Monitor
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Manage events and budgets in{" "}
            <span className="text-indigo-600">one place</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600">
            EMBOS is an event management and budget optimization system that
            helps you plan events, control spending, manage guests and vendors,
            and stay on top of every detail.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={authed ? "/dashboard" : "/register"}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
            >
              {authed ? "Go to dashboard" : "Start for free"}
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                {f.icon}
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
            From a blank idea to a finished event report in four simple steps.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.step} className="relative">
                <span className="text-3xl font-bold text-indigo-200">
                  {s.step}
                </span>
                <h3 className="mt-2 text-base font-semibold text-slate-900">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="rounded-3xl bg-indigo-600 px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Ready to plan your next event?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-indigo-100">
            Create your account and start building events with full budget
            control today.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={authed ? "/dashboard" : "/register"}
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              {authed ? "Go to dashboard" : "Create an account"}
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-indigo-300 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">
              E
            </span>
            <span className="font-medium text-slate-700">EMBOS</span>
          </div>
          <p>Event Management &amp; Budget Optimization System</p>
        </div>
      </footer>
    </div>
  );
}
