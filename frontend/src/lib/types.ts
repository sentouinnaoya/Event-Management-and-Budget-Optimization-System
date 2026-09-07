export type Role = "ADMIN" | "ORGANIZER";

export interface UserInfo {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export type NotificationType =
  | "GUEST_REGISTERED"
  | "BUDGET_CATEGORY_EXCEEDED"
  | "BUDGET_EXCEEDED"
  | "EVENT_STATUS_CHANGED"
  | "TASK_ASSIGNED"
  | "RECOVERY_POINT_RESTORED";

export interface AppNotification {
  id: number;
  eventId?: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
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
  | "SUSPENDED"
  | "COMPLETED"
  | "FAILED"
  | "ARCHIVED";

export interface Event {
  id: number;
  name: string;
  description?: string;
  date: string;
  durationInDays?: number;
  venue: string;
  capacity: number;
  registrationDeadline?: string;
  eventType?: string;
  startTime?: string;
  endTime?: string;
  contactEmail?: string;
  address?: string;
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
  durationInDays?: number;
  venue: string;
  capacity: number;
  registrationDeadline?: string;
  eventType?: string;
  startTime?: string;
  endTime?: string;
  contactEmail?: string;
  address?: string;
}

export type AlertLevel = "OK" | "WARNING" | "EXCEEDED";

export interface BudgetCategory {
  id: number;
  name: string;
  allocatedAmount: number;
  alertThresholdPct: number;
  priority: number;
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
  priority: number;
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
  completedAt?: string;
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
  email?: string;
  phone?: string;
  guestType: GuestType;
  status: GuestStatus;
  registrationCode?: string;
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
  eventType?: string;
  startTime?: string;
  endTime?: string;
  contactEmail?: string;
  address?: string;
  status: string;
  registeredCount: number;
  registrationToken: string;
}

export interface Dashboard {
  totalEvents: number;
  draftEvents: number;
  publishedEvents: number;
  ongoingEvents: number;
  suspendedEvents: number;
  completedEvents: number;
  failedEvents: number;
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

export interface DailyDay {
  day: number;
  date: string;
  totalSpent: number;
  registered: number;
  tasksCreated: number;
  tasksDue: number;
  tasksCompleted: number;
  vendorsAdded: number;
}

export interface DailyOverview {
  event: Event;
  totalDays: number;
  days: DailyDay[];
}

export interface DailyReport {
  event: Event;
  date: string;
  day: number;
  totalDays: number;
  expenses: Expense[];
  totalSpent: number;
  expenseCount: number;
  registered: number;
  approved: number;
  attended: number;
  absent: number;
  rejected: number;
  tasksCreated: number;
  tasksDue: number;
  tasksCompleted: number;
  vendorsAdded: number;
}

export interface EventLog {
  id: number;
  action: string;
  message: string;
  actor: string;
  createdAt: string;
}

export interface EventBackup {
  id: number;
  backupVenue?: string;
  backupDate?: string;
  backupCapacity?: number;
  contingencyBudget?: number;
  backupVendors?: string;
  notes?: string;
  updatedAt?: string;
}

export interface EventBackupInput {
  backupVenue?: string;
  backupDate?: string;
  backupCapacity?: number;
  contingencyBudget?: number;
  backupVendors?: string;
  notes?: string;
}

export interface RecoveryPoint {
  id: number;
  label: string;
  restoredEventId?: number;
  restoredAt?: string;
  createdAt: string;
}

export type OptimizationStatus = "SURPLUS" | "BALANCED" | "DEFICIT";

export interface OptimizationCategory {
  categoryId: number;
  name: string;
  priority: number;
  currentAllocation: number;
  spentAmount: number;
  requiredAmount: number;
  suggestedAllocation: number;
  deltaAmount: number;
  coveragePct: number;
  rationale: string;
}

export interface OptimizationResponse {
  status: OptimizationStatus;
  totalBudget: number;
  totalCurrentAllocation: number;
  totalRequired: number;
  totalSuggested: number;
  categories: OptimizationCategory[];
  notes: string[];
}

export interface AppliedAllocation {
  categoryId: number;
  suggestedAllocation: number;
}

export interface AuditLogEntry {
  id: number;
  userId: number;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: number;
  entityName: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export interface AuditLogPage {
  content: AuditLogEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AuditLogStats {
  totalLogs: number;
  todayLogs: number;
  topActions: { action: string; count: number }[];
  topUsers: { userId: number; userName: string; count: number }[];
}

export interface AnalyticsData {
  overview: {
    totalEvents: number;
    totalUsers: number;
    todayUsers: number;
    totalGuests: number;
    totalVendors: number;
    totalTasks: number;
  };
  eventBreakdown: {
    draft: number;
    published: number;
    ongoing: number;
    suspended: number;
    completed: number;
    failed: number;
    archived: number;
  };
  financial: {
    totalAllocated: number;
    totalSpent: number;
    totalRemaining: number;
    pendingExpenses: number;
    totalExpenses: number;
  };
  guests: {
    total: number;
    registered: number;
    approved: number;
    rejected: number;
    attended: number;
    absent: number;
  };
  tasks: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    overdue: number;
  };
  topUsers: { userId: number; userName: string; actionCount: number }[];
  recentEvents: { date: string; count: number }[];
  recentGuests: { date: string; count: number }[];
}

export interface UserActivitySummary {
  id: number;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
  eventCount: number;
  guestCount: number;
  taskCount: number;
  expenseTotal: number;
  auditLogCount: number;
  unreadNotifications: number;
}

export interface UserActivityDetail extends UserActivitySummary {
  eventBreakdown: { status: string; count: number }[];
  tasksDone: number;
  totalNotifications: number;
  recentAuditLogs: {
    action: string;
    entityType: string;
    entityName: string;
    createdAt: string;
  }[];
}
