import { Modal, Button, Form, Input, InputNumber, Switch } from "antd";
import { useEffect } from "react";
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
            {initialValues ? "Edit Topic" : "Add Topic"}
          </h3>
        </div>
      }
    >
      <Form form={form} layout="vertical" className="space-y-4">
        <Form.Item
          name="name"
          label={<span className="text-sm font-medium text-slate-500">Name <span className="text-red-500">*</span></span>}
          rules={[
            { required: true, message: "Please enter a topic name" },
            { max: 100, message: "Maximum 100 characters" },
          ]}
          className="mb-0"
        >
          <Input
            placeholder="e.g. Billing & Payments"
            className="h-11 rounded-xl border-slate-200"
            maxLength={100}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label={<span className="text-sm font-medium text-slate-500">Description</span>}
          className="mb-0"
        >
          <Input.TextArea
            rows={3}
            placeholder="Brief description of this topic..."
            className="rounded-xl border-slate-200"
            maxLength={500}
          />
        </Form.Item>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Form.Item
            name="sortOrder"
            label={<span className="text-sm font-medium text-slate-500">Sort Order</span>}
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
            label={<span className="text-sm font-medium text-slate-500">Icon</span>}
            className="mb-0"
          >
            <Input
              placeholder="e.g. receipt"
              className="h-11 rounded-xl border-slate-200"
              maxLength={50}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label={<span className="text-sm font-medium text-slate-500">Active</span>}
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
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isLoading}
            className="flex-1 h-14 rounded-2xl bg-[#8b85f6] border-none text-white font-bold text-lg hover:bg-[#7a74e5]! order-1 sm:order-2"
          >
            Save
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddEditTopicModal;
