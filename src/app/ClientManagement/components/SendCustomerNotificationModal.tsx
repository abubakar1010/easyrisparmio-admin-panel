import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Form, Input, Modal, Select, Spin, Tooltip, message } from "antd";
import { FiSend, FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useSendNotificationMutation } from "../../../redux/features/Notifications/notificationApi";
import {
  useGetNotificationTemplatesQuery,
  useGetTemplateVariablesQuery,
  usePreviewNotificationMutation,
  type INotificationPreview,
} from "../../../redux/features/Notifications/notificationTemplateApi";
import { useGetCasesQuery } from "../../../redux/features/Cases/caseApi";
import type { IClient } from "../types";

interface SendCustomerNotificationModalProps {
  isOpen: boolean;
  client: IClient | null;
  onClose: () => void;
}

/**
 * Composes a one-off message to a single customer.
 *
 * Deliberately separate from the notification centre's composer: this one is
 * reached from the customer's own profile and is locked to that customer, and
 * it adds templates, placeholders and a preview on top. It sends no dedupe key,
 * so an admin can send the same text twice on purpose.
 *
 * Nothing here renders `{{...}}` itself. The palette comes from the server's
 * registry and the preview from `POST /notification-templates/preview`, so the
 * text an admin approves is the text the customer receives — this file used to
 * carry its own copy of the substitution regex, which is one edit away from a
 * preview that quietly disagrees with what was delivered.
 */
