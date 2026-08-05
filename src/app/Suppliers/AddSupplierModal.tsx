import { useEffect } from "react";
import { Modal, Form, Input, Select, DatePicker, Button, message } from "antd";
import { FiX } from "react-icons/fi";
import dayjs from "dayjs";
import {
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
} from "../../redux/features/Suppliers/supplierApi";
import { PhoneInput, phoneValidationRule } from "../../components/ui/PhoneInput";
import { PROVINCE_OPTIONS } from "../../constants/italianProvinces";

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "add" | "edit";
  supplierId?: string;
  initialValues?: Record<string, unknown>;
}

const { Option } = Select;
const { TextArea } = Input;

/**
 * Validates Italian Tax ID: Codice Fiscale (16 alphanumeric) or Partita IVA (11 digits, optionally IT-prefixed).
 */
const italianTaxIdRule = {
  validator: (_: unknown, value: string) => {
    if (!value) return Promise.reject(new Error("Tax ID is required"));
    const cleaned = value.trim().toUpperCase();

    // Partita IVA: 11 digits, optionally prefixed with "IT"
    if (/^(IT)?\d{11}$/.test(cleaned)) {
      const piva = cleaned.replace(/^IT/, "");
      let sum = 0;
      for (let i = 0; i < 11; i++) {
        const digit = parseInt(piva[i], 10);
        if (i % 2 === 0) {
          sum += digit;
        } else {
          const doubled = digit * 2;
          sum += doubled > 9 ? doubled - 9 : doubled;
        }
      }
      return sum % 10 === 0
        ? Promise.resolve()
        : Promise.reject(new Error("Invalid Partita IVA check digit"));
    }

    // Codice Fiscale: 16 alphanumeric
    if (/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(cleaned)) {
      const oddMap: Record<string, number> = {
        "0": 1, "1": 0, "2": 5, "3": 7, "4": 9, "5": 13, "6": 15, "7": 17, "8": 19, "9": 21,
        A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21,
        K: 2, L: 4, M: 18, N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14,
        U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23,
      };
      const evenMap: Record<string, number> = {
        "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
        A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7, I: 8, J: 9,
        K: 10, L: 11, M: 12, N: 13, O: 14, P: 15, Q: 16, R: 17, S: 18, T: 19,
        U: 20, V: 21, W: 22, X: 23, Y: 24, Z: 25,
      };
      let sum = 0;
      for (let i = 0; i < 15; i++) {
        sum += i % 2 === 0 ? oddMap[cleaned[i]] : evenMap[cleaned[i]];
      }
      const expected = String.fromCharCode(65 + (sum % 26));
      return cleaned[15] === expected
        ? Promise.resolve()
        : Promise.reject(new Error("Invalid Codice Fiscale check character"));
    }

    return Promise.reject(
      new Error("Enter a valid Codice Fiscale (16 chars) or Partita IVA (11 digits)")
    );
  },
};

/**
 * Validates Italian IBAN: 27 characters starting with IT, with mod-97 check.
 */
const italianIbanRule = {
  validator: (_: unknown, value: string) => {
    if (!value) return Promise.reject(new Error("IBAN is required"));
    const cleaned = value.replace(/\s+/g, "").toUpperCase();

    if (!/^IT\d{2}[A-Z]\d{10}[A-Z0-9]{12}$/.test(cleaned)) {
      return Promise.reject(
        new Error("IBAN must be a valid Italian IBAN (27 characters starting with IT)")
      );
    }

    // IBAN mod-97 check
    const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
    const numericStr = rearranged
      .split("")
      .map((ch) => {
        const code = ch.charCodeAt(0);
        return code >= 65 && code <= 90 ? (code - 55).toString() : ch;
      })
      .join("");

    let remainder = 0;
    for (let i = 0; i < numericStr.length; i += 7) {
      const chunk = String(remainder) + numericStr.slice(i, i + 7);
      remainder = parseInt(chunk, 10) % 97;
    }

    return remainder === 1
      ? Promise.resolve()
      : Promise.reject(new Error("IBAN check digits are invalid"));
  },
};

