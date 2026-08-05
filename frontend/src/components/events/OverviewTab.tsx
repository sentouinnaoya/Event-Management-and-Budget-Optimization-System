"use client";

import { useState } from "react";
import {
  useBudgetSummaryQuery,
  useChangeEventStatusMutation,
  useGetEventQuery,
  usePublishEventMutation,
} from "../../lib/apiSlices";
import {
  Button,
  Card,
  CardHeader,
  apiError,
  formatDate,
  formatMoney,
} from "../ui";

export default function OverviewTab({ eventId }: { eventId: number }) {
  const { data: event } = useGetEventQuery(eventId);
  const { data: budget } = useBudgetSummaryQuery(eventId, { skip: !event });
  const [publish, { isLoading: publishing }] = usePublishEventMutation();
  const [changeStatus] = useChangeEventStatusMutation();
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  if (!event) return null;

  const registrationUrl =
    typeof window !== "undefined" && event.registrationToken
      ? `${window.location.origin}/r/${event.registrationToken}`
      : null;

  async function copyLink() {
    if (!registrationUrl) return;
    await navigator.clipboard.writeText(registrationUrl);
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
    ["Date", formatDate(event.date)],
    ["Venue", event.venue],
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
        <CardHeader title="Event details" />
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
    </div>
  );
}
