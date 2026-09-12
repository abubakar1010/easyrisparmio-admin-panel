import type { IconType } from "react-icons";
import {
  LuCalendarClock,
  LuClipboardCheck,
  LuFileCheck,
  LuFileWarning,
  LuMailWarning,
  LuPhone,
  LuSend,
  LuTriangleAlert,
} from "react-icons/lu";
import type { PriorityTaskCategory } from "../redux/features/Dashboard/dashboardApi";

/**
 * How each priority-task bucket looks. The buckets themselves — which statuses
 * belong to which, and in what order they matter — are defined on the server;
 * this is only the paint, shared by the dashboard card and the task list so a
 * bucket looks the same wherever the admin meets it.
 */
export type PriorityTaskPresentation = {
  icon: IconType;
  labelKey: string;
  descKey: string;
  /** Row background and border on the dashboard card. */
  bg: string;
  border: string;
  iconColor: string;
  /** Ant Design `Tag` colour for the task-list table. */
  tagColor: string;
};

export const PRIORITY_TASK_UI: Record<
  PriorityTaskCategory,
  PriorityTaskPresentation
> = {
  analysis_failed: {
    icon: LuTriangleAlert,
    labelKey: "priority_tasks.analysis_failed",
    descKey: "priority_tasks.analysis_failed_desc",
    bg: "bg-red-50",
    border: "border-red-100",
    iconColor: "text-red-600",
    tagColor: "red",
  },
  pending_validation: {
    icon: LuClipboardCheck,
    labelKey: "dashboard.pending_validation",
    descKey: "dashboard.awaiting_approval",
    bg: "bg-amber-50",
    border: "border-amber-100",
    iconColor: "text-amber-700",
    tagColor: "gold",
  },
  email_bill_requests: {
    icon: LuMailWarning,
    labelKey: "priority_tasks.email_bill_requests",
    descKey: "priority_tasks.email_bill_requests_desc",
    bg: "bg-violet-50",
    border: "border-violet-100",
    iconColor: "text-violet-600",
    tagColor: "purple",
  },
  missing_documents: {
    icon: LuFileWarning,
    labelKey: "dashboard.missing_documents",
    descKey: "priority_tasks.missing_documents_desc",
    bg: "bg-orange-50",
    border: "border-orange-100",
    iconColor: "text-orange-600",
    tagColor: "volcano",
  },
  offers_to_send: {
    icon: LuSend,
    labelKey: "priority_tasks.offers_to_send",
    descKey: "priority_tasks.offers_to_send_desc",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    iconColor: "text-emerald-600",
    tagColor: "green",
  },
  expiring_contracts: {
    icon: LuCalendarClock,
    labelKey: "dashboard.expiring_contracts",
    descKey: "dashboard.within_30_days",
    bg: "bg-rose-50",
    border: "border-rose-100",
    iconColor: "text-rose-600",
    tagColor: "magenta",
  },
  contracts_to_process: {
    icon: LuFileCheck,
    labelKey: "priority_tasks.contracts_to_process",
    descKey: "priority_tasks.contracts_to_process_desc",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    iconColor: "text-indigo-600",
    tagColor: "geekblue",
  },
  follow_up_required: {
    icon: LuPhone,
    labelKey: "dashboard.follow_up_required",
    descKey: "dashboard.customer_contact_needed",
    bg: "bg-sky-50",
    border: "border-sky-100",
    iconColor: "text-sky-600",
    tagColor: "cyan",
  },
};

/** Unknown bucket — a server that has grown a category this build never heard of. */
export const FALLBACK_PRIORITY_TASK_UI: PriorityTaskPresentation = {
  icon: LuClipboardCheck,
  labelKey: "priority_tasks.other",
  descKey: "priority_tasks.other_desc",
  bg: "bg-gray-50",
  border: "border-gray-100",
  iconColor: "text-gray-600",
  tagColor: "default",
};

export const getPriorityTaskUi = (
  category: PriorityTaskCategory,
): PriorityTaskPresentation =>
  PRIORITY_TASK_UI[category] ?? FALLBACK_PRIORITY_TASK_UI;
