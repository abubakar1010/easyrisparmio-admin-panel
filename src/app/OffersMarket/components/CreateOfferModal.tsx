import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, message } from "antd";
import dayjs from "dayjs";
import { useCreateOfferMutation } from "../../../redux/features/Offers/offerApi";
import { useGetSuppliersQuery } from "../../../redux/features/Suppliers/supplierApi";

type CreateOfferModalProps = {
  open: boolean;
  onClose: () => void;
};

export const CreateOfferModal = ({ open, onClose }: CreateOfferModalProps) => {
  const [form] = Form.useForm();
  const [createOffer, { isLoading }] = useCreateOfferMutation();
  const { data: suppliersData } = useGetSuppliersQuery({ limit: 100 });
  const suppliers = suppliersData?.data || [];

  const handleSubmit = async (values: Record<string, any>) => {
    try {
      await createOffer({
        name: values.offerName,
        offerCode: values.offerCode || undefined,
        supplierId: values.supplier,
        energyType: values.commodity?.toLowerCase(),
        marketType: values.priceType?.toLowerCase(),
        offerStatus: values.status?.toLowerCase() || "draft",
        activationCost: values.commission,
        contractDurationMonths: values.durationMonths || 12,
        validFrom: dayjs().format("YYYY-MM-DD"),
        validUntil: values.validity ? dayjs(values.validity).format("YYYY-MM-DD") : undefined,
        description: values.notes || undefined,
      }).unwrap();
      message.success("Offer created successfully");
      form.resetFields();
      onClose();
    } catch (err: any) {
      message.error(err?.data?.message?.[0] || err?.data?.message || "Failed to create offer");
    }
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

          <Form.Item name="offerCode" label="Offer Code">
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
              showSearch
              optionFilterProp="label"
              className="[&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-lg"
              options={suppliers?.map((s) => ({ value: s.id, label: s.name })) || []}
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
              className="[&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-lg"
              options={[
                { value: "electricity", label: "Electricity" },
                { value: "gas", label: "Gas" },
                { value: "dual", label: "Dual" },
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
              className="[&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-lg"
              options={[
                { value: "fixed", label: "Fixed" },
                { value: "variable", label: "Variable" },
                { value: "indexed", label: "Indexed" },
              ]}
            />
          </Form.Item>

          <Form.Item name="status" label="Status" initialValue="draft">
            <Select
              size="large"
              placeholder="Select status"
              className="[&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-lg"
              options={[
                { value: "active", label: "Active" },
                { value: "expiring", label: "Expiring" },
                { value: "draft", label: "Draft" },
              ]}
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
          <Form.Item
            name="commission"
            label="Activation Cost (EUR)"
            rules={[{ required: true, message: "Please enter activation cost" }]}
          >
            <InputNumber
              min={0}
              className="w-full! rounded-lg [&_.ant-input-number-input]:h-11"
              controls={false}
              placeholder="e.g. 45"
            />
          </Form.Item>

          <Form.Item name="validity" label="Valid Until">
            <DatePicker className="h-11! w-full rounded-lg" format="DD/MM/YYYY" />
          </Form.Item>
        </div>

        <Form.Item name="notes" label="Description">
          <Input.TextArea
            rows={4}
            placeholder="Optional description about this offer..."
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
            loading={isLoading}
            className="h-10 rounded-lg bg-[#8b85f6] px-5 font-semibold hover:bg-[#7a74e5] sm:min-w-[136px]"
          >
            Create Offer
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
