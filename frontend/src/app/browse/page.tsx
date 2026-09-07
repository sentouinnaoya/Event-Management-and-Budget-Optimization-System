"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ArrowRight,
  ChevronRight,
  MapPin,
  Search,
  SearchX,
  Ticket,
  Users,
} from "lucide-react";
import { useListPublicEventsQuery } from "../../lib/apiSlices";
import { BrandMark, Card, EmptyState, Spinner, formatDate } from "../../components/ui";

export default function BrowsePage() {
  const { data: events, isLoading } = useListPublicEventsQuery();
  const [q, setQ] = useState("");

  const query = q.trim().toLowerCase();
  const filtered = (events ?? []).filter((event) => {
    if (!query) return true;
    return (
      event.name.toLowerCase().includes(query) ||
      event.venue.toLowerCase().includes(query) ||
      (event.description ?? "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark size="sm" />
            <span className="text-base font-semibold text-slate-900">EMBOS</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50/60"
            >
              Home
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-indigo-800">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100">
            <Ticket className="h-3.5 w-3.5" />
            Open registration
          </span>
          <h1 className="mt-4 max-w-xl font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">
            Find your next event
          </h1>
          <p className="mt-2 max-w-xl text-sm text-indigo-100 sm:text-base">
            Browse open events and register as a guest — no account needed.
          </p>
          <div className="relative mt-6 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search events by name, venue, or description…"
              className="w-full rounded-xl border-0 bg-white py-3 pl-9 pr-4 text-sm text-slate-900 shadow-lg shadow-indigo-900/20 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {query && (
          <p className="mb-4 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{filtered.length}</span>{" "}
            event{filtered.length === 1 ? "" : "s"} match your search
          </p>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : !events || events.length === 0 ? (
          <Card className="mt-2">
            <EmptyState
              icon={<CalendarDays className="h-5 w-5" />}
              title="No open events right now"
              description="Check back later — organizers publish events here as they open registration."
            />
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="mt-2">
            <EmptyState
              icon={<SearchX className="h-5 w-5" />}
              title="No events match your search"
              description="Try a different keyword, or clear the search to see all open events."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event) => {
              const spotsLeft = Math.max(
                event.capacity - event.registeredCount,
                0
              );
              const d = new Date(
                event.date + (event.date.length === 10 ? "T00:00:00" : "")
              );
              const day = isNaN(d.getTime()) ? "—" : d.getDate();
              const month = isNaN(d.getTime())
                ? ""
                : d.toLocaleDateString("en-US", { month: "short" });
              return (
                <Link
                  key={event.id}
                  href={`/r/${event.registrationToken}`}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-card-hover"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                      <span className="text-lg font-bold leading-none">
                        {day}
                      </span>
                      <span className="text-[11px] font-semibold uppercase leading-tight">
                        {month}
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="line-clamp-2 text-base font-semibold text-slate-900">
                          {event.name}
                        </h2>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {event.eventType && event.eventType !== "Other" && (
                          <span className="inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                            {event.eventType}
                          </span>
                        )}
                        {spotsLeft > 0 ? (
                        <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                          {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left
                        </span>
                      ) : (
                        <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          Full
                        </span>
)}
                    </div>
                  </div>
                  </div>
                  {event.description && (
                    <p className="mt-3 line-clamp-2 text-sm text-slate-500">
                      {event.description}
                    </p>
                  )}
                  <dl className="mt-4 space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                    {event.address && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="truncate">{event.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-600">
                      <Users className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>
                        {event.registeredCount} / {event.capacity} registered
                      </span>
                    </div>
                  </dl>
                  <span className="mt-5 flex items-center gap-1 border-t border-slate-100 pt-4 text-sm font-medium text-indigo-600 transition-all group-hover:gap-2">
                    Register
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
