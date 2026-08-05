"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vendorSchema, type VendorInputZ } from "../../lib/schemas";
import {
  useAddVendorMutation,
  useDeleteVendorMutation,
  useListVendorsQuery,
  useUpdateVendorMutation,
} from "../../lib/apiSlices";
import type { Vendor } from "../../lib/types";
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
  apiError,
  formatMoney,
} from "../ui";

const emptyForm = {
  name: "",
  serviceType: "",
  contactPerson: "",
  email: "",
  phone: "",
  assignedAmount: undefined as number | undefined,
  status: "ASSIGNED" as const,
};

export default function VendorsTab({ eventId }: { eventId: number }) {
  const { data: vendors, isLoading } = useListVendorsQuery(eventId);
  const [addVendor] = useAddVendorMutation();
  const [updateVendor] = useUpdateVendorMutation();
  const [removeVendor] = useDeleteVendorMutation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof vendorSchema>, unknown, VendorInputZ>({
    resolver: zodResolver(vendorSchema),
  });

  if (isLoading || !vendors) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  function openCreate() {
    setEditing(null);
    reset(emptyForm);
    setError(null);
    setOpen(true);
  }

  function openEdit(vendor: Vendor) {
    setEditing(vendor);
    reset({
      name: vendor.name,
      serviceType: vendor.serviceType,
      contactPerson: vendor.contactPerson ?? "",
      email: vendor.email ?? "",
      phone: vendor.phone ?? "",
      assignedAmount: vendor.assignedAmount,
      status: vendor.status as
        | "ASSIGNED"
        | "CONFIRMED"
        | "PAID"
        | "COMPLETED",
    });
    setError(null);
    setOpen(true);
  }

  async function onSubmit(input: VendorInputZ) {
    setSaving(true);
    try {
      const body = {
        name: input.name,
        serviceType: input.serviceType,
        contactPerson: input.contactPerson || undefined,
        email: input.email || undefined,
        phone: input.phone || undefined,
        assignedAmount: input.assignedAmount ?? undefined,
        status: input.status,
      };
      if (editing) {
        await updateVendor({ eventId, id: editing.id, body }).unwrap();
      } else {
        await addVendor({ eventId, body }).unwrap();
      }
      setOpen(false);
    } catch (e) {
      setError(apiError(e));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(vendor: Vendor, status: string) {
    try {
      await updateVendor({
        eventId,
        id: vendor.id,
        body: {
          name: vendor.name,
          serviceType: vendor.serviceType,
          contactPerson: vendor.contactPerson,
          email: vendor.email,
          phone: vendor.phone,
          assignedAmount: vendor.assignedAmount,
          status,
        },
      }).unwrap();
    } catch {
      // ignore
    }
  }

  return (
    <Card>
      <CardHeader
        title="Vendors"
        subtitle={`${vendors.length} vendor(s) assigned`}
        action={
          <Button onClick={openCreate} className="px-3 py-1.5 text-xs">
            Add vendor
          </Button>
        }
      />
      {vendors.length === 0 ? (
        <EmptyState
          title="No vendors yet"
          description="Assign vendors to provide services for this event."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Service</th>
                <th className="pb-2 pr-4 font-medium">Contact</th>
                <th className="pb-2 pr-4 font-medium">Assigned</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr
                  key={v.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="py-3 pr-4 font-medium text-slate-800">
                    {v.name}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{v.serviceType}</td>
                  <td className="py-3 pr-4 text-slate-600">
                    {v.contactPerson || v.email || v.phone || "—"}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {v.assignedAmount ? formatMoney(v.assignedAmount) : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <Select
                      value={v.status}
                      onChange={(e) => changeStatus(v, e.target.value)}
                      className="w-32 px-2 py-1 text-xs"
                    >
                      <option value="ASSIGNED">Assigned</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="PAID">Paid</option>
                      <option value="COMPLETED">Completed</option>
                    </Select>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(v)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete vendor "${v.name}"?`))
                            removeVendor({ eventId, id: v.id });
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
        title={editing ? "Edit vendor" : "Add vendor"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label required>Name</Label>
              <Input invalid={!!errors.name} {...register("name")} />
              <FieldError message={errors.name?.message} />
            </div>
            <div>
              <Label required>Service type</Label>
              <Input invalid={!!errors.serviceType} {...register("serviceType")} />
              <FieldError message={errors.serviceType?.message} />
            </div>
          </div>
          <div>
            <Label>Contact person</Label>
            <Input {...register("contactPerson")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Email</Label>
              <Input type="email" invalid={!!errors.email} {...register("email")} />
              <FieldError message={errors.email?.message} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input {...register("phone")} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Assigned amount</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                invalid={!!errors.assignedAmount}
                {...register("assignedAmount")}
              />
              <FieldError message={errors.assignedAmount?.message} />
            </div>
            <div>
              <Label required>Status</Label>
              <Select {...register("status")}>
                <option value="ASSIGNED">Assigned</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PAID">Paid</option>
                <option value="COMPLETED">Completed</option>
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
              {editing ? "Save changes" : "Add vendor"}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
