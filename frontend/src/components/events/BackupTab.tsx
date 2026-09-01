"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCreateRecoveryPointMutation,
  useGetBackupQuery,
  useListEventLogsQuery,
  useListRecoveryPointsQuery,
  useRestoreRecoveryPointMutation,
  useUpdateBackupMutation,
} from "../../lib/apiSlices";
import type { EventBackupInput } from "../../lib/types";
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  FieldError,
  Input,
  Label,
  Modal,
  Spinner,
  Textarea,
  apiError,
  formatDate,
  formatMoney,
} from "../ui";

const backupSchema = z.object({
  backupVenue: z.string().optional(),
  backupDate: z.string().optional(),
  backupCapacity: z.coerce.number().int().min(1).optional().nullable(),
  contingencyBudget: z.coerce.number().min(0).optional().nullable(),
  backupVendors: z.string().optional(),
  notes: z.string().optional(),
});

type BackupInput = z.infer<typeof backupSchema>;

export default function BackupTab({ eventId }: { eventId: number }) {
  const router = useRouter();
  const { data: backup, isLoading: backupLoading } = useGetBackupQuery(eventId);
  const { data: recoveryPoints, isLoading: recoveryPointsLoading } = useListRecoveryPointsQuery(eventId);
  const { data: logs, isLoading: logsLoading } = useListEventLogsQuery(eventId);
  const [updateBackup] = useUpdateBackupMutation();
  const [createRecoveryPoint] = useCreateRecoveryPointMutation();
  const [restoreRecoveryPoint] = useRestoreRecoveryPointMutation();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [recoveryPointLabel, setRecoveryPointLabel] = useState("");
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<{ id: number; label: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof backupSchema>, unknown, BackupInput>({
    resolver: zodResolver(backupSchema),
    defaultValues: {
      backupVenue: "",
      backupDate: "",
      backupCapacity: undefined,
      contingencyBudget: undefined,
      backupVendors: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (backup) {
      reset({
        backupVenue: backup.backupVenue ?? "",
        backupDate: backup.backupDate ?? "",
        backupCapacity: backup.backupCapacity ?? undefined,
        contingencyBudget: backup.contingencyBudget ?? undefined,
        backupVendors: backup.backupVendors ?? "",
        notes: backup.notes ?? "",
      });
    }
  }, [backup, reset]);

  async function onSubmit(input: BackupInput) {
    setSaving(true);
    try {
      const body: EventBackupInput = {
        backupVenue: input.backupVenue || undefined,
        backupDate: input.backupDate || undefined,
        backupCapacity: input.backupCapacity ? Number(input.backupCapacity) : undefined,
        contingencyBudget: input.contingencyBudget ? Number(input.contingencyBudget) : undefined,
        backupVendors: input.backupVendors || undefined,
        notes: input.notes || undefined,
      };
      await updateBackup({ eventId, body }).unwrap();
      setMsg({ type: "success", text: "Backup plan saved." });
    } catch (e) {
      setMsg({ type: "error", text: apiError(e) });
    } finally {
      setSaving(false);
    }
  }

  async function onCreateRecoveryPoint() {
    if (!recoveryPointLabel.trim()) {
      setMsg({ type: "error", text: "Enter a label for the recovery point." });
      return;
    }
    try {
      await createRecoveryPoint({ eventId, label: recoveryPointLabel.trim() }).unwrap();
      setRecoveryPointLabel("");
      setMsg({ type: "success", text: "Recovery point created." });
    } catch (e) {
      setMsg({ type: "error", text: apiError(e) });
    }
  }

  async function onRestore(recoveryPointId: number) {
    setRestoringId(recoveryPointId);
    try {
      const restored = await restoreRecoveryPoint({ eventId, recoveryPointId }).unwrap();
      setConfirmRestore(null);
      router.push(`/events/${restored.id}`);
    } catch (e) {
      setMsg({ type: "error", text: apiError(e) });
      setRestoringId(null);
    }
  }

  if (backupLoading || recoveryPointsLoading || logsLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Backup plan (contingency)"
          subtitle="Pre-fill fallback details in case the event is suspended or fails"
        />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Backup venue</Label>
              <Input {...register("backupVenue")} />
            </div>
            <div>
              <Label>Backup date</Label>
              <Input type="date" {...register("backupDate")} />
            </div>
            <div>
              <Label>Backup capacity</Label>
              <Input
                type="number"
                min={1}
                invalid={!!errors.backupCapacity}
                {...register("backupCapacity")}
              />
              <FieldError message={errors.backupCapacity?.message} />
            </div>
            <div>
              <Label>Contingency budget</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                invalid={!!errors.contingencyBudget}
                {...register("contingencyBudget")}
              />
              <FieldError message={errors.contingencyBudget?.message} />
            </div>
          </div>
          <div>
            <Label>Backup vendors</Label>
            <Textarea
              rows={2}
              placeholder="List backup vendors (one per line)"
              {...register("backupVendors")}
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea rows={2} {...register("notes")} />
          </div>
          {msg && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                msg.type === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {msg.text}
            </div>
          )}
          <div className="flex gap-3">
            <Button type="submit" loading={saving}>
              Save backup plan
            </Button>
            <Button type="button" variant="secondary" onClick={() => reset()}>
              Reset
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader
          title="Recovery points"
          subtitle="Save a copy of the plan (budget, vendors, staff, open tasks) to restore into a new event"
        />
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label>Recovery point label</Label>
            <Input
              placeholder="e.g. Before cancellation"
              value={recoveryPointLabel}
              onChange={(e) => setRecoveryPointLabel(e.target.value)}
            />
          </div>
          <Button onClick={onCreateRecoveryPoint}>Create recovery point</Button>
        </div>
        {!recoveryPoints || recoveryPoints.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No recovery points yet" />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Label</th>
                  <th className="pb-2 pr-4 font-medium">Created</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {recoveryPoints.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-medium text-slate-800">{s.label}</td>
                    <td className="py-3 pr-4 text-slate-600">{formatDate(s.createdAt)}</td>
                    <td className="py-3 pr-4 text-slate-600">
                      {s.restoredEventId ? (
                        <a
                          href={`/events/${s.restoredEventId}`}
                          className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          Restored to event #{s.restoredEventId}
                        </a>
                      ) : (
                        <span className="text-slate-400">Available</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {!s.restoredEventId && (
                        <Button
                          variant="secondary"
                          className="px-3 py-1.5 text-xs"
                          loading={restoringId === s.id}
                          onClick={() => setConfirmRestore({ id: s.id, label: s.label })}
                        >
                          Restore
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Audit log"
          subtitle="History of status changes, backups, and recovery-point actions"
        />
        {!logs || logs.length === 0 ? (
          <EmptyState title="No activity yet" />
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {logs.map((entry) => (
              <li key={entry.id} className="py-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-800">{entry.action}</p>
                  <span className="shrink-0 text-xs text-slate-400">
                    {formatDate(entry.createdAt)}
                  </span>
                </div>
                {entry.message && <p className="mt-0.5 text-slate-600">{entry.message}</p>}
                <p className="text-xs text-slate-400">by {entry.actor}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={confirmRestore !== null}
        onClose={() => setConfirmRestore(null)}
        title="Restore recovery point"
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Restoring &quot;{confirmRestore?.label}&quot; creates a <b>new draft event</b> with the saved
            budget, vendors, staff, and open tasks. Guests and expenses are not copied.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setConfirmRestore(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              loading={restoringId !== null}
              onClick={() => confirmRestore && onRestore(confirmRestore.id)}
            >
              Restore
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
