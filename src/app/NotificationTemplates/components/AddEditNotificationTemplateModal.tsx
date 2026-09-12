import { useEffect, useRef, useState } from "react";
import { Button, Form, Input, Modal, Select, Switch, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import {
  useGetTemplateVariablesQuery,
  type INotificationTemplate,
  type INotificationTemplatePayload,
} from "../../../redux/features/Notifications/notificationTemplateApi";
import { CUSTOMER_NOTIFICATION_TYPES } from "../../../redux/features/Notifications/notificationApi";
import { CATEGORY_OPTIONS } from "../constants";

type Props = {
  visible: boolean;
  onCancel: () => void;
  onSave: (values: INotificationTemplatePayload) => void;
  initialValues: INotificationTemplate | null;
  isLoading: boolean;
};

const labelClass = "text-xs font-bold uppercase tracking-wider text-slate-500";
const inputClass = "h-11 rounded-xl border-slate-200";
const selectClass =
  "[&_.ant-select-selector]:!h-11 [&_.ant-select-selector]:!rounded-xl [&_.ant-select-selector]:!items-center";

const AddEditNotificationTemplateModal = ({
  visible,
  onCancel,
  onSave,
  initialValues,
  isLoading,
}: Props) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const { data: variables } = useGetTemplateVariablesQuery();

  /** Which field a chip should insert into — whichever was focused last. */
  const activeField = useRef<"title" | "body">("body");
  const [showExample, setShowExample] = useState(false);

  const title = Form.useWatch("title", form) as string | undefined;
  const body = Form.useWatch("body", form) as string | undefined;

  useEffect(() => {
    if (!visible) return;
    if (initialValues) {
      form.setFieldsValue({
        name: initialValues.name,
        description: initialValues.description,
        category: initialValues.category,
        type: initialValues.type,
        title: initialValues.title,
        body: initialValues.body,
        isActive: initialValues.isActive,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ category: "custom", type: "general", isActive: true });
    }
    activeField.current = "body";
  }, [visible, initialValues, form]);

  const insertVariable = (key: string) => {
    const field = activeField.current;
    const current = (form.getFieldValue(field) as string) || "";
    form.setFieldValue(field, `${current}{{${key}}}`);
  };

  /**
   * An illustrative preview, not the real one.
   *
   * There is no recipient here, so this substitutes each variable's example from
   * the server registry — enough to show whether the sentence reads well. The
   * per-customer preview lives in the composer, where there is someone to render
   * against.
   */
  const exampleOf = (text: string | undefined) => {
    if (!text || !variables) return text || "";
    return text.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (match, key) => {
      const variable = variables.find((v) => v.key === key);
      return variable ? variable.example : match;
    });
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => onSave(values));
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={640}
      centered
      destroyOnClose
      title={
        <h2 className="py-2 text-xl font-bold text-slate-800">
          {initialValues
            ? t("notification_templates.edit")
            : t("notification_templates.add")}
        </h2>
      }
      className="[&_.ant-modal-content]:rounded-2xl"
    >
      <Form form={form} layout="vertical" requiredMark={false} className="mt-4">
        <Form.Item
          label={<span className={labelClass}>{t("notification_templates.name")}</span>}
          name="name"
          rules={[{ required: true, message: t("notification_templates.name") }]}
        >
          <Input maxLength={120} className={inputClass} />
        </Form.Item>

        <Form.Item
          label={
            <span className={labelClass}>
              {t("notification_templates.description")}
            </span>
          }
          name="description"
        >
          <Input maxLength={255} className={inputClass} />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label={
              <span className={labelClass}>{t("notification_templates.category")}</span>
            }
            name="category"
          >
            <Select
              className={selectClass}
              options={CATEGORY_OPTIONS.map((option) => ({
                value: option.value,
                label: t(option.labelKey),
              }))}
            />
          </Form.Item>

          <Form.Item
            label={
              <span className={labelClass}>
                {t("notification_templates.notification_type")}
              </span>
            }
            name="type"
          >
            <Select
              className={selectClass}
              options={CUSTOMER_NOTIFICATION_TYPES.map((value) => ({
                value,
                label: t(`notifications.type_${value}`, {
                  defaultValue: value.replace(/_/g, " "),
                }),
              }))}
            />
          </Form.Item>
        </div>

        <Form.Item
          label={
            <span className={labelClass}>
              {t("notification_templates.template_title")}
            </span>
          }
          name="title"
          rules={[
            { required: true, message: t("notification_templates.template_title") },
          ]}
        >
          <Input
            maxLength={255}
            className={inputClass}
            onFocus={() => (activeField.current = "title")}
          />
        </Form.Item>

        {/*
          Plain text, not a rich-text editor: the body becomes the FCM
          notification body and the mobile inbox renders it as a plain string,
          so HTML would be delivered to the customer as visible markup.
        */}
        <Form.Item
          label={
            <span className={labelClass}>
              {t("notification_templates.template_body")}
            </span>
          }
          name="body"
          rules={[
            { required: true, message: t("notification_templates.template_body") },
          ]}
        >
          <Input.TextArea
            rows={5}
            className="rounded-xl border-slate-200"
            onFocus={() => (activeField.current = "body")}
          />
        </Form.Item>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">
            {t("notification_templates.variables")}
          </span>
          {(variables || []).map((variable) => (
            <Tooltip
              key={variable.key}
              title={`${variable.description} (${variable.example})`}
            >
              <button
                type="button"
                onClick={() => insertVariable(variable.key)}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-mono text-xs text-slate-600 transition-colors hover:border-[#8b85f6] hover:text-[#7a74e5]"
              >
                {`{{${variable.key}}}`}
              </button>
            </Tooltip>
          ))}
        </div>

        {(title?.includes("{{") || body?.includes("{{")) && (
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <button
              type="button"
              onClick={() => setShowExample((prev) => !prev)}
              className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600"
            >
              {t("notification_templates.example_preview")}
            </button>
            {showExample && (
              <>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {exampleOf(title)}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                  {exampleOf(body)}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {t("notification_templates.example_preview_hint")}
                </p>
              </>
            )}
          </div>
        )}

        <Form.Item
          label={<span className={labelClass}>{t("notification_templates.active")}</span>}
          name="isActive"
          valuePropName="checked"
          className="mt-4"
        >
          <Switch />
        </Form.Item>

        <div className="mt-2 flex gap-3">
          <Button
            onClick={onCancel}
            className="h-12 flex-1 rounded-2xl border-0 bg-pink-50 font-semibold text-pink-500 hover:bg-pink-100"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="primary"
            loading={isLoading}
            onClick={handleSubmit}
            className="h-12 flex-1 rounded-2xl border-0 bg-[#8b85f6] font-bold hover:bg-[#7a74e5]"
          >
            {t("common.save")}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddEditNotificationTemplateModal;
