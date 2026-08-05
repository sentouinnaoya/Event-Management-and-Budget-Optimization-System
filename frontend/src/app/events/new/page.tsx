"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventSchema, type EventInputZ } from "../../../lib/schemas";
import { useCreateEventMutation } from "../../../lib/apiSlices";
import ProtectedRoute from "../../../components/ProtectedRoute";
import AppShell from "../../../components/AppShell";
import {
  Button,
  Card,
  FieldError,
  Input,
  Label,
  Textarea,
  apiError,
} from "../../../components/ui";

export default function NewEventPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <NewEventForm />
      </AppShell>
    </ProtectedRoute>
  );
}

function NewEventForm() {
  const router = useRouter();
  const [create, { isLoading, error }] = useCreateEventMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof eventSchema>, unknown, EventInputZ>({
    resolver: zodResolver(eventSchema),
  });

  async function onSubmit(data: EventInputZ) {
    try {
      const result = await create({
        name: data.name,
        description: data.description || undefined,
        date: data.date,
        venue: data.venue,
        capacity: data.capacity,
        registrationDeadline: data.registrationDeadline || undefined,
      }).unwrap();
      router.push(`/events/${result.id}`);
    } catch {
      // error shown below
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/events"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          &larr; Back to events
        </Link>
        <h1 className="mt-2 text-xl font-bold text-slate-900">New event</h1>
        <p className="text-sm text-slate-500">
          Enter the event details. The event is saved as a draft until published.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label required>Event name</Label>
            <Input
              placeholder="Tech Summit 2026"
              invalid={!!errors.name}
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              rows={3}
              placeholder="Short description shown on the registration page"
              {...register("description")}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label required>Date</Label>
              <Input
                type="date"
                invalid={!!errors.date}
                {...register("date")}
              />
              <FieldError message={errors.date?.message} />
            </div>
            <div>
              <Label required>Capacity</Label>
              <Input
                type="number"
                min={1}
                placeholder="200"
                invalid={!!errors.capacity}
                {...register("capacity")}
              />
              <FieldError message={errors.capacity?.message} />
            </div>
          </div>
          <div>
            <Label required>Venue</Label>
            <Input
              placeholder="Convention Center"
              invalid={!!errors.venue}
              {...register("venue")}
            />
            <FieldError message={errors.venue?.message} />
          </div>
          <div>
            <Label>Registration deadline</Label>
            <Input type="date" {...register("registrationDeadline")} />
            <p className="mt-1 text-xs text-slate-500">
              Leave empty to accept registrations until the event date.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {apiError(error)}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={isLoading}>
              Create event
            </Button>
            <Link href="/events">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