/**
 * Validates Italian ZIP/CAP code: exactly 5 digits.
 */
const italianZipRule = {
  validator: (_: unknown, value: string) => {
    if (!value) return Promise.reject(new Error("ZIP code is required"));
    return /^\d{5}$/.test(value.trim())
      ? Promise.resolve()
      : Promise.reject(new Error("Enter a valid 5-digit Italian CAP code"));
  },
};

const AddSupplierModal = ({ isOpen, onClose, mode = "add", supplierId, initialValues }: AddSupplierModalProps) => {
  const [form] = Form.useForm();
  const isEdit = mode === "edit";

  const [createSupplier, { isLoading: isCreating }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: isUpdating }] = useUpdateSupplierMutation();

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
      name: values.brandName,
      legalName: values.legalName,
      taxId: values.taxId?.trim().toUpperCase(),
      commodity: values.commodity,
      status: values.status,
      website: values.website || undefined,
      contactName: values.contactName,
      contactEmail: values.email,
      contactPhone: values.phoneNumber,
      streetAddress: values.streetAddress,
      city: values.city,
      province: values.province,
      zipCode: values.zipCode?.trim(),
      iban: values.iban?.replace(/\s+/g, "").toUpperCase(),
      contractStartDate: values.startDate ? dayjs(values.startDate).format("YYYY-MM-DD") : undefined,
      notes: values.notes || undefined,
    };

    // Remove undefined keys
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    try {
      if (isEdit && supplierId) {
        await updateSupplier({ id: supplierId, data: payload }).unwrap();
        message.success(`Supplier "${values.brandName}" updated`);
      } else {
        await createSupplier(payload as any).unwrap();
        message.success(`Supplier "${values.brandName}" added`);
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
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tax ID (Codice Fiscale / P.IVA)</span>} name="taxId" rules={[{ required: true, message: "Tax ID is required" }, italianTaxIdRule]}>
              <Input placeholder="e.g., IT06655971007 or RSSMRA85T10A562S" className="rounded-lg h-10 border-slate-200 font-mono" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Commodity</span>} name="commodity" rules={[{ required: true, message: "Select a commodity" }]}>
              <Select placeholder="Select commodity" className="rounded-lg h-10 border-slate-200" popupClassName="rounded-xl">
                <Option value="electricity">Electricity</Option>
                <Option value="gas">Gas</Option>
                <Option value="dual">Dual</Option>
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
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</span>} name="phoneNumber" rules={[{ required: true, message: "Phone number is required" }, phoneValidationRule("Enter a valid phone number")]}>
              <PhoneInput />
            </Form.Item>
          </div>
        </section>

        {/* Address */}
        <section>
          <h3 className="text-[15px] font-bold text-slate-800 mb-4 px-1">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Street Address</span>} name="streetAddress" className="md:col-span-2" rules={[{ required: true, message: "Street address is required" }]}>
              <Input placeholder="Enter street address" className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">City</span>} name="city" rules={[{ required: true, message: "City is required" }]}>
              <Input placeholder="Enter city" className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Province</span>} name="province" rules={[{ required: true, message: "Province is required" }]}>
              <Select
                showSearch
                placeholder="Select province"
                options={PROVINCE_OPTIONS}
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
                className="[&_.ant-select-selector]:rounded-lg [&_.ant-select-selector]:!h-10 [&_.ant-select-selector]:border-slate-200"
                popupClassName="rounded-xl"
              />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ZIP Code (CAP)</span>} name="zipCode" rules={[{ required: true, message: "ZIP code is required" }, italianZipRule]}>
              <Input placeholder="e.g., 00198" maxLength={5} className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
          </div>
        </section>

        {/* Billing */}
        <section>
          <h3 className="text-[15px] font-bold text-slate-800 mb-4 px-1">Billing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">IBAN</span>} name="iban" className="md:col-span-2" rules={[{ required: true, message: "IBAN is required" }, italianIbanRule]}>
              <Input placeholder="e.g., IT60X0542811101000000123456" className="rounded-lg h-10 border-slate-200 font-mono" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contract Start Date</span>} name="startDate">
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
            loading={isCreating || isUpdating}
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
