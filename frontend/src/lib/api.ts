import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("embos_token");
}

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: [
    "Auth",
    "Events",
    "Event",
    "Budget",
    "Expenses",
    "Vendors",
    "Staff",
    "Tasks",
    "Guests",
    "Reports",
    "Dashboard",
    "Backup",
    "RecoveryPoints",
    "Logs",
    "Notifications",
  ],
  endpoints: () => ({}),
});
