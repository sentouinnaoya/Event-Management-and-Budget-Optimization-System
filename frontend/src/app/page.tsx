"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Handshake,
  Sparkles,
  Ticket,
  Users,
  Wallet,
} from "lucide-react";
import { useAppSelector } from "../lib/hooks";
import { BrandMark } from "../components/ui";

const features = [
  {
    title: "Budget engine",
    description:
      "Allocate budgets by category, track spending in real time, and get alerted before you go over.",
    icon: Wallet,
  },
  {
    title: "Guests & registration",
    description:
      "Public registration pages, approval workflows, and attendance tracking for every event.",
    icon: Ticket,
  },
  {
    title: "Vendors & staff",
    description:
      "Manage vendors, service agreements, staff roles, and task assignments from one place.",
    icon: Handshake,
  },
  {
    title: "Reports & insights",
    description:
      "Budget, expense, attendance, and staff performance reports that update as your event grows.",
    icon: BarChart3,
  },
  {
    title: "Team collaboration",
    description:
      "Organizer and admin roles with clear separation, so everyone works on the right things.",
    icon: Users,
  },
  {
    title: "Status tracking",
    description:
      "Follow every event from draft to published, ongoing, and completed — all in one timeline.",
    icon: CalendarClock,
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
      "Publish the event, approve guests, and track expenses as they happen.",
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
            <BrandMark size="sm" />
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
                  href="/browse"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Browse events
                </Link>
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

      <section className="relative overflow-hidden bg-[#faf9f7]">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-100/50 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-24 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 sm:px-6 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/70 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-800">
              <Sparkles className="h-3.5 w-3.5" />
              Plan · Organize · Execute · Monitor
            </span>
            <h1 className="mt-7 text-4xl font-medium leading-tight text-slate-900 sm:text-5xl">
              Manage events and budgets in{" "}
              <em className="font-display italic text-indigo-700">one place</em>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              EMBOS is an event management and budget optimization system that
              helps you plan events, control spending, manage guests and
              vendors, and stay on top of every detail.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={authed ? "/dashboard" : "/register"}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.98]"
              >
                {authed ? "Go to dashboard" : "Start for free"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
              >
                <Ticket className="h-4 w-4" />
                Browse events
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-all hover:shadow-card-hover"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-medium text-slate-900">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center font-display text-3xl font-medium tracking-tight text-slate-900">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
            From a blank idea to a finished event report in four simple steps.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.step} className="relative">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-700 font-display text-sm font-semibold text-white shadow-sm">
                  {s.step}
                </span>
                <h3 className="mt-4 font-display text-lg font-medium text-slate-900">
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
        <div className="overflow-hidden rounded-3xl bg-indigo-800 px-6 py-14 text-center sm:px-12">
          <h2 className="font-display text-3xl font-medium tracking-tight text-white">
            Ready to plan your next event?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-indigo-200">
            Create your account and start building events with full budget
            control today.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={authed ? "/dashboard" : "/register"}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-indigo-800 transition-all hover:bg-indigo-50 active:scale-[0.98]"
            >
              {authed ? "Go to dashboard" : "Create an account"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-400/40 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 active:scale-[0.98]"
            >
              <Ticket className="h-4 w-4" />
              Browse events
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <BrandMark size="sm" />
            <span className="font-medium text-slate-700">EMBOS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/browse" className="hover:text-slate-700">
              Browse events
            </Link>
            <Link href="/login" className="hover:text-slate-700">
              Sign in
            </Link>
          </div>
          <p>Event Management &amp; Budget Optimization System</p>
        </div>
      </footer>
    </div>
  );
}
