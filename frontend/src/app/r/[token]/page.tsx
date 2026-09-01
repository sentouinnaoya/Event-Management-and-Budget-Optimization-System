"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarDays, CheckCircle2, MapPin, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  publicRegistrationSchema,
  type PublicRegistrationInput,
} from "../../../lib/schemas";
import {
  useGetPublicEventQuery,
  useRegisterPublicMutation,
} from "../../../lib/apiSlices";
import {
  BrandMark,
  Button,
  Card,
  FieldError,
  Input,
  Label,
  Spinner,
  apiError,
  formatDate,
} from "../../../components/ui";
import type { Guest } from "../../../lib/types";

export default function PublicRegisterPage() {
  const params = useParams();
  const token = String(params.token);
  const { data: event, isLoading, error } = useGetPublicEventQuery(token);
  const [register, { isLoading: submitting }] = useRegisterPublicMutation();
  const [done, setDone] = useState<Guest | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<PublicRegistrationInput>({
    resolver: zodResolver(publicRegistrationSchema),
  });

  async function onSubmit(data: PublicRegistrationInput) {
    try {
      const guest = await register({
        token,
        body: {
          name: data.name,
          email: data.email.trim(),
          phone: data.phone || undefined,
        },
      }).unwrap();
      setDone(guest);
    } catch (e) {
      setSubmitError(apiError(e));
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f7]">
        <Spinner />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f7] px-4">
        <Card className="w-full max-w-md text-center">
          <h1 className="font-display text-lg font-medium text-slate-900">Event not found</h1>
          <p className="mt-1 text-sm text-slate-500">
            This registration link is invalid or the event no longer exists.
          </p>
        </Card>
      </div>
    );
  }

  const registrationOpen =
    event.status === "PUBLISHED" || event.status === "ONGOING";

  return (
    <div className="min-h-screen bg-[#faf9f7] px-4 py-10">
      <div className="mx-auto w-full max-w-lg space-y-5">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark size="sm" />
          </Link>
          <Link
            href="/browse"
            className="text-sm font-medium text-indigo-700 hover:text-indigo-600"
          >
            Browse events →
          </Link>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="bg-indigo-800 px-6 py-6 text-white">
            <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-indigo-100">
              Guest registration
            </span>
            <h1 className="mt-2 font-display text-2xl font-medium tracking-tight">
              {event.name}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs text-indigo-100">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(event.date)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs text-indigo-100">
                <MapPin className="h-3.5 w-3.5" />
                {event.venue}
              </span>
            </div>
          </div>
          <div className="space-y-4 p-6">
            {event.description && (
              <p className="text-sm leading-relaxed text-slate-600">
                {event.description}
              </p>
            )}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
                <Users className="h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <dt className="text-xs text-slate-500">Capacity</dt>
                  <dd className="font-medium text-slate-800">
                    {event.capacity}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <dt className="text-xs text-slate-500">Registered</dt>
                  <dd className="font-medium text-slate-800">
                    {event.registeredCount}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </Card>

        {done ? (
          <Card className="border-emerald-200 bg-emerald-50/60 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <h2 className="mt-3 font-display text-lg font-medium text-emerald-800">
              Registration successful!
            </h2>
            <p className="mt-1 text-sm text-emerald-700">
              You&apos;re all set. We&apos;ll email your ticket to{" "}
              <strong>{done.email}</strong> once the organizer approves your
              registration.
            </p>
            <p className="mt-4 text-sm text-emerald-700">
              The organizer will review your registration before the event.
              Watch your inbox for the confirmation.
            </p>
          </Card>
        ) : !registrationOpen ? (
          <Card className="text-center">
            <p className="text-sm text-slate-600">
              Registrations are currently closed for this event.
            </p>
          </Card>
        ) : (
          <Card>
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Register for this event
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label required>Full name</Label>
                <Input invalid={!!errors.name} {...field("name")} />
                <FieldError message={errors.name?.message} />
              </div>
              <div>
                <Label required>Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  invalid={!!errors.email}
                  {...field("email")}
                />
                <FieldError message={errors.email?.message} />
                <p className="mt-1 text-xs text-slate-500">
                  We&apos;ll email you here once the organizer approves or rejects
                  your registration.
                </p>
              </div>
              <div>
                <Label>Phone</Label>
                <Input {...field("phone")} />
              </div>
              {submitError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {submitError}
                </div>
              )}
              <Button type="submit" loading={submitting} className="w-full">
                Register
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
