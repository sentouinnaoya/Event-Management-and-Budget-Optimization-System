"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventSchema, type EventInputZ } from "../../../lib/schemas";
import { useCreateEventMutation } from "../../../lib/apiSlices";
import { useAppSelector } from "../../../lib/hooks";
import ProtectedRoute from "../../../components/ProtectedRoute";
import AppShell from "../../../components/AppShell";
import {
  Button,
  Card,
  FieldError,
  Input,
  Label,
  Select,
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

const EVENT_TYPES = ["Conference", "Workshop", "Concert", "Corporate", "Social", "Other…"];

function NewEventForm() {
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const [create, { isLoading, error }] = useCreateEventMutation();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<z.input<typeof eventSchema>, unknown, EventInputZ>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      eventType: "Conference",
      contactEmail: user?.email ?? "",
    },
  });

  const selectedType = watch("eventType") ?? "";
  const isCustomType = EVENT_TYPES.includes(selectedType)
    ? selectedType === "Other…"
    : true;

  function resolveEventType(): string {
    if (isCustomType && (!selectedType || selectedType === "Other…")) {
      return "Other";
    }
    return selectedType;
  }

  async function onSubmit(data: EventInputZ) {
    try {
      const result = await create({
        name: data.name,
        description: data.description || undefined,
        date: data.date,
        durationInDays: data.durationInDays,
        venue: data.venue,
        capacity: data.capacity,
        registrationDeadline: data.registrationDeadline || undefined,
        eventType: resolveEventType(),
        startTime: data.startTime || undefined,
        endTime: data.endTime || undefined,
        contactEmail: data.contactEmail?.trim() || undefined,
        address: data.address?.trim() || undefined,
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
        <h1 className="mt-2 font-display text-xl font-medium text-slate-900">New event</h1>
        <p className="text-sm text-slate-500">
          Enter the event details. The event is saved as a draft until published.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label required>Event name</Label>
            <Input
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label required>Start date</Label>
              <Input
                type="date"
                invalid={!!errors.date}
                {...register("date")}
              />
              <FieldError message={errors.date?.message} />
            </div>
            <div>
              <Label required>Duration (days)</Label>
              <Input
                type="number"
                min={1}
                invalid={!!errors.durationInDays}
                {...register("durationInDays")}
              />
              <FieldError message={errors.durationInDays?.message} />
            </div>
            <div>
              <Label required>Capacity</Label>
              <Input
                type="number"
                min={1}
                invalid={!!errors.capacity}
                {...register("capacity")}
              />
              <FieldError message={errors.capacity?.message} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Event type</Label>
              <Select
                invalid={!!errors.eventType}
                {...register("eventType")}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
              <FieldError message={errors.eventType?.message} />
            </div>
            <div>
              <Label>Contact email</Label>
              <Input
                type="email"
                placeholder="Contact person email"
                invalid={!!errors.contactEmail}
                {...register("contactEmail")}
              />
              <FieldError message={errors.contactEmail?.message} />
            </div>
          </div>
          {isCustomType && (
            <div>
              <Label>Custom event type</Label>
              <Input
                placeholder="e.g. Seminar"
                value={selectedType === "Other…" ? "" : selectedType}
                onChange={(e) => setValue("eventType", e.target.value)}
              />
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label>Start time</Label>
              <Input type="time" {...register("startTime")} />
            </div>
            <div>
              <Label>End time</Label>
              <Input type="time" {...register("endTime")} />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                placeholder="Street, city (optional)"
                {...register("address")}
              />
            </div>
          </div>
          <div>
            <Label required>Venue</Label>
            <Input
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
