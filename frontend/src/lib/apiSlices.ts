import { baseApi } from "./api";
import type {
  AnalyticsData,
  AppNotification,
  AuditLogEntry,
  AuditLogPage,
  AuditLogStats,
  AttendanceReport,
  AuthResponse,
  AppliedAllocation,
  BudgetCategory,
  BudgetSummary,
  CategoryInput,
  DailyOverview,
  DailyReport,
  Dashboard,
  Event,
  EventBackup,
  EventBackupInput,
  EventInput,
  EventLog,
  Expense,
  ExpenseInput,
  ExpenseReportData,
  Guest,
  GuestInput,
  GuestStatus,
  OptimizationResponse,
  PublicEvent,
  RecoveryPoint,
  Staff,
  StaffInput,
  StaffReportData,
  SummaryReport,
  Task,
  TaskInput,
  TaskStatus,
  UserInfo,
  UserActivitySummary,
  UserActivityDetail,
  Vendor,
  VendorInput,
  VendorReportData,
} from "./types";

export const authApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    login: b.mutation<AuthResponse, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    register: b.mutation<
      AuthResponse,
      { fullName: string; email: string; password: string }
    >({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),
  }),
});

export const eventsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listEvents: b.query<Event[], string | void>({
      query: (status) => ({ url: "/events", params: status ? { status } : {} }),
      providesTags: ["Events"],
    }),
    getEvent: b.query<Event, number>({
      query: (id) => `/events/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Event", id }],
    }),
    createEvent: b.mutation<Event, EventInput>({
      query: (body) => ({ url: "/events", method: "POST", body }),
      invalidatesTags: ["Events", "Dashboard"],
    }),
    updateEvent: b.mutation<Event, { id: number; body: EventInput }>({
      query: ({ id, body }) => ({ url: `/events/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Event", id },
        "Events",
        "Dashboard",
      ],
    }),
    deleteEvent: b.mutation<void, number>({
      query: (id) => ({ url: `/events/${id}`, method: "DELETE" }),
      invalidatesTags: ["Events", "Dashboard"],
    }),
    publishEvent: b.mutation<Event, number>({
      query: (id) => ({ url: `/events/${id}/publish`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Event", id },
        "Events",
        "Dashboard",
      ],
    }),
    changeEventStatus: b.mutation<Event, { id: number; status: string; reason?: string }>({
      query: ({ id, status, reason }) => ({
        url: `/events/${id}/status`,
        method: "PATCH",
        body: { status, reason },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Event", id },
        "Events",
        "Dashboard",
      ],
    }),
  }),
});

export const budgetApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCategories: b.query<BudgetCategory[], number>({
      query: (eventId) => `/events/${eventId}/budget-categories`,
      providesTags: ["Budget"],
    }),
    addCategory: b.mutation<BudgetCategory, { eventId: number; body: CategoryInput }>({
      query: ({ eventId, body }) => ({
        url: `/events/${eventId}/budget-categories`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Budget", "Reports", "Dashboard"],
    }),
    updateCategory: b.mutation<
      BudgetCategory,
      { eventId: number; id: number; body: CategoryInput }
    >({
      query: ({ eventId, id, body }) => ({
        url: `/events/${eventId}/budget-categories/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Budget", "Reports", "Dashboard"],
    }),
    deleteCategory: b.mutation<void, { eventId: number; id: number }>({
      query: ({ eventId, id }) => ({
        url: `/events/${eventId}/budget-categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Budget", "Reports", "Dashboard"],
    }),
    budgetSummary: b.query<BudgetSummary, number>({
      query: (eventId) => `/events/${eventId}/budget/summary`,
      providesTags: ["Budget", "Reports"],
    }),
    optimizeBudget: b.mutation<
      OptimizationResponse,
      { eventId: number; totalBudget?: number }
    >({
      query: ({ eventId, totalBudget }) => ({
        url: `/events/${eventId}/budget/optimize`,
        method: "POST",
        body:
          totalBudget === undefined || Number.isNaN(totalBudget)
            ? {}
            : { totalBudget },
      }),
    }),
    applyOptimization: b.mutation<
      BudgetSummary,
      { eventId: number; allocations: AppliedAllocation[] }
    >({
      query: ({ eventId, allocations }) => ({
        url: `/events/${eventId}/budget/optimize/apply`,
        method: "POST",
        body: { allocations },
      }),
      invalidatesTags: ["Budget", "Reports", "Dashboard"],
    }),
  }),
});

