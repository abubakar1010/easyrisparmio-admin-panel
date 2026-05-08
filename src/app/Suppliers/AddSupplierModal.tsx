import { Modal, Form, Input, Select, DatePicker, Button } from "antd";
import { FiX } from "react-icons/fi";

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const { Option } = Select;
const { TextArea } = Input;

const AddSupplierModal = ({ isOpen, onClose }: AddSupplierModalProps) => {
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    console.log("Form values:", values);
    onClose();
    form.resetFields();
  };

  return (
    <Modal
      title={
        <div className="py-2">
          <h2 className="text-xl font-bold text-slate-800">Add Supplier</h2>
          <p className="text-xs text-slate-400 font-medium">Supplier and Content Management</p>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={700}
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
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Brand Name</span>} name="brandName">
              <Input placeholder="Enter brand name" className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Legal Name</span>} name="legalName">
              <Input placeholder="Enter legal name" className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tax ID</span>} name="taxId">
              <Input placeholder="Enter tax ID" className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Commodity</span>} name="commodity">
              <Input placeholder="Enter commodity" className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</span>} name="status">
              <Select placeholder="Select status" className="rounded-lg h-10 border-slate-200" dropdownClassName="rounded-xl">
                <Option value="active">Active</Option>
                <Option value="warning">Warning</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Website</span>} name="website">
              <Input placeholder="https://..." className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
          </div>
        </section>

        {/* Primary Contact */}
        <section>
          <h3 className="text-[15px] font-bold text-slate-800 mb-4 px-1">Primary Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Name</span>} name="contactName">
              <Input placeholder="Enter contact name" className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</span>} name="email">
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
              <Input placeholder="Enter amount" className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Commission Per Gas Contract</span>} name="commGas">
              <Input placeholder="Enter amount" className="rounded-lg h-10 border-slate-200" />
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
            Add Supplier
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddSupplierModal;
