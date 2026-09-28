import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Modal, Form, Input, Select, DatePicker, Button, Upload, message } from "antd";
import { FiX } from "react-icons/fi";
import { LuUpload, LuTrash2, LuFileText } from "react-icons/lu";
import dayjs from "dayjs";
import {
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  type ICreateSupplier,
} from "../../redux/features/Suppliers/supplierApi";
import { PhoneInput, phoneValidationRule } from "../../components/ui/PhoneInput";

import { server_origin } from "../../config";
import { getApiErrorMessage } from "../../utils/apiError";
import { codiceFiscaleCheckCharacter, taxIdProblem } from "../../utils/italianTaxId";

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
const italianTaxIdRule = (t: TFunction) => ({
  validator: (_: unknown, value: string = "") => {
    const problem = taxIdProblem(value);
    return problem
      ? Promise.reject(new Error(t(`suppliers.validation.tax_id_${problem}`, { character: codiceFiscaleCheckCharacter(value) })))
      : Promise.resolve();
  },
});

/**
 * Validates Italian ZIP/CAP code: exactly 5 digits.
 */
const italianZipRule = (t: TFunction) => ({
  validator: (_: unknown, value: string) => {
    if (!value) return Promise.resolve();
    return /^\d{5}$/.test(value.trim())
      ? Promise.resolve()
      : Promise.reject(new Error(t("suppliers.validation.zip")));
  },
});

