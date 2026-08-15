import {
  AlertTriangle,
  Bell,
  ClipboardList,
  History,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import type { NotificationType } from "../lib/types";

const typeIcon: Record<NotificationType, typeof Bell> = {
  GUEST_REGISTERED: UserPlus,
  BUDGET_CATEGORY_EXCEEDED: AlertTriangle,
  BUDGET_EXCEEDED: AlertTriangle,
  EVENT_STATUS_CHANGED: RefreshCw,
  TASK_ASSIGNED: ClipboardList,
  RECOVERY_POINT_RESTORED: History,
};

export default function NotificationIcon({
  type,
  className,
}: {
  type: NotificationType;
  className?: string;
}) {
  const Icon = typeIcon[type] ?? Bell;
  return <Icon className={className} />;
}
