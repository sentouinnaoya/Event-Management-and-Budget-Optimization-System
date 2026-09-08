"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { guestSchema, type GuestInputZ } from "../../lib/schemas";
import {
  useAddGuestMutation,
  useListGuestsQuery,
  useUpdateGuestStatusMutation,
} from "../../lib/apiSlices";
import type { GuestStatus } from "../../lib/types";
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  FieldError,
  Input,
  Label,
  Modal,
  Select,
  Spinner,
  StatusBadge,
  apiError,
} from "../ui";

const statusActions: Array<{ label: string; status: GuestStatus; tone?: string }> = [
  { label: "Approve", status: "APPROVED" },
  { label: "Reject", status: "REJECTED" },
  { label: "Check in", status: "ATTENDED" },
  { label: "Mark absent", status: "ABSENT" },
];

export default function GuestsTab({ eventId, readOnly = false }: { eventId: number; readOnly?: boolean }) {
  const { data: guests, isLoading } = useListGuestsQuery(eventId);
  const [addGuest] = useAddGuestMutation();
  const [updateStatus] = useUpdateGuestStatusMutation();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GuestInputZ>({
    resolver: zodResolver(guestSchema),
    defaultValues: { guestType: "VIP" },
  });

  if (isLoading || !guests) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  async function onSubmit(input: GuestInputZ) {
    setSaving(true);
    try {
      await addGuest({
        eventId,
        body: {
          name: input.name,
          email: input.email,
          phone: input.phone || undefined,
          guestType: input.guestType,
        },
      }).unwrap();
      setOpen(false);
      reset();
    } catch (e) {
      setError(apiError(e));
    } finally {
      setSaving(false);
    }
  }

  const counts: Record<string, number> = {};
  guests.forEach((g) => {
    counts[g.status] = (counts[g.status] ?? 0) + 1;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {Object.entries(counts).map(([status, count]) => (
          <Card key={status} className="px-4 py-2">
            <span className="text-xs text-slate-500">{status}</span>{" "}
            <span className="text-sm font-bold text-slate-900">{count}</span>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Guests"
          subtitle={`${guests.length} guest(s)`}
          action={
            !readOnly && (
              <Button onClick={() => { setOpen(true); setError(null); }} className="px-3 py-1.5 text-xs">
                Add guest
              </Button>
            )
          }
        />
        {guests.length === 0 ? (
          <EmptyState
            title="No guests yet"
            description="Guests can register via the registration link, or add VIPs, speakers, sponsors, and walk-ins manually."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Phone</th>
                  <th className="pb-2 pr-4 font-medium">Ticket</th>
                  <th className="pb-2 pr-4 font-medium">Type</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((g) => (
                  <tr
                    key={g.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium text-slate-800">
                      {g.name}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{g.email}</td>
                    <td className="py-3 pr-4 text-slate-600">{g.phone || "—"}</td>
                    <td className="py-3 pr-4">
                      {g.registrationCode ? (
                        <span className="font-mono text-xs font-semibold tracking-wider text-slate-700">
                          {g.registrationCode.slice(0, 4)}-{g.registrationCode.slice(4)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={g.guestType} />
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={g.status} />
                    </td>
                    <td className="py-3">
                      {!readOnly && (
                        <div className="flex flex-wrap gap-1.5">
                          {statusActions.map((a) => (
                            <button
                              key={a.status}
                              onClick={() => updateStatus({ eventId, id: g.id, status: a.status })}
                              className={
                                a.status === "REJECTED"
                                  ? "rounded border border-red-200 px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50"
                                  : "rounded border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                              }
                            >
                              {a.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add guest">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label required>Name</Label>
            <Input invalid={!!errors.name} {...register("name")} />
            <FieldError message={errors.name?.message} />
          </div>
          <div>
            <Label required>Email</Label>
            <Input type="email" invalid={!!errors.email} {...register("email")} />
            <FieldError message={errors.email?.message} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input {...register("phone")} />
          </div>
          <div>
            <Label required>Guest type</Label>
            <Select {...register("guestType")}>
              <option value="VIP">VIP</option>
              <option value="SPEAKER">Speaker</option>
              <option value="SPONSOR">Sponsor</option>
              <option value="WALK_IN">Walk-in</option>
              <option value="ONLINE">Online</option>
            </Select>
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Add guest
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