const AddSupplierModal = ({ isOpen, onClose, mode = "add", supplierId, initialValues }: AddSupplierModalProps) => {
  const { t } = useTranslation();
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
      const { ok, url } = await uploadToServer(file);
      if (ok && url) {
        setLogoUrl(url);
        message.success(t("audit.icon_uploaded_successfully"));
      } else {
        message.error(t("offers_market.upload_failed"));
      }
    } catch {
      message.error(t("offers_market.upload_failed"));
    } finally {
      setUploadingLogo(false);
    }
    return false;
  };

  const handleSigningDocUpload = async (file: File) => {
    setUploadingSigningDoc(true);
    try {
      const { ok, url } = await uploadToServer(file);
      if (ok && url) {
        setSigningDocUrl(url);
        setSigningDocName(file.name);
        message.success(t("offers_market.upload_success"));
      } else {
        message.error(t("offers_market.upload_failed"));
      }
    } catch {
      message.error(t("offers_market.upload_failed"));
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
      contractStartDate: values.startDate ? dayjs(values.startDate).format("YYYY-MM-DD") : undefined,
      notes: values.notes || undefined,
      logoUrl: logoUrl || undefined,
      // Sent as null (not undefined) so clearing them in edit mode actually wipes the stored value.
      description: values.description?.trim() || null,
      contractSigningInstructions: values.contractSigningInstructions?.trim() || null,
      contractSigningDocumentUrl: signingDocUrl || null,
      contractSigningDocumentName: signingDocUrl ? signingDocName || null : null,
    };

    // Remove undefined keys
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    try {
      if (isEdit && supplierId) {
        await updateSupplier({ id: supplierId, data: payload }).unwrap();
        message.success(t("suppliers.updated", { name: values.brandName }));
      } else {
        await createSupplier(payload as ICreateSupplier).unwrap();
        message.success(t("suppliers.added", { name: values.brandName }));
      }
      onClose();
      if (!isEdit) form.resetFields();
    } catch (err) {
      message.error(getApiErrorMessage(err, t("common.generic_error")));
    }
  };

  return (
    <Modal
      title={
        <div className="py-2">
          <h2 className="text-xl font-bold text-slate-800">{isEdit ? t("suppliers.edit_supplier") : t("suppliers.add_supplier")}</h2>
          <p className="text-xs text-slate-400 font-medium">{t("audit.supplier_and_content_management")}</p>
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
        name="supplier_form"
        autoComplete="off"
        layout="vertical"
        onFinish={handleFinish}
        className="mt-6 space-y-8"
        requiredMark={false}
      >
        {/* Supplier Icon */}
        <section>
          <h3 className="text-[15px] font-bold text-slate-800 mb-4 px-1">{t("audit.supplier_icon")}</h3>
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
            {logoUrl ? (
              <div className="relative">
                <img
                  src={logoUrl.startsWith("http") ? logoUrl : `${server_origin}${logoUrl}`}
                  alt={t("audit.supplier_icon_2")}
                  className="h-16 w-16 rounded-xl object-cover border border-slate-200"
                />
                <button
                  type="button"
                  aria-label={t("suppliers.remove_icon")}
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
                  {logoUrl ? t("suppliers.replace_icon") : t("suppliers.upload_icon")}
                </Button>
              </Upload>
              <p className="text-[11px] text-slate-400 mt-1">{t("audit.jpg_png_or_webp_max_10mb")}</p>
            </div>
          </div>
        </section>

        {/* General Information */}
        <section>
          <h3 className="text-[15px] font-bold text-slate-800 mb-4 px-1">{t("suppliers.general_information")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("suppliers.brand_name")}</span>} name="brandName" rules={[{ required: true, message: t("audit.brand_name_is_required") }]}>
              <Input placeholder={t("audit.enter_brand_name")} className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("suppliers.legal_name")}</span>} name="legalName" rules={[{ required: true, message: t("audit.legal_name_is_required") }]}>
              <Input placeholder={t("audit.enter_legal_name")} className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("audit.tax_id_codice_fiscale_p_iva")}</span>} name="taxId" rules={[{ required: true, message: t("audit.tax_id_is_required") }, italianTaxIdRule(t)]}>
              <Input placeholder={t("audit.e_g_it06655971007_or_rssmra85t10a562s")} className="rounded-lg h-10 border-slate-200 font-mono" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("suppliers.commodity")}</span>} name="commodity" rules={[{ required: true, message: t("audit.select_a_commodity") }]}>
              <Select placeholder={t("audit.select_a_commodity")} className="rounded-lg h-10 border-slate-200" popupClassName="rounded-xl">
                <Option value="electricity">{t("service_types.electricity")}</Option>
                <Option value="gas">{t("service_types.gas")}</Option>
                <Option value="dual">{t("suppliers.dual")}</Option>
              </Select>
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("common.status")}</span>} name="status" rules={[{ required: true, message: t("audit.select_a_status") }]}>
              <Select placeholder={t("audit.select_a_status")} className="rounded-lg h-10 border-slate-200" popupClassName="rounded-xl">
                <Option value="active">{t("common.active")}</Option>
                <Option value="inactive">{t("common.inactive")}</Option>
              </Select>
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("suppliers.website_url")}</span>} name="website" rules={[{ type: "url", message: t("agreements.valid_url") }]}>
              <Input placeholder="https://..." className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
          </div>
        </section>

        {/* Primary Contact */}
        <section>
          <h3 className="text-[15px] font-bold text-slate-800 mb-4 px-1">{t("suppliers.primary_contact")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("suppliers.contact_name")}</span>} name="contactName" rules={[{ required: true, message: t("audit.contact_name_is_required") }]}>
              <Input placeholder={t("audit.enter_contact_name")} className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("auth.email")}</span>} name="email" rules={[{ required: true, message: t("audit.email_is_required") }, { type: "email", message: t("audit.enter_a_valid_email") }]}>
              <Input placeholder={t("audit.enter_email")} autoComplete="off" className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("suppliers.phone_number")}</span>} name="phoneNumber" rules={[{ required: true, message: t("audit.phone_number_is_required") }, phoneValidationRule(t("suppliers.validation.phone"))]}>
              <PhoneInput placeholder={t("suppliers.phone_number")} />
            </Form.Item>
          </div>
        </section>

        {/* Address */}
        <section>
          <h3 className="text-[15px] font-bold text-slate-800 mb-4 px-1">{t("home.address")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("suppliers.street_address")}</span>} name="streetAddress" className="md:col-span-2" rules={[{ required: true, message: t("audit.street_address_is_required") }]}>
              <Input placeholder={t("audit.enter_street_address")} className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("suppliers.city")}</span>} name="city" rules={[{ required: true, message: t("audit.city_is_required") }]}>
              <Input placeholder={t("audit.enter_city")} className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("suppliers.province")}</span>} name="province" rules={[{ required: true, message: t("audit.province_is_required") }]}>
              <Input placeholder={t("audit.enter_province")} className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("audit.zip_code_cap")}</span>} name="zipCode" rules={[{ required: true, message: t("audit.zip_code_is_required") }, italianZipRule(t)]}>
              <Input placeholder={t("audit.e_g_00198")} maxLength={5} className="rounded-lg h-10 border-slate-200" />
            </Form.Item>
          </div>
        </section>

        {/* Billing */}
        <section>
          <h3 className="text-[15px] font-bold text-slate-800 mb-4 px-1">{t("suppliers.billing")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("audit.contract_start_date")}</span>} name="startDate">
              <DatePicker className="w-full rounded-lg h-10 border-slate-200" />
            </Form.Item>
          </div>
        </section>

        {/* About Supplier */}
        <section>
          <h3 className="text-[15px] font-bold text-slate-800 mb-1 px-1">{t("audit.about_supplier")}</h3>
          <p className="text-[11px] text-slate-400 mb-4 px-1">
            {t("audit.shown_to_the_user_in_the_about_this_supplier_section_of_the_utility_details_screen_above_the_faqs_leave_empty_to_hide_it")}</p>
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <Form.Item name="description" className="mb-0">
              <TextArea
                placeholder={t("audit.describe_this_supplier_for_the_user")}
                rows={4}
                className="rounded-lg border-slate-200 p-3"
              />
            </Form.Item>
          </div>
        </section>

        {/* Contract Signing Instructions */}
        <section>
          <h3 className="text-[15px] font-bold text-slate-800 mb-1 px-1">{t("audit.contract_signing_instructions")}</h3>
          <p className="text-[11px] text-slate-400 mb-4 px-1">
            {t("audit.shown_to_the_user_as_a_contract_sign_guideline_section_when_a_contract_from_this_supplier_is_sent_leave_both_empty_to_hide_it")}</p>
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
            <Form.Item
              label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("offers_market.description_label")}</span>}
              name="contractSigningInstructions"
              className="mb-0"
            >
              <TextArea
                placeholder={t("audit.explain_how_the_user_should_sign_this_supplier_s_contract")}
                rows={4}
                className="rounded-lg border-slate-200 p-3"
              />
            </Form.Item>

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("audit.guideline_document")}</span>
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
                      {signingDocName || t("suppliers.view_document")}
                    </a>
                    <button
                      type="button"
                      aria-label={t("suppliers.remove_document")}
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
                      {signingDocUrl ? t("offers_market.replace_document") : t("offers_market.upload_document")}
                    </Button>
                  </Upload>
                  <p className="text-[11px] text-slate-400 mt-1">{t("audit.pdf_jpg_png_or_webp_max_10mb")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Notes */}
        <section>
          <h3 className="text-[15px] font-bold text-slate-800 mb-4 px-1">{t("suppliers.notes")}</h3>
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <Form.Item name="notes" className="mb-0">
              <TextArea
                placeholder={t("audit.write_some_notes")}
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
            {isEdit ? t("common.save_changes") : t("suppliers.add_supplier")}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddSupplierModal;