export const expenseApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listExpenses: b.query<Expense[], number>({
      query: (eventId) => `/events/${eventId}/expenses`,
      providesTags: ["Expenses"],
    }),
    addExpense: b.mutation<Expense, { eventId: number; body: ExpenseInput }>({
      query: ({ eventId, body }) => ({
        url: `/events/${eventId}/expenses`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Expenses", "Budget", "Reports", "Dashboard"],
    }),
    updateExpense: b.mutation<
      Expense,
      { eventId: number; id: number; body: ExpenseInput }
    >({
      query: ({ eventId, id, body }) => ({
        url: `/events/${eventId}/expenses/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Expenses", "Budget", "Reports", "Dashboard"],
    }),
    deleteExpense: b.mutation<void, { eventId: number; id: number }>({
      query: ({ eventId, id }) => ({
        url: `/events/${eventId}/expenses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Expenses", "Budget", "Reports", "Dashboard"],
    }),
  }),
});

export const vendorApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listVendors: b.query<Vendor[], number>({
      query: (eventId) => `/events/${eventId}/vendors`,
      providesTags: ["Vendors"],
    }),
    addVendor: b.mutation<Vendor, { eventId: number; body: VendorInput }>({
      query: ({ eventId, body }) => ({
        url: `/events/${eventId}/vendors`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Vendors", "Reports"],
    }),
    updateVendor: b.mutation<
      Vendor,
      { eventId: number; id: number; body: VendorInput }
    >({
      query: ({ eventId, id, body }) => ({
        url: `/events/${eventId}/vendors/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Vendors", "Reports"],
    }),
    deleteVendor: b.mutation<void, { eventId: number; id: number }>({
      query: ({ eventId, id }) => ({
        url: `/events/${eventId}/vendors/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Vendors", "Reports"],
    }),
  }),
});

export const staffApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listStaff: b.query<Staff[], number>({
      query: (eventId) => `/events/${eventId}/staff`,
      providesTags: ["Staff"],
    }),
    addStaff: b.mutation<Staff, { eventId: number; body: StaffInput }>({
      query: ({ eventId, body }) => ({
        url: `/events/${eventId}/staff`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Staff", "Reports"],
    }),
    updateStaff: b.mutation<
      Staff,
      { eventId: number; id: number; body: StaffInput }
    >({
      query: ({ eventId, id, body }) => ({
        url: `/events/${eventId}/staff/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Staff", "Reports"],
    }),
    deleteStaff: b.mutation<void, { eventId: number; id: number }>({
      query: ({ eventId, id }) => ({
        url: `/events/${eventId}/staff/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Staff", "Reports"],
    }),
  }),
});

export const taskApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listTasks: b.query<Task[], number>({
      query: (eventId) => `/events/${eventId}/tasks`,
      providesTags: ["Tasks"],
    }),
    addTask: b.mutation<Task, { eventId: number; body: TaskInput }>({
      query: ({ eventId, body }) => ({
        url: `/events/${eventId}/tasks`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Tasks", "Reports"],
    }),
    updateTask: b.mutation<
      Task,
      { eventId: number; id: number; body: TaskInput }
    >({
      query: ({ eventId, id, body }) => ({
        url: `/events/${eventId}/tasks/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Tasks", "Reports"],
    }),
    updateTaskStatus: b.mutation<
      Task,
      { eventId: number; id: number; status: TaskStatus }
    >({
      query: ({ eventId, id, status }) => ({
        url: `/events/${eventId}/tasks/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Tasks", "Reports"],
    }),
    deleteTask: b.mutation<void, { eventId: number; id: number }>({
      query: ({ eventId, id }) => ({
        url: `/events/${eventId}/tasks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tasks", "Reports"],
    }),
  }),
});

export const guestApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listGuests: b.query<Guest[], number>({
      query: (eventId) => `/events/${eventId}/guests`,
      providesTags: ["Guests"],
    }),
    addGuest: b.mutation<Guest, { eventId: number; body: GuestInput }>({
      query: ({ eventId, body }) => ({
        url: `/events/${eventId}/guests`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Guests", "Reports", "Dashboard"],
    }),
    updateGuestStatus: b.mutation<
      Guest,
      { eventId: number; id: number; status: GuestStatus }
    >({
      query: ({ eventId, id, status }) => ({
        url: `/events/${eventId}/guests/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Guests", "Reports", "Dashboard"],
    }),
  }),
});

export const publicApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listPublicEvents: b.query<PublicEvent[], void>({
      query: () => `/public/events`,
    }),
    getPublicEvent: b.query<PublicEvent, string>({
      query: (token) => `/public/events/${token}`,
    }),
    registerPublic: b.mutation<
      Guest,
      { token: string; body: { name: string; email: string; phone?: string } }
    >({
      query: ({ token, body }) => ({
        url: `/public/events/${token}/register`,
        method: "POST",
        body,
      }),
    }),
  }),
});

