"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import AppShell from "../../components/AppShell";
import {
  useChangeUserRoleMutation,
  useListUsersQuery,
} from "../../lib/apiSlices";
import {
  Card,
  CardHeader,
  EmptyState,
  Select,
  Spinner,
  StatusBadge,
  formatDate,
} from "../../components/ui";

export default function AdminPage() {
  return (
    <ProtectedRoute roles={["ADMIN"]}>
      <AppShell>
        <AdminContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function AdminContent() {
  const { data: users, isLoading } = useListUsersQuery();
  const [changeRole] = useChangeUserRoleMutation();

  if (isLoading || !users) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Admin</h1>
        <p className="text-sm text-slate-500">
          Manage system users and roles.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Users"
          subtitle={`${users.length} registered user(s)`}
        />
        {users.length === 0 ? (
          <EmptyState title="No users" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Registered</th>
                  <th className="pb-2 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium text-slate-800">
                      {u.fullName}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{u.email}</td>
                    <td className="py-3 pr-4 text-slate-600">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={u.role} />
                        <Select
                          value={u.role}
                          onChange={(e) =>
                            changeRole({ id: u.id, role: e.target.value })
                          }
                          className="w-32 px-2 py-1 text-xs"
                        >
                          <option value="ORGANIZER">Organizer</option>
                          <option value="ADMIN">Admin</option>
                        </Select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
