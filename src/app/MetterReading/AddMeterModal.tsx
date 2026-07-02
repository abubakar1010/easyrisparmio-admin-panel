import { useEffect } from "react";
import { Button, Form, Input, Modal, Select, Switch, message } from "antd";
import { useCreateMeterMutation } from "../../redux/features/Meters/metersApi";
import type { UtilityType } from "./types";
import { utilityTypeLabels } from "./types";

type AddMeterModalProps = {
  open: boolean;
  onClose: () => void;
};

const AddMeterModal = ({ open, onClose }: AddMeterModalProps) => {
  const [form] = Form.useForm();
  const [createMeter, { isLoading: isCreating }] = useCreateMeterMutation();

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      await createMeter({
        utilityType: values.utilityType as UtilityType,
        name: values.name as string,
        description: (values.description as string) || undefined,
        isActive: values.isActive as boolean | undefined,
      }).unwrap();
      message.success("Service type created successfully");
      handleClose();
    } catch (err: unknown) {
      const error = err as { data?: { message?: string | string[] } };
      const msg = Array.isArray(error?.data?.message)
        ? error.data.message[0]
        : error?.data?.message || "Failed to create service type";
      message.error(msg);
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open, form]);

  return (
    <Modal
      title={<span className="text-xl font-bold text-slate-800">Add Service Type</span>}
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
        initialValues={{ isActive: true }}
      >
        <Form.Item
          label={<span className="text-sm font-medium text-slate-600">Name</span>}
          name="name"
          rules={[{ required: true, message: "Please enter a name" }]}
        >
          <Input
            size="large"
            placeholder="e.g. Electricity"
            className="rounded-lg"
            maxLength={100}
          />
        </Form.Item>

        <Form.Item
          label={<span className="text-sm font-medium text-slate-600">Utility Type</span>}
          name="utilityType"
          rules={[{ required: true, message: "Please select a utility type" }]}
        >
          <Select
            placeholder="Select utility type"
            size="large"
            className="rounded-lg"
            options={Object.entries(utilityTypeLabels).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </Form.Item>

        <Form.Item
          label={<span className="text-sm font-medium text-slate-600">Description</span>}
          name="description"
        >
          <Input.TextArea
            size="large"
            placeholder="Brief description of this service type"
            className="rounded-lg"
            rows={3}
          />
        </Form.Item>

        <Form.Item
          label={<span className="text-sm font-medium text-slate-600">Active</span>}
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
            Cancel
          </Button>
          <Button
            size="large"
            type="primary"
            htmlType="submit"
            loading={isCreating}
            className="bg-[#646cff] hover:bg-[#535bf2] rounded-lg px-8 font-medium border-0 shadow-sm"
          >
            Add Service Type
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddMeterModal;
