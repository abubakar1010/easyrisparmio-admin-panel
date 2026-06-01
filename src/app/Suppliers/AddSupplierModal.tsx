import { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Select, DatePicker, Button, message } from "antd";
import { FiX } from "react-icons/fi";

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "add" | "edit";
  initialValues?: Record<string, unknown>;
  onSaved?: (values: Record<string, unknown>) => void;
}

const { Option } = Select;
const { TextArea } = Input;

const AddSupplierModal = ({ isOpen, onClose, mode = "add", initialValues, onSaved }: AddSupplierModalProps) => {
  const [form] = Form.useForm();
  const isEdit = mode === "edit";

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [isOpen, isEdit, initialValues, form]);

  const handleFinish = (values: any) => {
    onSaved?.(values);
    message.success(isEdit ? `Supplier "${values.brandName}" updated` : `Supplier "${values.brandName}" added`);
    onClose();
    if (!isEdit) form.resetFields();
  };

  return (
    <Modal
      title={
        <div className="py-2">
          <h2 className="text-xl font-bold text-slate-800">{isEdit ? "Edit Supplier" : "Add Supplier"}</h2>
          <p className="text-xs text-slate-400 font-medium">Supplier and Content Management</p>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnClose
      closeIcon={<FiX className="h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors" />}
      className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-slate-100 [&_.ant-modal-header]:pb-4"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="mt-6 space-y-8"
        requiredMark={false}
      >
        {/* General Information */}
        <section>
          <h3 className="text-[15px] font-bold text-slate-800 mb-4 px-1">General Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Brand Name</span>} name="brandName" rules={[{ required: true, message: "Brand name is required" }]}>
              <Input placeholder="Enter brand name" className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Legal Name</span>} name="legalName" rules={[{ required: true, message: "Legal name is required" }]}>
              <Input placeholder="Enter legal name" className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tax ID</span>} name="taxId" rules={[{ required: true, message: "Tax ID is required" }]}>
              <Input placeholder="Enter tax ID" className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Commodity</span>} name="commodity" rules={[{ required: true, message: "Select a commodity" }]}>
              <Select placeholder="Select commodity" className="rounded-lg h-10 border-slate-200" popupClassName="rounded-xl">
                <Option value="Electricity">Electricity</Option>
                <Option value="Gas">Gas</Option>
                <Option value="Dual">Dual</Option>
              </Select>
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</span>} name="status" rules={[{ required: true, message: "Select a status" }]}>
              <Select placeholder="Select status" className="rounded-lg h-10 border-slate-200" popupClassName="rounded-xl">
                <Option value="active">Active</Option>
                <Option value="warning">Warning</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Website</span>} name="website" rules={[{ type: "url", message: "Enter a valid URL" }]}>
              <Input placeholder="https://..." className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
          </div>
        </section>

        {/* Primary Contact */}
        <section>
          <h3 className="text-[15px] font-bold text-slate-800 mb-4 px-1">Primary Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Name</span>} name="contactName" rules={[{ required: true, message: "Contact name is required" }]}>
              <Input placeholder="Enter contact name" className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</span>} name="email" rules={[{ required: true, message: "Email is required" }, { type: "email", message: "Enter a valid email" }]}>
              <Input placeholder="Enter email" className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</span>} name="phoneNumber">
              <Input placeholder="+39 800 123 456" className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
          </div>
        </section>

        {/* Address */}
        <section>
          <h3 className="text-[15px] font-bold text-slate-800 mb-4 px-1">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Street Address</span>} name="streetAddress" className="md:col-span-2">
              <Input placeholder="Enter street address" className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">City</span>} name="city">
              <Input placeholder="Enter city" className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ZIP Code</span>} name="zipCode">
              <Input placeholder="Enter ZIP code" className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Country</span>} name="country">
              <Input placeholder="Enter country" className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
          </div>
        </section>

        {/* Billing & Commissions */}
        <section>
          <h3 className="text-[15px] font-bold text-slate-800 mb-4 px-1">Billing & Commissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">IBAN</span>} name="iban" className="md:col-span-2">
              <Input placeholder="Enter IBAN" className="rounded-lg h-10 border-slate-200 font-mono" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Commission Per Electricity Contract</span>} name="commElectricity">
              <InputNumber min={0} controls={false} prefix="€" placeholder="Enter amount" className="w-full! rounded-lg [&_.ant-input-number-input]:h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Commission Per Gas Contract</span>} name="commGas">
              <InputNumber min={0} controls={false} prefix="€" placeholder="Enter amount" className="w-full! rounded-lg [&_.ant-input-number-input]:h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Start Date</span>} name="startDate">
              <DatePicker className="w-full rounded-lg h-10 border-slate-200" />
            </Form.Item>
          </div>
        </section>

        {/* Notes */}
        <section>
          <h3 className="text-[15px] font-bold text-slate-800 mb-4 px-1">Notes</h3>
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <Form.Item name="notes" className="mb-0">
              <TextArea 
                placeholder="Write Some Notes....." 
                rows={4} 
                className="rounded-lg border-slate-200 p-3"
              />
            </Form.Item>
          </div>
        </section>

        <div className="pt-4">
          <Button 
            type="primary" 
            htmlType="submit" 
            block 
            className="bg-[#8b85f6] hover:bg-[#7a74e5] h-12 rounded-xl text-base font-bold border-0 shadow-lg shadow-indigo-100"
          >
            {isEdit ? "Save Changes" : "Add Supplier"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddSupplierModal;