export const reportApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    summaryReport: b.query<SummaryReport, number>({
      query: (eventId) => `/events/${eventId}/reports/summary`,
      providesTags: ["Reports"],
    }),
    budgetReport: b.query<BudgetSummary, number>({
      query: (eventId) => `/events/${eventId}/reports/budget`,
      providesTags: ["Reports", "Budget"],
    }),
    expensesReport: b.query<ExpenseReportData, number>({
      query: (eventId) => `/events/${eventId}/reports/expenses`,
      providesTags: ["Reports"],
    }),
    vendorsReport: b.query<VendorReportData, number>({
      query: (eventId) => `/events/${eventId}/reports/vendors`,
      providesTags: ["Reports"],
    }),
    staffReport: b.query<StaffReportData, number>({
      query: (eventId) => `/events/${eventId}/reports/staff`,
      providesTags: ["Reports"],
    }),
    attendanceReport: b.query<AttendanceReport, number>({
      query: (eventId) => `/events/${eventId}/reports/attendance`,
      providesTags: ["Reports", "Guests"],
    }),
    dailyReport: b.query<DailyReport, { eventId: number; date: string }>({
      query: ({ eventId, date }) => ({
        url: `/events/${eventId}/reports/daily`,
        params: { date },
      }),
      providesTags: ["Reports"],
    }),
    dailyOverview: b.query<DailyOverview, number>({
      query: (eventId) => `/events/${eventId}/reports/daily-overview`,
      providesTags: ["Reports"],
    }),
  }),
});

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getDashboard: b.query<Dashboard, void>({
      query: () => "/dashboard",
      providesTags: ["Dashboard"],
    }),
  }),
});

