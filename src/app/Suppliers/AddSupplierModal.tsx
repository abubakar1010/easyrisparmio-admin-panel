import { useEffect, useState } from "react";
import { Modal, Form, Input, Select, DatePicker, Button, Upload, message } from "antd";
import { FiX } from "react-icons/fi";
import { LuUpload, LuTrash2, LuFileText } from "react-icons/lu";
import dayjs from "dayjs";
import {
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
} from "../../redux/features/Suppliers/supplierApi";
import { PhoneInput, phoneValidationRule } from "../../components/ui/PhoneInput";

import { server_origin } from "../../config";
import { taxIdMessage } from "../../utils/italianTaxId";

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
 * The tax ID rule, taken from the shared util so this modal, the case editor
 * and the server cannot drift apart — one table, one verdict.
 */
const italianTaxIdRule = {
  validator: (_: unknown, value: string) => {
    const problem = taxIdMessage(value);
    return problem ? Promise.reject(new Error(problem)) : Promise.resolve();
  },
};

/**
 * Validates Italian IBAN: 27 characters starting with IT, with mod-97 check.
 */
const italianIbanRule = {
  validator: (_: unknown, value: string) => {
    if (!value) return Promise.resolve();
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
    if (!value) return Promise.resolve();
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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [signingDocUrl, setSigningDocUrl] = useState<string | null>(null);
  const [signingDocName, setSigningDocName] = useState<string | null>(null);
  const [uploadingSigningDoc, setUploadingSigningDoc] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && initialValues) {
      form.setFieldsValue(initialValues);
      setLogoUrl((initialValues.logoUrl as string) || null);
      setSigningDocUrl((initialValues.contractSigningDocumentUrl as string) || null);
      setSigningDocName((initialValues.contractSigningDocumentName as string) || null);
    } else {
      form.resetFields();
      setLogoUrl(null);
      setSigningDocUrl(null);
      setSigningDocName(null);
    }
  }, [isOpen, isEdit, initialValues, form]);

  /** Uploads a file to the generic upload endpoint and returns its stored URL. */
  const uploadToServer = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`${server_origin}/api/v1/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const result = await res.json();
    return {
      ok: res.ok,
      url: (result?.data?.url || result?.url) as string | undefined,
      error: result?.message || result?.data?.message,
    };
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const { ok, url, error } = await uploadToServer(file);
      if (ok && url) {
        setLogoUrl(url);
        message.success("Icon uploaded successfully");
      } else {
        message.error(error || "Upload failed");
      }
    } catch {
      message.error("Upload failed");
    } finally {
      setUploadingLogo(false);
    }
    return false;
  };

  const handleSigningDocUpload = async (file: File) => {
    setUploadingSigningDoc(true);
    try {
      const { ok, url, error } = await uploadToServer(file);
      if (ok && url) {
        setSigningDocUrl(url);
        setSigningDocName(file.name);
        message.success("Document uploaded successfully");
      } else {
        message.error(error || "Upload failed");
      }
    } catch {
      message.error("Upload failed");
    } finally {
      setUploadingSigningDoc(false);
    }
    return false;
  };

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
      logoUrl: logoUrl || undefined,
      // Sent as null (not undefined) so clearing them in edit mode actually wipes the stored value.
      contractSigningInstructions: values.contractSigningInstructions?.trim() || null,
      contractSigningDocumentUrl: signingDocUrl || null,
      contractSigningDocumentName: signingDocUrl ? signingDocName || null : null,
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
        {/* Supplier Icon */}
        <section>
          <h3 className="text-[15px] font-bold text-slate-800 mb-4 px-1">Supplier Icon</h3>
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
            {logoUrl ? (
              <div className="relative">
                <img
                  src={logoUrl.startsWith("http") ? logoUrl : `${server_origin}${logoUrl}`}
                  alt="Supplier icon"
                  className="h-16 w-16 rounded-xl object-cover border border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setLogoUrl(null)}
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <LuTrash2 className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="h-16 w-16 rounded-xl bg-slate-200 flex items-center justify-center">
                <LuUpload className="h-6 w-6 text-slate-400" />
              </div>
            )}
            <div className="flex-1">
              <Upload
                accept="image/jpeg,image/png,image/webp"
                showUploadList={false}
                beforeUpload={(file) => handleLogoUpload(file)}
              >
                <Button
                  icon={<LuUpload className="h-4 w-4" />}
                  loading={uploadingLogo}
                  className="rounded-lg h-9 border-slate-200"
                >
                  {logoUrl ? "Replace Icon" : "Upload Icon"}
                </Button>
              </Upload>
              <p className="text-[11px] text-slate-400 mt-1">JPG, PNG or WebP. Max 10MB.</p>
            </div>
          </div>
        </section>

        {/* General Information */}
        <section>
          <h3 className="text-[15px] font-bold text-slate-800 mb-4 px-1">General Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Street Address</span>} name="streetAddress" className="md:col-span-2" rules={[{ required: true, message: "Street address is required" }]}>
              <Input placeholder="Enter street address" className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">City</span>} name="city" rules={[{ required: true, message: "City is required" }]}>
              <Input placeholder="Enter city" className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Province</span>} name="province" rules={[{ required: true, message: "Province is required" }]}>
              <Input placeholder="Enter province" className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ZIP Code (CAP)</span>} name="zipCode" rules={[{ required: true, message: "ZIP code is required" }, italianZipRule]}>
              <Input placeholder="e.g., 00198" maxLength={5} className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
          </div>
        </section>

        {/* Billing */}
        <section>
          <h3 className="text-[15px] font-bold text-slate-800 mb-4 px-1">Billing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">IBAN</span>} name="iban" className="md:col-span-2" rules={[{ required: true, message: "IBAN is required" }, italianIbanRule]}>
              <Input placeholder="e.g., IT60X0542811101000000123456" className="rounded-lg h-10 border-slate-200 font-mono" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contract Start Date</span>} name="startDate">
              <DatePicker className="w-full rounded-lg h-10 border-slate-200" />
            </Form.Item>
          </div>
        </section>

        {/* Contract Signing Instructions */}
        <section>
          <h3 className="text-[15px] font-bold text-slate-800 mb-1 px-1">Contract Signing Instructions</h3>
          <p className="text-[11px] text-slate-400 mb-4 px-1">
            Shown to the user as a "Contract Sign Guideline" section when a contract from this supplier is sent. Leave both empty to hide it.
          </p>
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
            <Form.Item
              label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</span>}
              name="contractSigningInstructions"
              className="mb-0"
            >
              <TextArea
                placeholder="Explain how the user should sign this supplier's contract..."
                rows={4}
                className="rounded-lg border-slate-200 p-3"
              />
            </Form.Item>

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Guideline Document</span>
              <div className="mt-2 flex items-center gap-4">
                {signingDocUrl ? (
                  <div className="relative flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-2 max-w-[320px]">
                    <LuFileText className="h-5 w-5 text-slate-400 shrink-0" />
                    <a
                      href={signingDocUrl.startsWith("http") ? signingDocUrl : `${server_origin}${signingDocUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-slate-700 hover:text-[#7061ED] truncate"
                    >
                      {signingDocName || "View document"}
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setSigningDocUrl(null);
                        setSigningDocName(null);
                      }}
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <LuTrash2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-11 w-11 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                    <LuFileText className="h-5 w-5 text-slate-400" />
                  </div>
                )}
                <div className="flex-1">
                  <Upload
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    showUploadList={false}
                    beforeUpload={(file) => handleSigningDocUpload(file)}
                  >
                    <Button
                      icon={<LuUpload className="h-4 w-4" />}
                      loading={uploadingSigningDoc}
                      className="rounded-lg h-9 border-slate-200"
                    >
                      {signingDocUrl ? "Replace Document" : "Upload Document"}
                    </Button>
                  </Upload>
                  <p className="text-[11px] text-slate-400 mt-1">PDF, JPG, PNG or WebP. Max 10MB.</p>
                </div>
              </div>
            </div>
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
