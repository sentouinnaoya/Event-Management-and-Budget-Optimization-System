"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { staffSchema, type StaffInputZ } from "../../lib/schemas";
import {
  useAddStaffMutation,
  useDeleteStaffMutation,
  useListStaffQuery,
  useUpdateStaffMutation,
} from "../../lib/apiSlices";
import type { Staff } from "../../lib/types";
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
  apiError,
} from "../ui";

export default function StaffTab({ eventId, readOnly = false }: { eventId: number; readOnly?: boolean }) {
  const { data: staff, isLoading } = useListStaffQuery(eventId);
  const [addStaff] = useAddStaffMutation();
  const [updateStaff] = useUpdateStaffMutation();
  const [removeStaff] = useDeleteStaffMutation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StaffInputZ>({ resolver: zodResolver(staffSchema) });

  if (isLoading || !staff) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  function openCreate() {
    setEditing(null);
    reset({ name: "", responsibility: "", phone: "" });
    setError(null);
    setOpen(true);
  }

  function openEdit(member: Staff) {
    setEditing(member);
    reset({
      name: member.name,
      responsibility: member.responsibility,
      phone: member.phone ?? "",
    });
    setError(null);
    setOpen(true);
  }

  async function onSubmit(input: StaffInputZ) {
    setSaving(true);
    try {
      const body = {
        name: input.name,
        responsibility: input.responsibility,
        phone: input.phone || undefined,
      };
      if (editing) {
        await updateStaff({ eventId, id: editing.id, body }).unwrap();
      } else {
        await addStaff({ eventId, body }).unwrap();
      }
      setOpen(false);
    } catch (e) {
      setError(apiError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Staff"
        subtitle={`${staff.length} member(s) assigned`}
        action={
          !readOnly && (
            <Button onClick={openCreate} className="px-3 py-1.5 text-xs">
              Add staff
            </Button>
          )
        }
      />
      {staff.length === 0 ? (
        <EmptyState
          title="No staff members yet"
          description="Assign responsibilities to your team."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Responsibility</th>
                <th className="pb-2 pr-4 font-medium">Phone</th>
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {staff.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="py-3 pr-4 font-medium text-slate-800">
                    {m.name}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{m.responsibility}</td>
                  <td className="py-3 pr-4 text-slate-600">{m.phone || "—"}</td>
                  <td className="py-3 text-right">
                    {!readOnly && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(m)}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${m.name}?`))
                              removeStaff({ eventId, id: m.id });
                          }}
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit staff member" : "Add staff member"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label required>Name</Label>
            <Input invalid={!!errors.name} {...register("name")} />
            <FieldError message={errors.name?.message} />
          </div>
          <div>
            <Label required>Responsibility</Label>
            <Input invalid={!!errors.responsibility} {...register("responsibility")} />
            <FieldError message={errors.responsibility?.message} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input {...register("phone")} />
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
              {editing ? "Save changes" : "Add staff"}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
