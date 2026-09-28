import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, Form, Input, Modal, Select, Switch, message } from "antd";
import { useCreateMeterMutation } from "../../redux/features/Meters/metersApi";
import type { UtilityType } from "./types";
import { utilityTypeLabels } from "./types";

type AddMeterModalProps = {
  open: boolean;
  onClose: () => void;
};

const AddMeterModal = ({ open, onClose }: AddMeterModalProps) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [createMeter, { isLoading: isCreating }] = useCreateMeterMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitError(null);
    try {
      await createMeter({
        utilityType: values.utilityType as UtilityType,
        name: values.name as string,
        description: (values.description as string) || undefined,
        isActive: values.isActive as boolean | undefined,
      }).unwrap();
      message.success(t("service_types.created_successfully"));
      handleClose();
    } catch (err: unknown) {
      const error = err as {
        status?: number;
        data?: { message?: string | string[] };
        message?: string;
      };
      const apiMessages = Array.isArray(error?.data?.message)
        ? error.data.message
        : [error?.data?.message || error?.message || ""];
      const isDuplicateUtility =
        error?.status === 409 ||
        apiMessages.some((apiMessage) =>
          apiMessage.toLowerCase().includes("service type with this utility type already exists"),
        );
      const msg = isDuplicateUtility
        ? t("service_types.duplicate_utility")
        : t("service_types.create_failed");
      setSubmitError(msg);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setSubmitError(null);
    onClose();
  };

  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open, form]);

  return (
    <Modal
      title={<span className="text-xl font-bold text-slate-800">{t("service_types.add")}</span>}
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnClose
      className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-6"
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-6"
        onFinish={handleSubmit}
        onValuesChange={() => setSubmitError(null)}
        initialValues={{ isActive: true }}
      >
        {submitError && (
          <Alert
            type="error"
            showIcon
            role="alert"
            message={submitError}
            className="mb-5 rounded-lg"
          />
        )}
        <Form.Item
          label={<span className="text-sm font-medium text-slate-600">{t("support_topics.name")}</span>}
          name="name"
          rules={[{ required: true, message: t("service_types.name_required") }]}
        >
          <Input
            size="large"
            placeholder={t("service_types.name_example")}
            className="rounded-lg"
            maxLength={100}
          />
        </Form.Item>

        <Form.Item
          label={<span className="text-sm font-medium text-slate-600">{t("service_types.utility_type")}</span>}
          name="utilityType"
          rules={[{ required: true, message: t("service_types.utility_required") }]}
        >
          <Select
            placeholder={t("service_types.select_utility")}
            size="large"
            className="rounded-lg"
            options={Object.entries(utilityTypeLabels).map(([value]) => ({
              value,
              label: t(`service_types.${value}`),
            }))}
          />
        </Form.Item>

        <Form.Item
          label={<span className="text-sm font-medium text-slate-600">{t("support_topics.description")}</span>}
          name="description"
        >
          <Input.TextArea
            size="large"
            placeholder={t("service_types.description_hint")}
            className="rounded-lg"
            rows={3}
          />
        </Form.Item>

        <Form.Item
          label={<span className="text-sm font-medium text-slate-600">{t("common.active")}</span>}
          name="isActive"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-slate-100">
          <Button
            size="large"
            onClick={handleClose}
            className="rounded-lg px-6 font-medium text-slate-700"
          >
            {t("common.cancel")}
          </Button>
          <Button
            size="large"
            type="primary"
            htmlType="submit"
            loading={isCreating}
            className="bg-[#646cff] hover:bg-[#535bf2] rounded-lg px-8 font-medium border-0 shadow-sm"
          >
            {t("service_types.add")}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddMeterModal;
