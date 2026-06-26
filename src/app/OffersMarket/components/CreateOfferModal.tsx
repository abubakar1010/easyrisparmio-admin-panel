import { Button, DatePicker, Form, Input, InputNumber, Modal, Select } from "antd";

type CreateOfferModalProps = {
  open: boolean;
  onClose: () => void;
};

export const CreateOfferModal = ({ open, onClose }: CreateOfferModalProps) => {
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form.resetFields();
    onClose();
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      centered
      width="min(860px, calc(100vw - 24px))"
      title={<span className="text-xl! font-bold text-slate-800">Create New Offer</span>}
      className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-4 sm:[&_.ant-modal-content]:p-6 [&_.ant-modal-header]:rounded-t-2xl [&_.ant-modal-body]:pt-3"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="pt-1"
      >
        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
          <Form.Item
            name="offerName"
            label="Offer Name"
            rules={[{ required: true, message: "Please enter offer name" }]}
          >
            <Input placeholder="e.g. Trend Home Electricity" className="h-11 rounded-lg" />
          </Form.Item>

          <Form.Item
            name="offerCode"
            label="Offer Code"
            rules={[{ required: true, message: "Please enter offer code" }]}
          >
            <Input placeholder="e.g. OFF-007" className="h-11 rounded-lg" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
          <Form.Item
            name="supplier"
            label="Supplier"
            rules={[{ required: true, message: "Please select supplier" }]}
          >
            <Select
              size="large"
              placeholder="Select supplier"
              className="[&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-lg [&_.ant-select-selection-item]:leading-[42px] [&_.ant-select-selection-placeholder]:leading-[42px]"
              options={[
                { value: "Enel Energia", label: "Enel Energia" },
                { value: "A2A Energy", label: "A2A Energy" },
                { value: "Edison", label: "Edison" },
                { value: "Sorgenia", label: "Sorgenia" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="commodity"
            label="Commodity"
            rules={[{ required: true, message: "Please select commodity" }]}
          >
            <Select
              size="large"
              placeholder="Select commodity"
              className="[&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-lg [&_.ant-select-selection-item]:leading-[42px] [&_.ant-select-selection-placeholder]:leading-[42px]"
              options={[
                { value: "ELECTRICITY", label: "Electricity" },
                { value: "GAS", label: "Gas" },
              ]}
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
          <Form.Item
            name="priceType"
            label="Price Type"
            rules={[{ required: true, message: "Please select price type" }]}
          >
            <Select
              size="large"
              placeholder="Select price type"
              className="[&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-lg [&_.ant-select-selection-item]:leading-[42px] [&_.ant-select-selection-placeholder]:leading-[42px]"
              options={[
                { value: "Fixed", label: "Fixed" },
                { value: "Variable", label: "Variable" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select status" }]}
          >
            <Select
              size="large"
              placeholder="Select status"
              className="[&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-lg [&_.ant-select-selection-item]:leading-[42px] [&_.ant-select-selection-placeholder]:leading-[42px]"
              options={[
                { value: "Active", label: "Active" },
                { value: "Expiring", label: "Expiring" },
                { value: "Draft", label: "Draft" },
              ]}
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
          <Form.Item
            name="commission"
            label="Commission (EUR)"
            rules={[{ required: true, message: "Please enter commission" }]}
          >
            <InputNumber
              min={0}
              className="w-full! rounded-lg [&_.ant-input-number-input]:h-11"
              controls={false}
              placeholder="e.g. 45"
            />
          </Form.Item>

          <Form.Item
            name="validity"
            label="Validity Date"
            rules={[{ required: true, message: "Please select validity date" }]}
          >
            <DatePicker className="h-11! w-full rounded-lg" format="DD/MM/YYYY" />
          </Form.Item>
        </div>

        <Form.Item name="notes" label="Notes">
          <Input.TextArea
            rows={4}
            placeholder="Optional notes about this offer..."
            className="rounded-lg"
          />
        </Form.Item>

        <div className="mt-2 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:mt-4 sm:flex-row sm:justify-end">
          <Button onClick={handleCancel} className="h-10 rounded-lg px-5 sm:min-w-[96px]">
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            className="h-10 rounded-lg bg-[#8b85f6] px-5 font-semibold hover:bg-[#7a74e5] sm:min-w-[136px]"
          >
            Create Offer
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
