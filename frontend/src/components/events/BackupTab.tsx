"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCreateRecoveryPointMutation,
  useDeleteRecoveryPointMutation,
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
  name: z.string().min(1, "Enter a name for the backup plan."),
  backupVenue: z.string().optional(),
  backupDate: z.string().optional(),
  backupCapacity: z.coerce.number().int().min(1).optional().nullable(),
  contingencyBudget: z.coerce.number().min(0).optional().nullable(),
  backupVendors: z.string().optional(),
  notes: z.string().optional(),
});

type BackupInput = z.infer<typeof backupSchema>;

export default function BackupTab({
  eventId,
  readOnly = false,
}: {
  eventId: number;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const { data: backup, isLoading: backupLoading } = useGetBackupQuery(eventId);
  const { data: recoveryPoints, isLoading: recoveryPointsLoading } = useListRecoveryPointsQuery(eventId);
  const { data: logs, isLoading: logsLoading } = useListEventLogsQuery(eventId);
  const [updateBackup] = useUpdateBackupMutation();
  const [createRecoveryPoint] = useCreateRecoveryPointMutation();
  const [restoreRecoveryPoint] = useRestoreRecoveryPointMutation();
  const [deleteRecoveryPoint] = useDeleteRecoveryPointMutation();
  const [saving, setSaving] = useState(false);
  const [planMsg, setPlanMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [draftsMsg, setDraftsMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [recoveryPointDraftName, setRecoveryPointDraftName] = useState("");
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<{ id: number; label: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; label: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof backupSchema>, unknown, BackupInput>({
    resolver: zodResolver(backupSchema),
    defaultValues: {
      name: "",
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
        name: backup.name ?? "",
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
        name: input.name?.trim() || undefined,
        backupVenue: input.backupVenue || undefined,
        backupDate: input.backupDate || undefined,
        backupCapacity: input.backupCapacity ? Number(input.backupCapacity) : undefined,
        contingencyBudget: input.contingencyBudget ? Number(input.contingencyBudget) : undefined,
        backupVendors: input.backupVendors || undefined,
        notes: input.notes || undefined,
      };
      await updateBackup({ eventId, body }).unwrap();
      const label = body.name?.trim() || "Backup draft";
      await createRecoveryPoint({ eventId, label }).unwrap();
      setPlanMsg({ type: "success", text: "Backup plan saved and a new backup draft was created." });
    } catch (e) {
      setPlanMsg({ type: "error", text: apiError(e) });
    } finally {
      setSaving(false);
    }
  }

  async function onCreateRecoveryPoint() {
    if (!recoveryPointDraftName.trim()) {
      setDraftsMsg({ type: "error", text: "Enter a name for the backup draft." });
      return;
    }
    try {
      await createRecoveryPoint({ eventId, label: recoveryPointDraftName.trim() }).unwrap();
      setRecoveryPointDraftName("");
      setDraftsMsg({ type: "success", text: "Backup draft created." });
    } catch (e) {
      setDraftsMsg({ type: "error", text: apiError(e) });
    }
  }

  async function onRestore(recoveryPointId: number) {
    setRestoringId(recoveryPointId);
    try {
      const restored = await restoreRecoveryPoint({ eventId, recoveryPointId }).unwrap();
      setConfirmRestore(null);
      router.push(`/events/${restored.id}`);
    } catch (e) {
      setDraftsMsg({ type: "error", text: apiError(e) });
      setRestoringId(null);
    }
  }

  async function onDelete(recoveryPointId: number) {
    setDeletingId(recoveryPointId);
    try {
      await deleteRecoveryPoint({ eventId, recoveryPointId }).unwrap();
      setConfirmDelete(null);
      setDraftsMsg({ type: "success", text: "Backup draft deleted." });
    } catch (e) {
      setDraftsMsg({ type: "error", text: apiError(e) });
    } finally {
      setDeletingId(null);
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
          <div>
            <Label>Name</Label>
            <Input
              placeholder="e.g. Backup plan A"
              invalid={!!errors.name}
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
            <p className="mt-1 text-xs text-slate-500">
              Used as the label of the backup draft created when you save.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Backup venue</Label>
              <Input disabled={readOnly} {...register("backupVenue")} />
            </div>
            <div>
              <Label>Backup date</Label>
              <Input type="date" disabled={readOnly} {...register("backupDate")} />
            </div>
            <div>
              <Label>Backup capacity</Label>
              <Input
                type="number"
                min={1}
                disabled={readOnly}
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
                disabled={readOnly}
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
              disabled={readOnly}
              placeholder="List backup vendors (one per line)"
              {...register("backupVendors")}
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea rows={2} disabled={readOnly} {...register("notes")} />
          </div>
          {planMsg && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                planMsg.type === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {planMsg.text}
            </div>
          )}
          <div className="flex gap-3">
            {!readOnly && (
              <Button type="submit" loading={saving}>
                Create backup
              </Button>
            )}
            {!readOnly && (
              <Button type="button" variant="secondary" onClick={() => reset()}>
                Reset
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader
          title="Backup drafts"
          subtitle="Create a new event from a saved draft (budget, vendors, staff, open tasks)"
        />
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label>Draft name</Label>
            <Input
              placeholder="e.g. Before cancellation"
              value={recoveryPointDraftName}
              onChange={(e) => setRecoveryPointDraftName(e.target.value)}
              disabled={readOnly}
            />
          </div>
          {!readOnly && (
            <Button onClick={onCreateRecoveryPoint}>Create backup draft</Button>
          )}
        </div>
        {draftsMsg && (
          <div
            className={`mt-3 rounded-lg px-3 py-2 text-sm ${
              draftsMsg.type === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {draftsMsg.text}
          </div>
        )}
        {!recoveryPoints || recoveryPoints.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No backup drafts yet" />
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
                      <div className="flex items-center justify-end gap-2">
                        {!s.restoredEventId && (
                          <Button
                            variant="secondary"
                            className="px-3 py-1.5 text-xs"
                            loading={restoringId === s.id}
                            onClick={() => setConfirmRestore({ id: s.id, label: s.label })}
                          >
                            Create new event from backup
                          </Button>
                        )}
                        {!readOnly && (
                          <button
                            type="button"
                            className="text-xs font-medium text-red-600 hover:text-red-700"
                            disabled={deletingId === s.id}
                            onClick={() => setConfirmDelete({ id: s.id, label: s.label })}
                          >
                            {deletingId === s.id ? "Deleting…" : "Delete"}
                          </button>
                        )}
                      </div>
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
          subtitle="History of status changes, backups, and draft actions"
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

      <Modal open={confirmRestore !== null}
        onClose={() => setConfirmRestore(null)}
        title="Create new event from backup"
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Creating a new event from &quot;{confirmRestore?.label}&quot; uses the backup plan&apos;s
            venue, date, and capacity, plus the saved budget, vendors, staff, and open tasks.
            Guests and expenses are not copied.
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
              Create event
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete backup draft"
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Delete &quot;{confirmDelete?.label}&quot;? This permanently removes the saved draft.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              loading={deletingId !== null}
              onClick={() => confirmDelete && onDelete(confirmDelete.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