const SendCustomerNotificationModal = ({
  isOpen,
  client,
  onClose,
}: SendCustomerNotificationModalProps) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();

  const [templateId, setTemplateId] = useState<string | undefined>();
  const [caseId, setCaseId] = useState<string | undefined>();
  const [preview, setPreview] = useState<INotificationPreview | null>(null);

  const [sendNotification, { isLoading }] = useSendNotificationMutation();
  const [previewNotification, { isLoading: isPreviewing }] =
    usePreviewNotificationMutation();

  const { data: variables } = useGetTemplateVariablesQuery();
  const { data: templateData } = useGetNotificationTemplatesQuery(
    { isActive: true, limit: 100 },
    { skip: !isOpen },
  );
  const { data: caseData } = useGetCasesQuery(
    { userId: client?.id, limit: 50 },
    { skip: !isOpen || !client?.id },
  );

  const templates = templateData?.data || [];
  const cases = caseData?.data || [];

  const title = Form.useWatch("title", form) as string | undefined;
  const body = Form.useWatch("body", form) as string | undefined;

  const hasPlaceholders = Boolean(
    title?.includes("{{") || body?.includes("{{"),
  );

  /** Case variables are the only ones that need a supply picked. */
  const caseScopedKeys = useMemo(
    () => (variables || []).filter((v) => v.scope === "case").map((v) => v.key),
    [variables],
  );

  const usesCaseVariables = useMemo(
    () =>
      caseScopedKeys.some((key) =>
        new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`).test(`${title || ""} ${body || ""}`),
      ),
    [caseScopedKeys, title, body],
  );

  const runPreview = useCallback(async () => {
    // The server requires both fields, so previewing a half-written message
    // would only round-trip a validation error.
    if (!client || !hasPlaceholders || !title || !body) {
      setPreview(null);
      return;
    }
    try {
      const result = await previewNotification({
        userId: client.id,
        title: title || "",
        body: body || "",
        caseId,
      }).unwrap();
      setPreview(result);
    } catch {
      // A preview that cannot be fetched must not block composing; the server
      // validates again on send, so the worst case is losing the warning.
      setPreview(null);
    }
  }, [client, hasPlaceholders, previewNotification, title, body, caseId]);

  // Debounced so a preview is not requested on every keystroke.
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(runPreview, 400);
    return () => clearTimeout(timer);
  }, [isOpen, runPreview]);

  useEffect(() => {
    if (!isOpen) {
      form.resetFields();
      setTemplateId(undefined);
      setCaseId(undefined);
      setPreview(null);
    }
  }, [isOpen, form]);

  // Default to the most recent case, which is what the server would pick anyway.
  useEffect(() => {
    if (!caseId && cases.length) setCaseId(cases[0].id);
  }, [cases, caseId]);

  const unresolved = preview?.unresolved || [];
  const blocked = unresolved.length > 0;

  const handleTemplateChange = (value: string | undefined) => {
    setTemplateId(value);
    const template = templates.find((tpl) => tpl.id === value);
    if (template) {
      form.setFieldsValue({ title: template.title, body: template.body });
    }
  };

  const handleFinish = async (values: { title: string; body: string }) => {
    if (!client) return;
    const template = templates.find((tpl) => tpl.id === templateId);
    try {
      await sendNotification({
        userId: client.id,
        title: values.title,
        body: values.body,
        // The template owns the type; a hand-written message is always general.
        type: template?.type || "general",
        templateId,
        caseId: usesCaseVariables ? caseId : undefined,
      }).unwrap();
      message.success(t("notifications.sent_success"));
      form.resetFields();
      setTemplateId(undefined);
      setPreview(null);
      onClose();
    } catch (err: any) {
      message.error(
        err?.data?.message?.[0] || t("notifications.sent_error"),
      );
    }
  };

  const recipient = client
    ? `${client.firstName || ""} ${client.lastName || ""}`.trim() || client.email
    : "";

  const insertPlaceholder = (token: string) => {
    const current = (form.getFieldValue("body") as string) || "";
    form.setFieldValue("body", `${current}{{${token}}}`);
  };

  const labelClass =
    "text-xs font-bold uppercase tracking-wider text-slate-500";

  return (
    <Modal
      title={
        <div className="py-2">
          <h2 className="text-xl font-bold text-slate-800">
            {t("notifications.send_notification")}
          </h2>
          {recipient && (
            <p className="mt-0.5 text-sm font-normal text-slate-500">
              {recipient}
            </p>
          )}
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnClose
      closeIcon={
        <FiX className="h-5 w-5 text-slate-400 transition-colors hover:text-slate-600" />
      }
      className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-slate-100 [&_.ant-modal-header]:pb-4"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="mt-6 space-y-1"
        requiredMark={false}
      >
        <Form.Item
          label={<span className={labelClass}>{t("notifications.template")}</span>}
          extra={
            <span className="text-xs text-slate-400">
              {t("notifications.template_hint")}
            </span>
          }
        >
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            value={templateId}
            onChange={handleTemplateChange}
            placeholder={t("notifications.select_template")}
            className="[&_.ant-select-selector]:!h-10 [&_.ant-select-selector]:!rounded-lg"
            options={templates.map((tpl) => ({
              value: tpl.id,
              label: tpl.name,
              title: tpl.description || tpl.name,
            }))}
          />
        </Form.Item>

        <Form.Item
          label={
            <span className={labelClass}>
              {t("notifications.notification_title")}
            </span>
          }
          name="title"
          rules={[
            { required: true, message: t("notifications.notification_title") },
          ]}
        >
          <Input maxLength={255} className="h-10 rounded-lg border-slate-200" />
        </Form.Item>

        <Form.Item
          label={
            <span className={labelClass}>
              {t("notifications.notification_body")}
            </span>
          }
          name="body"
          rules={[
            { required: true, message: t("notifications.notification_body") },
          ]}
        >
          <Input.TextArea rows={5} className="rounded-lg border-slate-200" />
        </Form.Item>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">
            {t("notifications.placeholders_hint")}
          </span>
          {(variables || []).map((variable) => (
            <Tooltip
              key={variable.key}
              title={`${variable.label} — ${variable.example}`}
            >
              <button
                type="button"
                onClick={() => insertPlaceholder(variable.key)}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-mono text-xs text-slate-600 transition-colors hover:border-[#8b85f6] hover:text-[#7a74e5]"
              >
                {`{{${variable.key}}}`}
              </button>
            </Tooltip>
          ))}
        </div>

        {usesCaseVariables && (
          <Form.Item
            className="mt-4"
            label={
              <span className={labelClass}>{t("notifications.context_case")}</span>
            }
            extra={
              <span className="text-xs text-slate-400">
                {t("notifications.context_case_hint")}
              </span>
            }
          >
            <Select
              value={caseId}
              onChange={setCaseId}
              placeholder={t("notifications.context_case")}
              className="[&_.ant-select-selector]:!h-10 [&_.ant-select-selector]:!rounded-lg"
              options={cases.map((item: any) => ({
                value: item.id,
                label: item.caseNumber || item.id.slice(0, 8),
              }))}
            />
          </Form.Item>
        )}

        {blocked && (
          <Alert
            type="warning"
            showIcon
            className="mt-4 rounded-xl"
            message={t("notifications.unresolved_title")}
            description={
              <div className="space-y-1">
                <p className="text-xs text-slate-600">
                  {t("notifications.unresolved_hint")}
                </p>
                <p className="font-mono text-xs text-amber-700">
                  {unresolved.map((key) => `{{${key}}}`).join("  ")}
                </p>
              </div>
            }
          />
        )}

        {hasPlaceholders && (
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t("notifications.preview")}
              </p>
              {isPreviewing && <Spin size="small" />}
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {preview?.title ?? title}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
              {preview?.body ?? body}
            </p>
            {preview?.context?.caseNumber && (
              <p className="mt-2 text-xs text-slate-400">
                {t("notifications.preview_context", {
                  caseNumber: preview.context.caseNumber,
                })}
              </p>
            )}
          </div>
        )}

        <div className="pt-4">
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={isLoading}
            disabled={blocked}
            icon={<FiSend className="h-4 w-4" />}
            className="h-12 rounded-xl border-0 bg-[#8b85f6] text-base font-bold shadow-lg shadow-indigo-100 hover:bg-[#7a74e5] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            {t("notifications.send")}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default SendCustomerNotificationModal;
