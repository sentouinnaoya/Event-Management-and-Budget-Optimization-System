"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../lib/hooks";
import { PageLoader } from "./ui";

export default function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const { user, initialized } = useAppSelector((s) => s.auth);
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      router.replace("/login");
    } else if (roles && !roles.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [initialized, user, roles, router]);

  if (!initialized || !user) return <PageLoader />;
  if (roles && !roles.includes(user.role)) return <PageLoader />;
  return <>{children}</>;
}
