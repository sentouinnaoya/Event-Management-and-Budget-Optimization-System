import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const eventSchema = z.object({
  name: z.string().min(2, "Event name is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Event date is required"),
  durationInDays: z.coerce.number().int().min(1).default(1),
  venue: z.string().min(2, "Venue is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  registrationDeadline: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2, "Category name is required"),
  allocatedAmount: z.coerce
    .number()
    .min(0, "Allocated amount must be zero or more"),
  alertThresholdPct: z.coerce
    .number()
    .min(0)
    .max(100, "Threshold must be between 0 and 100"),
});

export const expenseSchema = z.object({
  description: z.string().min(2, "Description is required"),
  categoryId: z.coerce.number().min(1, "Select a budget category"),
  vendorId: z.coerce.number().optional().nullable(),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  expenseDate: z.string().min(1, "Expense date is required"),
  paymentStatus: z.enum(["PAID", "PENDING"]),
});

export const vendorSchema = z.object({
  name: z.string().min(2, "Vendor name is required"),
  serviceType: z.string().min(2, "Service type is required"),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  assignedAmount: z.coerce.number().min(0).optional().nullable(),
  status: z.enum(["ASSIGNED", "CONFIRMED", "PAID", "COMPLETED"]),
});

export const staffSchema = z.object({
  name: z.string().min(2, "Name is required"),
  responsibility: z.string().min(2, "Responsibility is required"),
  phone: z.string().optional(),
});

export const taskSchema = z.object({
  title: z.string().min(2, "Task title is required"),
  description: z.string().optional(),
  assignedStaffId: z.coerce.number().optional().nullable(),
  dueDate: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
});

export const guestSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  guestType: z.enum(["ONLINE", "VIP", "SPEAKER", "SPONSOR", "WALK_IN"]),
});

export const publicRegistrationSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type EventInputZ = z.infer<typeof eventSchema>;
export type CategoryInputZ = z.infer<typeof categorySchema>;
export type ExpenseInputZ = z.infer<typeof expenseSchema>;
export type VendorInputZ = z.infer<typeof vendorSchema>;
export type StaffInputZ = z.infer<typeof staffSchema>;
export type TaskInputZ = z.infer<typeof taskSchema>;
export type GuestInputZ = z.infer<typeof guestSchema>;
export type PublicRegistrationInput = z.infer<typeof publicRegistrationSchema>;