export const adminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listUsers: b.query<UserInfo[], void>({
      query: () => "/admin/users",
      providesTags: ["Auth"],
    }),
    changeUserRole: b.mutation<UserInfo, { id: number; role: string }>({
      query: ({ id, role }) => ({
        url: `/admin/users/${id}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: ["Auth"],
    }),
    listAuditLogs: b.query<
      AuditLogPage,
      { page?: number; size?: number; action?: string; entityType?: string; userId?: number }
    >({
      query: ({ page = 0, size = 20, action, entityType, userId }) => ({
        url: "/admin/audit-logs",
        params: {
          page,
          size,
          ...(action ? { action } : {}),
          ...(entityType ? { entityType } : {}),
          ...(userId ? { userId } : {}),
        },
      }),
      providesTags: ["AuditLogs"],
    }),
    getAuditLogStats: b.query<AuditLogStats, void>({
      query: () => "/admin/audit-logs/stats",
      providesTags: ["AuditLogs"],
    }),
    getAnalytics: b.query<AnalyticsData, void>({
      query: () => "/admin/analytics",
      providesTags: ["Analytics"],
    }),
    listUserActivity: b.query<UserActivitySummary[], void>({
      query: () => "/admin/users/activity",
      providesTags: ["UserActivity"],
    }),
    getUserActivity: b.query<UserActivityDetail, number>({
      query: (userId) => `/admin/users/${userId}/activity`,
      providesTags: (_r, _e, userId) => [{ type: "UserActivity", id: userId }],
    }),
  }),
});

export const backupApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getBackup: b.query<EventBackup, number>({
      query: (eventId) => `/events/${eventId}/backup`,
      providesTags: (_r, _e, eventId) => [{ type: "Backup", id: eventId }],
    }),
    updateBackup: b.mutation<EventBackup, { eventId: number; body: EventBackupInput }>({
      query: ({ eventId, body }) => ({
        url: `/events/${eventId}/backup`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_r, _e, { eventId }) => [
        { type: "Backup", id: eventId },
        "Reports",
      ],
    }),
  }),
});

export const recoveryPointApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listRecoveryPoints: b.query<RecoveryPoint[], number>({
      query: (eventId) => `/events/${eventId}/recovery-points`,
      providesTags: (_r, _e, eventId) => [{ type: "RecoveryPoints", id: eventId }],
    }),
    createRecoveryPoint: b.mutation<RecoveryPoint, { eventId: number; label: string }>({
      query: ({ eventId, label }) => ({
        url: `/events/${eventId}/recovery-points`,
        method: "POST",
        body: { label },
      }),
      invalidatesTags: (_r, _e, { eventId }) => [
        { type: "RecoveryPoints", id: eventId },
        "Reports",
      ],
    }),
    restoreRecoveryPoint: b.mutation<Event, { eventId: number; recoveryPointId: number }>({
      query: ({ eventId, recoveryPointId }) => ({
        url: `/events/${eventId}/recovery-points/${recoveryPointId}/restore`,
        method: "POST",
      }),
      invalidatesTags: ["Events", "Dashboard"],
    }),
  }),
});

export const logApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listEventLogs: b.query<EventLog[], number>({
      query: (eventId) => `/events/${eventId}/logs`,
      providesTags: (_r, _e, eventId) => [{ type: "Logs", id: eventId }],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
} = authApi;

export const {
  useListEventsQuery,
  useGetEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  usePublishEventMutation,
  useChangeEventStatusMutation,
} = eventsApi;

export const {
  useListCategoriesQuery,
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useBudgetSummaryQuery,
  useOptimizeBudgetMutation,
  useApplyOptimizationMutation,
} = budgetApi;

export const {
  useListExpensesQuery,
  useAddExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} = expenseApi;

export const {
  useListVendorsQuery,
  useAddVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
} = vendorApi;

export const {
  useListStaffQuery,
  useAddStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
} = staffApi;

export const {
  useListTasksQuery,
  useAddTaskMutation,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
  useDeleteTaskMutation,
} = taskApi;

export const {
  useListGuestsQuery,
  useAddGuestMutation,
  useUpdateGuestStatusMutation,
} = guestApi;

export const {
  useListPublicEventsQuery,
  useGetPublicEventQuery,
  useRegisterPublicMutation,
} = publicApi;

export const {
  useSummaryReportQuery,
  useBudgetReportQuery,
  useExpensesReportQuery,
  useVendorsReportQuery,
  useStaffReportQuery,
  useAttendanceReportQuery,
  useDailyReportQuery,
  useDailyOverviewQuery,
} = reportApi;

export const { useGetDashboardQuery } = dashboardApi;

export const {
  useListUsersQuery,
  useChangeUserRoleMutation,
  useListAuditLogsQuery,
  useGetAuditLogStatsQuery,
  useGetAnalyticsQuery,
  useListUserActivityQuery,
  useGetUserActivityQuery,
} = adminApi;

export const { useGetBackupQuery, useUpdateBackupMutation } = backupApi;

export const {
  useListRecoveryPointsQuery,
  useCreateRecoveryPointMutation,
  useRestoreRecoveryPointMutation,
} = recoveryPointApi;

export const { useListEventLogsQuery } = logApi;

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listNotifications: b.query<AppNotification[], void>({
      query: () => `/notifications`,
      providesTags: ["Notifications"],
    }),
    getUnreadNotificationCount: b.query<{ count: number }, void>({
      query: () => `/notifications/unread-count`,
      providesTags: ["Notifications"],
    }),
    markNotificationRead: b.mutation<AppNotification, number>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["Notifications"],
    }),
    markAllNotificationsRead: b.mutation<number, void>({
      query: () => ({ url: `/notifications/read-all`, method: "POST" }),
      invalidatesTags: ["Notifications"],
    }),
    deleteNotification: b.mutation<void, number>({
      query: (id) => ({ url: `/notifications/${id}`, method: "DELETE" }),
      invalidatesTags: ["Notifications"],
    }),
    clearNotifications: b.mutation<void, void>({
      query: () => ({ url: `/notifications`, method: "DELETE" }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useListNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useClearNotificationsMutation,
} = notificationApi;
