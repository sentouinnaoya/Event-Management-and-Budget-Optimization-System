"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventSchema, type EventInputZ } from "../../lib/schemas";
import {
  useBudgetSummaryQuery,
  useChangeEventStatusMutation,
  useGetBackupQuery,
  useGetEventQuery,
  usePublishEventMutation,
  useUpdateEventMutation,
} from "../../lib/apiSlices";
import {
  Button,
  Card,
  CardHeader,
  FieldError,
  Input,
  Label,
  Modal,
  Textarea,
  apiError,
  formatDate,
  formatMoney,
} from "../ui";

export default function OverviewTab({
  eventId,
  readOnly = false,
}: {
  eventId: number;
  readOnly?: boolean;
}) {
  const { data: event } = useGetEventQuery(eventId);
  const { data: budget } = useBudgetSummaryQuery(eventId, { skip: !event });
  const { data: backup } = useGetBackupQuery(eventId, {
    skip: !event || (event.status !== "SUSPENDED" && event.status !== "FAILED"),
  });
  const [publish, { isLoading: publishing }] = usePublishEventMutation();
  const [changeStatus] = useChangeEventStatusMutation();
  const [updateEvent] = useUpdateEventMutation();
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [reasonTarget, setReasonTarget] = useState<"SUSPENDED" | "FAILED" | null>(null);
  const [reason, setReason] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof eventSchema>, unknown, EventInputZ>({
    resolver: zodResolver(eventSchema),
  });

  if (!event) return null;

  const openEdit = () => {
    reset({
      name: event.name,
      description: event.description ?? "",
      date: event.date,
      durationInDays: event.durationInDays ?? 1,
      venue: event.venue,
      capacity: event.capacity,
      registrationDeadline: event.registrationDeadline ?? "",
      eventType: event.eventType ?? "Conference",
      startTime: event.startTime ?? "",
      endTime: event.endTime ?? "",
      contactEmail: event.contactEmail ?? "",
      address: event.address ?? "",
    });
    setEditError(null);
    setEditOpen(true);
  }

  async function onEditSubmit(input: EventInputZ) {
    setEditSaving(true);
    try {
      await updateEvent({
        id: eventId,
        body: {
          name: input.name,
          description: input.description || undefined,
          date: input.date,
          durationInDays: input.durationInDays ?? 1,
          venue: input.venue,
          capacity: Number(input.capacity),
          registrationDeadline: input.registrationDeadline || undefined,
          eventType: input.eventType,
          startTime: input.startTime || undefined,
          endTime: input.endTime || undefined,
          contactEmail: input.contactEmail || undefined,
          address: input.address || undefined,
        },
      }).unwrap();
      setEditOpen(false);
      setMsg({ type: "success", text: "Event details updated." });
    } catch (e) {
      setEditError(apiError(e));
    } finally {
      setEditSaving(false);
    }
  }

  async function applyStatus(target: "SUSPENDED" | "FAILED") {
    setSavingStatus(true);
    try {
      const r = reason.trim();
      if (!r) {
        setMsg({ type: "error", text: "A reason is required." });
        return;
      }
      await changeStatus({ id: eventId, status: target, reason: r }).unwrap();
      setMsg({
        type: "success",
        text: target === "SUSPENDED" ? "Event suspended." : "Event marked as failed.",
      });
      setReasonTarget(null);
      setReason("");
    } catch (e) {
      setMsg({ type: "error", text: apiError(e) });
    } finally {
      setSavingStatus(false);
    }
  }

  const registrationUrl =
    typeof window !== "undefined" && event.registrationToken
      ? `${window.location.origin}/r/${event.registrationToken}`
      : null;

  async function copyLink() {
    if (!registrationUrl) return;
    try {
      const html = `<a href="${registrationUrl}">${registrationUrl}</a>`;
      const item = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([registrationUrl], { type: "text/plain" }),
      });
      await navigator.clipboard.write([item]);
    } catch {
      await navigator.clipboard.writeText(registrationUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      setMsg({ type: "success", text: success });
    } catch (e) {
      setMsg({ type: "error", text: apiError(e) });
    }
  }

  const details: Array<[string, string]> = [
    [
      "Date",
      (event.durationInDays ?? 1) > 1
        ? `${formatDate(event.date)} – ${formatDate(
            new Date(
              new Date(event.date).getTime() +
                ((event.durationInDays ?? 1) - 1) * 86400000
            ).toISOString().slice(0, 10)
          )} (${event.durationInDays} days)`
        : formatDate(event.date),
    ],
    ["Venue", event.venue],
    ["Address", event.address || "—"],
    [
      "Time",
      event.startTime
        ? `${event.startTime.slice(0, 5)}${event.endTime ? " – " + event.endTime.slice(0, 5) : ""}`
        : "—",
    ],
    ["Event type", event.eventType || "—"],
    ["Contact", event.contactEmail || "—"],
    ["Capacity", String(event.capacity)],
    [
      "Registration deadline",
      event.registrationDeadline ? formatDate(event.registrationDeadline) : "Until event date",
    ],
    ["Organizer", event.organizerName],
    ["Created", formatDate(event.createdAt)],
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader
          title="Event details"
          action={
            !readOnly && (
              <Button
                variant="secondary"
                className="px-3 py-1.5 text-xs"
                onClick={openEdit}
              >
                Edit
              </Button>
            )
          }
        />
        {event.description && (
          <p className="mb-4 text-sm text-slate-600">{event.description}</p>
        )}
        <dl className="space-y-2 text-sm">
          {details.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-slate-100 pb-2 last:border-0">
              <dt className="text-slate-500">{k}</dt>
              <dd className="font-medium text-slate-800 text-right">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Registration page" />
          {registrationUrl ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Share this link so guests can register online.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700">
                  {registrationUrl}
                </code>
                <Button variant="secondary" onClick={copyLink} className="px-3 py-2 text-xs">
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <a
                href={`/r/${event.registrationToken}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Open registration page →
              </a>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              This event has not been published yet. Publish it to generate a
              registration link.
            </p>
          )}
        </Card>

        <Card>
          <CardHeader title="Status & lifecycle" />
          {(event.status === "SUSPENDED" || event.status === "FAILED") && (
            <div
              className={`mb-3 rounded-lg px-3 py-2 text-sm ${
                event.status === "FAILED"
                  ? "bg-red-50 text-red-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {event.status === "FAILED"
                ? "This event failed and cannot be resumed."
                : "This event is suspended. Resume it or mark it as failed."}
              {backup && (
                <p className="mt-1 text-xs opacity-80">
                  A backup plan is set for this event.
                </p>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {event.status === "DRAFT" && (
              <Button
                loading={publishing}
                onClick={() =>
                  run(() => publish(eventId).unwrap(), "Event published.")
                }
              >
                Publish
              </Button>
            )}
            {event.status === "PUBLISHED" && (
              <Button
                onClick={() =>
                  run(
                    () => changeStatus({ id: eventId, status: "ONGOING" }).unwrap(),
                    "Event marked as ongoing."
                  )
                }
              >
                Mark ongoing
              </Button>
            )}
            {event.status === "ONGOING" && (
              <Button
                onClick={() =>
                  run(
                    () => changeStatus({ id: eventId, status: "COMPLETED" }).unwrap(),
                    "Event marked as completed."
                  )
                }
              >
                Mark completed
              </Button>
            )}
            {event.status === "SUSPENDED" && (
              <Button
                onClick={() =>
                  run(
                    () => changeStatus({ id: eventId, status: "ONGOING" }).unwrap(),
                    "Event resumed."
                  )
                }
              >
                Resume
              </Button>
            )}
            {(event.status === "PUBLISHED" || event.status === "ONGOING") && (
              <Button
                variant="outline"
                onClick={() => {
                  setReason("");
                  setReasonTarget("SUSPENDED");
                }}
              >
                Suspend
              </Button>
            )}
            {(event.status === "DRAFT" ||
              event.status === "PUBLISHED" ||
              event.status === "ONGOING" ||
              event.status === "SUSPENDED") && (
              <Button
                variant="outline"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => {
                  setReason("");
                  setReasonTarget("FAILED");
                }}
              >
                Mark failed
              </Button>
            )}
            {event.status !== "ARCHIVED" && (
              <Button
                variant="outline"
                onClick={() =>
                  run(
                    () => changeStatus({ id: eventId, status: "ARCHIVED" }).unwrap(),
                    "Event archived."
                  )
                }
              >
                Archive
              </Button>
            )}
          </div>
          {msg && (
            <p
              className={
                msg.type === "error"
                  ? "mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                  : "mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
              }
            >
              {msg.text}
            </p>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Budget summary:{" "}
            <span className="font-medium text-slate-700">
              {budget
                ? `${formatMoney(budget.totalSpent)} spent of ${formatMoney(budget.totalAllocated)}`
                : "No budget allocated yet"}
            </span>
          </p>
        </Card>
      </div>

      <Modal
        open={reasonTarget !== null}
        onClose={() => setReasonTarget(null)}
        title={reasonTarget === "SUSPENDED" ? "Suspend event" : "Mark event as failed"}
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            {reasonTarget === "SUSPENDED"
              ? "Provide a reason for suspending this event. It will be recorded in the audit log."
              : "Provide a reason for marking this event as failed. It will be recorded in the audit log."}
          </p>
          <Textarea
            rows={3}
            placeholder="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setReasonTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              loading={savingStatus}
              onClick={() => reasonTarget && applyStatus(reasonTarget)}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit event details"
      >
        <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-3">
          <div>
            <Label required>Name</Label>
            <Input invalid={!!errors.name} {...register("name")} />
            <FieldError message={errors.name?.message} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={2} {...register("description")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label required>Event date</Label>
              <Input type="date" invalid={!!errors.date} {...register("date")} />
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
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label required>Venue</Label>
              <Input invalid={!!errors.venue} {...register("venue")} />
              <FieldError message={errors.venue?.message} />
            </div>
            <div>
              <Label>Address</Label>
              <Input {...register("address")} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div>
              <Label required>Event type</Label>
              <Input invalid={!!errors.eventType} {...register("eventType")} />
              <FieldError message={errors.eventType?.message} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Start time</Label>
              <Input type="time" {...register("startTime")} />
            </div>
            <div>
              <Label>End time</Label>
              <Input type="time" {...register("endTime")} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Contact email</Label>
              <Input type="email" invalid={!!errors.contactEmail} {...register("contactEmail")} />
              <FieldError message={errors.contactEmail?.message} />
            </div>
            <div>
              <Label>Registration deadline</Label>
              <Input type="date" {...register("registrationDeadline")} />
            </div>
          </div>
          {editError && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {editError}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={editSaving}>
              Save changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
