"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
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
  Button,
  Card,
  FieldError,
  Input,
  Label,
  Spinner,
  apiError,
  formatDate,
} from "../../../components/ui";

export default function PublicRegisterPage() {
  const params = useParams();
  const token = String(params.token);
  const { data: event, isLoading, error } = useGetPublicEventQuery(token);
  const [register, { isLoading: submitting }] = useRegisterPublicMutation();
  const [done, setDone] = useState(false);
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
      await register({ token, body: data }).unwrap();
      setDone(true);
    } catch (e) {
      setSubmitError(apiError(e));
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Spinner />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <Card className="w-full max-w-md text-center">
          <h1 className="text-lg font-bold text-slate-900">Event not found</h1>
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
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-lg space-y-4">
        <Card>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              E
            </span>
            <span className="text-sm font-semibold text-slate-900">EMBOS</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            {event.name}
          </h1>
          {event.description && (
            <p className="mt-2 text-sm text-slate-600">{event.description}</p>
          )}
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-slate-500">Date</dt>
              <dd className="font-medium text-slate-800">
                {formatDate(event.date)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Venue</dt>
              <dd className="font-medium text-slate-800">{event.venue}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Capacity</dt>
              <dd className="font-medium text-slate-800">{event.capacity}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Registered</dt>
              <dd className="font-medium text-slate-800">
                {event.registeredCount}
              </dd>
            </div>
          </dl>
        </Card>

        {done ? (
          <Card className="border-emerald-200 bg-emerald-50/50 text-center">
            <h2 className="text-lg font-bold text-emerald-800">
              Registration successful!
            </h2>
            <p className="mt-1 text-sm text-emerald-700">
              Thank you for registering. The organizer will review your
              registration before the event.
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
                <Input
                  placeholder="Your name"
                  invalid={!!errors.name}
                  {...field("name")}
                />
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
              </div>
              <div>
                <Label>Phone</Label>
                <Input placeholder="Optional" {...field("phone")} />
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
