import { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Select, DatePicker, Switch, Button, message } from "antd";
import { FiX, FiUpload } from "react-icons/fi";
import dayjs from "dayjs";
import {
  useCreateAgreementMutation,
  useUpdateAgreementMutation,
} from "../../redux/features/Agreements/agreementApi";

interface AgreementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "add" | "edit";
  agreementId?: string;
  initialValues?: Record<string, unknown>;
}

const { Option } = Select;
const { TextArea } = Input;

const AgreementFormModal = ({ isOpen, onClose, mode = "add", agreementId, initialValues }: AgreementFormModalProps) => {
  const [form] = Form.useForm();
  const isEdit = mode === "edit";

  const [createAgreement, { isLoading: isCreating }] = useCreateAgreementMutation();
  const [updateAgreement, { isLoading: isUpdating }] = useUpdateAgreementMutation();

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [isOpen, isEdit, initialValues, form]);

  const handleFinish = async (values: Record<string, any>) => {
    const payload: Record<string, any> = {
      title: values.title,
      partnerName: values.partnerName,
      partnerLogoUrl: values.partnerLogoUrl || undefined,
      termsUrl: values.termsUrl || undefined,
      address: values.address || undefined,
      discountDescription: values.discountDescription || undefined,
      description: values.description || undefined,
      validFrom: dayjs(values.validFrom).format("YYYY-MM-DD"),
      validUntil: values.validUntil ? dayjs(values.validUntil).format("YYYY-MM-DD") : undefined,
      targetAudience: values.targetAudience || undefined,
      sortOrder: values.sortOrder ?? undefined,
      isActive: values.isActive,
    };

    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    try {
      if (isEdit && agreementId) {
        await updateAgreement({ id: agreementId, data: payload }).unwrap();
        message.success("Agreement updated");
      } else {
        await createAgreement(payload as any).unwrap();
        message.success("Agreement created");
      }
      onClose();
      if (!isEdit) form.resetFields();
    } catch (err: any) {
      message.error(err?.data?.message?.[0] || err?.data?.message || "Something went wrong");
    }
  };

  return (
    <Modal
      title={
        <div className="py-2">
          <h2 className="text-xl font-bold text-slate-800">{isEdit ? "Edit Agreement" : "Add New Agreement"}</h2>
          <p className="text-xs font-medium text-slate-400">Partner agreement and discount management</p>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnClose
      closeIcon={<FiX className="h-5 w-5 text-slate-400 transition-colors hover:text-slate-600" />}
      className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-slate-100 [&_.ant-modal-header]:pb-4"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="mt-6 space-y-8"
        requiredMark={false}
        initialValues={{ isActive: true, targetAudience: "both", sortOrder: 0 }}
      >
        {/* Agreement Info */}
        <section>
          <h3 className="mb-4 px-1 text-[15px] font-bold text-slate-800">Agreement Information</h3>
          <div className="grid grid-cols-1 gap-x-4 gap-y-1 rounded-xl border border-slate-100 bg-slate-50/50 p-4 md:grid-cols-2">
            <Form.Item
              label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Agreement Title</span>}
              name="title"
              rules={[{ required: true, message: "Title is required" }]}
            >
              <Input placeholder="E.g.: 20% Off on Smart Home Kit" className="h-10 rounded-lg border-slate-200" />
            </Form.Item>
            <Form.Item
              label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Partner Name</span>}
              name="partnerName"
              rules={[{ required: true, message: "Partner name is required" }]}
            >
              <Input placeholder="E.g.: Enel X" className="h-10 rounded-lg border-slate-200" />
            </Form.Item>
            <Form.Item
              label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Logo URL</span>}
              name="partnerLogoUrl"
              rules={[{ type: "url", message: "Enter a valid URL" }]}
            >
              <Input placeholder="https://..." className="h-10 rounded-lg border-slate-200" suffix={<FiUpload className="text-slate-400" />} />
            </Form.Item>
            <Form.Item
              label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Terms & Conditions URL</span>}
              name="termsUrl"
              rules={[{ type: "url", message: "Enter a valid URL" }]}
            >
              <Input placeholder="https://..." className="h-10 rounded-lg border-slate-200" />
            </Form.Item>
            <Form.Item
              label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Address</span>}
              name="address"
              className="md:col-span-2"
            >
              <Input placeholder="E.g.: Via Cesare Sersale 1, 80139 Napoli NA, Italia" className="h-10 rounded-lg border-slate-200" />
            </Form.Item>
          </div>
        </section>

        {/* Discount & Description */}
        <section>
          <h3 className="mb-4 px-1 text-[15px] font-bold text-slate-800">Discount & Description</h3>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-1">
            <Form.Item
              label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Discount Description</span>}
              name="discountDescription"
            >
              <Input placeholder="E.g.: 15% off the entire menu. Code: EASY15" className="h-10 rounded-lg border-slate-200" />
            </Form.Item>
            <Form.Item
              label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</span>}
              name="description"
              className="mb-0"
            >
              <TextArea rows={3} placeholder="Describe the agreement details and conditions..." className="rounded-lg border-slate-200 p-3" />
            </Form.Item>
          </div>
        </section>

        {/* Validity & Settings */}
        <section>
          <h3 className="mb-4 px-1 text-[15px] font-bold text-slate-800">Validity & Settings</h3>
          <div className="grid grid-cols-1 gap-x-4 gap-y-1 rounded-xl border border-slate-100 bg-slate-50/50 p-4 md:grid-cols-2">
            <Form.Item
              label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Valid From</span>}
              name="validFrom"
              rules={[{ required: true, message: "Start date is required" }]}
            >
              <DatePicker className="h-10! w-full rounded-lg border-slate-200" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item
              label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Valid Until</span>}
              name="validUntil"
            >
              <DatePicker className="h-10! w-full rounded-lg border-slate-200" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item
              label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Audience</span>}
              name="targetAudience"
            >
              <Select placeholder="Select audience" className="h-10 rounded-lg border-slate-200" popupClassName="rounded-xl">
                <Option value="personal">Personal</Option>
                <Option value="business">Business</Option>
                <Option value="both">Both</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sort Order</span>}
              name="sortOrder"
            >
              <InputNumber min={0} controls={false} placeholder="0" className="w-full! rounded-lg [&_.ant-input-number-input]:h-10 border-slate-200" />
            </Form.Item>
            <Form.Item
              label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active</span>}
              name="isActive"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>
        </section>

        <div className="pt-4">
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={isCreating || isUpdating}
            className="h-12 rounded-xl border-0 bg-[#8b85f6] text-base font-bold shadow-lg shadow-indigo-100 hover:bg-[#7a74e5]"
          >
            {isEdit ? "Save Changes" : "Save Agreement"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AgreementFormModal;
