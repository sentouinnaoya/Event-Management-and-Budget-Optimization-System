export type Role = "ADMIN" | "ORGANIZER";

export interface UserInfo {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  id: number;
  fullName: string;
  email: string;
  role: Role;
}

export type EventStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ONGOING"
  | "COMPLETED"
  | "ARCHIVED";

export interface Event {
  id: number;
  name: string;
  description?: string;
  date: string;
  venue: string;
  capacity: number;
  registrationDeadline?: string;
  status: EventStatus;
  registrationToken?: string;
  organizerName: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EventInput {
  name: string;
  description?: string;
  date: string;
  venue: string;
  capacity: number;
  registrationDeadline?: string;
}

export type AlertLevel = "OK" | "WARNING" | "EXCEEDED";

export interface BudgetCategory {
  id: number;
  name: string;
  allocatedAmount: number;
  alertThresholdPct: number;
  spentAmount: number;
  remainingAmount: number;
  utilizationPct: number;
  alertLevel: AlertLevel;
}

export interface BudgetSummary {
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  categories: BudgetCategory[];
  recommendations: string[];
}

export interface CategoryInput {
  name: string;
  allocatedAmount: number;
  alertThresholdPct: number;
}

export type PaymentStatus = "PAID" | "PENDING";

export interface Expense {
  id: number;
  description: string;
  categoryId: number;
  categoryName: string;
  vendorId?: number;
  vendorName?: string;
  amount: number;
  expenseDate: string;
  paymentStatus: PaymentStatus;
}

export interface ExpenseInput {
  description: string;
  categoryId: number;
  vendorId?: number | null;
  amount: number;
  expenseDate: string;
  paymentStatus: PaymentStatus;
}

export interface Vendor {
  id: number;
  name: string;
  serviceType: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  assignedAmount?: number;
  status: string;
}

export interface VendorInput {
  name: string;
  serviceType: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  assignedAmount?: number | null;
  status: string;
}

export interface Staff {
  id: number;
  name: string;
  responsibility: string;
  phone?: string;
}

export interface StaffInput {
  name: string;
  responsibility: string;
  phone?: string;
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface Task {
  id: number;
  title: string;
  description?: string;
  assignedStaffId?: number;
  assignedStaffName?: string;
  dueDate?: string;
  priority: Priority;
  status: TaskStatus;
}

export interface TaskInput {
  title: string;
  description?: string;
  assignedStaffId?: number | null;
  dueDate?: string;
  priority: string;
  status: string;
}

export type GuestType = "ONLINE" | "VIP" | "SPEAKER" | "SPONSOR" | "WALK_IN";
export type GuestStatus =
  | "REGISTERED"
  | "APPROVED"
  | "REJECTED"
  | "ATTENDED"
  | "ABSENT";

export interface Guest {
  id: number;
  name: string;
  email: string;
  phone?: string;
  guestType: GuestType;
  status: GuestStatus;
  createdAt: string;
}

export interface GuestInput {
  name: string;
  email: string;
  phone?: string;
  guestType: string;
}

export interface PublicEvent {
  id: number;
  name: string;
  description?: string;
  date: string;
  venue: string;
  capacity: number;
  registrationDeadline?: string;
  status: string;
  registeredCount: number;
}

export interface Dashboard {
  totalEvents: number;
  draftEvents: number;
  publishedEvents: number;
  ongoingEvents: number;
  completedEvents: number;
  archivedEvents: number;
  totalGuests: number;
  totalAllocated: number;
  totalSpent: number;
  recentEvents: Event[];
}

export interface SummaryReport {
  event: Event;
  totalGuests: number;
  approvedGuests: number;
  vendorCount: number;
  staffCount: number;
  taskCount: number;
  tasksDone: number;
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
}

export interface AttendanceReport {
  total: number;
  registered: number;
  approved: number;
  rejected: number;
  attended: number;
  absent: number;
  byType: Record<string, number>;
}

export interface ExpenseReportData {
  expenses: Expense[];
  totalSpent: number;
  totalPaid: number;
  totalPending: number;
}

export interface VendorReportData {
  vendors: Vendor[];
  totalAssigned: number;
}

export interface StaffReportData {
  staff: Staff[];
  totalTasks: number;
  tasksDone: number;
}
