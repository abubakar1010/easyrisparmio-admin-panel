import i18n from "../../../i18n";
import { Modal, Button, Form, Input, InputNumber, Switch } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { ISupportTopic } from "../../../redux/features/Support/supportApi";

interface AddEditTopicModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (values: {
    name: string;
    description?: string;
    sortOrder: number;
    icon?: string;
    isActive: boolean;
  }) => void;
  initialValues?: ISupportTopic | null;
  isLoading?: boolean;
}

const AddEditTopicModal = ({
  visible,
  onCancel,
  onSave,
  initialValues,
  isLoading,
}: AddEditTopicModalProps) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue({
          name: initialValues.name,
          description: initialValues.description || "",
          sortOrder: initialValues.sortOrder ?? 0,
          icon: initialValues.icon || "",
          isActive: initialValues.isActive ?? true,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ sortOrder: 0, isActive: true });
      }
    }
  }, [visible, initialValues, form]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSave(values);
    });
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      centered
      destroyOnClose
      className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-8"
      title={
        <div className="text-center mb-6">
          <h3 className="text-[24px] font-bold text-slate-800">
            {initialValues ? t("support_topics.edit") : t("support_topics.add")}
          </h3>
        </div>
      }
    >
      <Form form={form} layout="vertical" className="space-y-4">
        <Form.Item
          name="name"
          label={<span className="text-sm font-medium text-slate-500">{t("support_topics.name")} <span className="text-red-500">*</span></span>}
          rules={[
            { required: true, message: t("support_topics.topic_name_required") },
            { max: 100, message: t("support_topics.maximum_100") },
          ]}
          className="mb-0"
        >
          <Input
            placeholder={t("support_topics.name_example")}
            className="h-11 rounded-xl border-slate-200"
            maxLength={100}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label={<span className="text-sm font-medium text-slate-500">{t("support_topics.description")}</span>}
          className="mb-0"
        >
          <Input.TextArea
            rows={3}
            placeholder={t("support_topics.description_hint")}
            className="rounded-xl border-slate-200"
            maxLength={500}
          />
        </Form.Item>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Form.Item
            name="sortOrder"
            label={<span className="text-sm font-medium text-slate-500">{t("support_topics.sort_order")}</span>}
            className="mb-0"
          >
            <InputNumber
              min={0}
              placeholder="0"
              className="w-full h-11 rounded-xl border-slate-200 [&_input]:h-11"
            />
          </Form.Item>

          <Form.Item
            name="icon"
            label={<span className="text-sm font-medium text-slate-500">{t("support_topics.icon")}</span>}
            className="mb-0"
          >
            <Input
              placeholder={i18n.t("audit.e_g_receipt")}
              className="h-11 rounded-xl border-slate-200"
              maxLength={50}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label={<span className="text-sm font-medium text-slate-500">{t("common.active")}</span>}
            valuePropName="checked"
            className="mb-0"
          >
            <Switch />
          </Form.Item>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            onClick={onCancel}
            className="flex-1 h-14 rounded-2xl bg-[#FFF1F1] border-none text-[#FF4D4F] font-bold text-lg hover:bg-[#FFE4E4]! order-2 sm:order-1"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isLoading}
            className="flex-1 h-14 rounded-2xl bg-[#8b85f6] border-none text-white font-bold text-lg hover:bg-[#7a74e5]! order-1 sm:order-2"
          >
            {t("common.save")}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddEditTopicModal;
