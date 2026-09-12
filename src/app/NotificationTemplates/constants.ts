import type { TemplateCategory } from "../../redux/features/Notifications/notificationTemplateApi";

/** i18n keys, not literals — this page follows the Notification module. */
export const categoryLabelKey: Record<TemplateCategory, string> = {
  promotional: "notification_templates.category_promotional",
  document_request: "notification_templates.category_document_request",
  case_update: "notification_templates.category_case_update",
  custom: "notification_templates.category_custom",
};

export const categoryColor: Record<TemplateCategory, string> = {
  promotional: "green",
  document_request: "gold",
  case_update: "geekblue",
  custom: "default",
};

export const CATEGORY_OPTIONS = (
  Object.keys(categoryLabelKey) as TemplateCategory[]
).map((value) => ({ value, labelKey: categoryLabelKey[value] }));
