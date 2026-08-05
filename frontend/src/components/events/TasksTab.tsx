"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskSchema, type TaskInputZ } from "../../lib/schemas";
import {
  useAddTaskMutation,
  useDeleteTaskMutation,
  useListStaffQuery,
  useListTasksQuery,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
} from "../../lib/apiSlices";
import type { Task } from "../../lib/types";
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
  formatDate,
} from "../ui";

export default function TasksTab({ eventId }: { eventId: number }) {
  const { data: tasks, isLoading } = useListTasksQuery(eventId);
  const { data: staff } = useListStaffQuery(eventId);
  const [addTask] = useAddTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [updateStatus] = useUpdateTaskStatusMutation();
  const [removeTask] = useDeleteTaskMutation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof taskSchema>, unknown, TaskInputZ>({
    resolver: zodResolver(taskSchema),
    defaultValues: { priority: "MEDIUM", status: "TODO" },
  });

  if (isLoading || !tasks) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  function openCreate() {
    setEditing(null);
    reset({ title: "", description: "", priority: "MEDIUM", status: "TODO" });
    setError(null);
    setOpen(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    reset({
      title: task.title,
      description: task.description ?? "",
      assignedStaffId: task.assignedStaffId ?? undefined,
      dueDate: task.dueDate ?? "",
      priority: task.priority,
      status: task.status,
    });
    setError(null);
    setOpen(true);
  }

  async function onSubmit(input: TaskInputZ) {
    setSaving(true);
    try {
      const body = {
        title: input.title,
        description: input.description || undefined,
        assignedStaffId: input.assignedStaffId ? Number(input.assignedStaffId) : null,
        dueDate: input.dueDate || undefined,
        priority: input.priority,
        status: input.status,
      };
      if (editing) {
        await updateTask({ eventId, id: editing.id, body }).unwrap();
      } else {
        await addTask({ eventId, body }).unwrap();
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
        title="Tasks"
        subtitle={`${tasks.length} task(s)`}
        action={
          <Button onClick={openCreate} className="px-3 py-1.5 text-xs">
            Add task
          </Button>
        }
      />
      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Create preparation tasks with deadlines."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-4 font-medium">Task</th>
                <th className="pb-2 pr-4 font-medium">Assignee</th>
                <th className="pb-2 pr-4 font-medium">Due</th>
                <th className="pb-2 pr-4 font-medium">Priority</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="py-3 pr-4 font-medium text-slate-800">
                    {t.title}
                    {t.description && (
                      <p className="text-xs font-normal text-slate-500">
                        {t.description}
                      </p>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {t.assignedStaffName ?? "—"}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {formatDate(t.dueDate)}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={t.priority} />
                  </td>
                  <td className="py-3 pr-4">
                    <Select
                      value={t.status}
                      onChange={(e) =>
                        updateStatus({
                          eventId,
                          id: t.id,
                          status: e.target.value as Task["status"],
                        })
                      }
                      className="w-32 px-2 py-1 text-xs"
                    >
                      <option value="TODO">To do</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="DONE">Done</option>
                    </Select>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(t)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete task "${t.title}"?`))
                            removeTask({ eventId, id: t.id });
                        }}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
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
        title={editing ? "Edit task" : "Add task"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label required>Title</Label>
            <Input invalid={!!errors.title} {...register("title")} />
            <FieldError message={errors.title?.message} />
          </div>
          <div>
            <Label>Description</Label>
            <Input {...register("description")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Assigned staff</Label>
              <Select {...register("assignedStaffId")}>
                <option value="">Unassigned</option>
                {(staff ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Due date</Label>
              <Input type="date" {...register("dueDate")} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label required>Priority</Label>
              <Select {...register("priority")}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </Select>
            </div>
            <div>
              <Label required>Status</Label>
              <Select {...register("status")}>
                <option value="TODO">To do</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
              </Select>
            </div>
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
              {editing ? "Save changes" : "Add task"}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
