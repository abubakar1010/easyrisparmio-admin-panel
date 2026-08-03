import { Alert, Button, DatePicker, Form, Input, Modal, Select, Switch, Upload, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { LuUpload, LuFile, LuTrash2 } from "react-icons/lu";
import { useCreateOfferMutation, useUpdateOfferMutation } from "../../../redux/features/Offers/offerApi";
import { useGetSuppliersQuery } from "../../../redux/features/Suppliers/supplierApi";
import { server_origin } from "../../../config";

const numericRule = (fieldLabel: string) => [
  {
    validator: (_: unknown, value: string) => {
      if (!value && value !== "0") return Promise.reject(`Please enter ${fieldLabel}`);
      if (!/^\d+(\.\d+)?$/.test(value)) return Promise.reject(`Please enter a valid ${fieldLabel}`);
      return Promise.resolve();
    },
  },
];

const sanitizeNumeric = (raw: string) => raw.replace(/[^\d.]/g, "").replace(/(\..*?)\./g, "$1");

const NumericInput = ({ value, onChange, placeholder }: { value?: string; onChange?: (v: string) => void; placeholder?: string }) => (
  <Input
    value={value}
    placeholder={placeholder}
    className="h-11 rounded-lg"
    onChange={(e) => {
      const v = sanitizeNumeric(e.target.value);
      onChange?.(v);
    }}
    onPaste={(e) => {
      e.preventDefault();
      const pasted = sanitizeNumeric(e.clipboardData.getData("text"));
      onChange?.(pasted);
    }}
  />
);

type CreateOfferModalProps = {
  open: boolean;
  onClose: () => void;
  mode?: "add" | "edit";
  offerId?: string;
  initialValues?: Record<string, unknown>;
  isImmutable?: boolean;
};

export const CreateOfferModal = ({
  open,
  onClose,
  mode = "add",
  offerId,
  initialValues,
  isImmutable = false,
}: CreateOfferModalProps) => {
  const [form] = Form.useForm();
  const isEdit = mode === "edit";
  const [createOffer, { isLoading: isCreating }] = useCreateOfferMutation();
  const [updateOffer, { isLoading: isUpdating }] = useUpdateOfferMutation();
  const { data: suppliersData } = useGetSuppliersQuery({ limit: 100 });
  const suppliers = suppliersData?.data || [];

  const commodity = Form.useWatch("commodity", form);
  const validFrom = Form.useWatch("validFrom", form);
  const validUntil = Form.useWatch("validity", form);

  const [economicConditionsUrl, setEconomicConditionsUrl] = useState<string | null>(null);
  const [termsDocUrl, setTermsDocUrl] = useState<string | null>(null);
  const [uploadingEcon, setUploadingEcon] = useState(false);
  const [uploadingTerms, setUploadingTerms] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (isEdit && initialValues) {
      form.setFieldsValue(initialValues);
      setEconomicConditionsUrl((initialValues.economicConditionsUrl as string) || null);
      setTermsDocUrl((initialValues.termsUrl as string) || null);
    } else {
      form.resetFields();
      setEconomicConditionsUrl(null);
      setTermsDocUrl(null);
    }
  }, [open, isEdit, initialValues, form]);

  // Auto-calculate contract duration in days from date range
  useEffect(() => {
    if (validFrom && validUntil) {
      const days = dayjs(validUntil).diff(dayjs(validFrom), "day");
      form.setFieldsValue({ contractDurationDays: days > 0 ? days : undefined });
    } else {
      form.setFieldsValue({ contractDurationDays: undefined });
    }
  }, [validFrom, validUntil, form]);

  const handleDocUpload = async (
    file: File,
    setUrl: (url: string | null) => void,
    setLoading: (v: boolean) => void,
    fieldName: string,
  ) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${server_origin}/api/v1/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await res.json();
      const url = result?.data?.url || result?.url;
      if (res.ok && url) {
        setUrl(url);
        form.setFieldsValue({ [fieldName]: url });
        form.validateFields([fieldName]).catch(() => {});
        message.success("Document uploaded successfully");
      } else {
        message.error(result?.message || result?.data?.message || "Upload failed");
      }
    } catch {
      message.error("Upload failed");
    } finally {
      setLoading(false);
    }
    return false;
  };

  const handleSubmit = async (values: Record<string, any>) => {
    const payload = {
      name: values.offerName,
      offerCode: values.offerCode || undefined,
      supplierId: values.supplier,
      energyType: values.commodity?.toLowerCase(),
      marketType: values.priceType?.toLowerCase(),
      offerStatus: values.status?.toLowerCase() || "draft",
      activationCost: values.activationCost ? parseFloat(values.activationCost) : 0,
      fixedMonthlyFee: values.fixedMonthlyFee ? parseFloat(values.fixedMonthlyFee) : 0,
      pricePerKwh: values.pricePerKwh ? parseFloat(values.pricePerKwh) : undefined,
      pricePerSmc: values.pricePerSmc ? parseFloat(values.pricePerSmc) : undefined,
      contractDurationDays: values.contractDurationDays || 1,
      isGreenEnergy: values.isGreenEnergy ?? false,
      validFrom: dayjs(values.validFrom).format("YYYY-MM-DD"),
      validUntil: values.validity
        ? dayjs(values.validity).format("YYYY-MM-DD")
        : undefined,
      target: values.target || undefined,
      highlights: values.highlights?.length ? values.highlights : undefined,
      termsUrl: termsDocUrl || undefined,
      economicConditionsUrl: economicConditionsUrl || undefined,
      description: values.notes || undefined,
    };

    try {
      if (isEdit && offerId) {
        await updateOffer({ id: offerId, data: payload }).unwrap();
        message.success("Offer updated successfully");
      } else {
        await createOffer(payload).unwrap();
        message.success("Offer created successfully");
      }
      form.resetFields();
      onClose();
    } catch (err: any) {
      message.error(
        err?.data?.message?.[0] || err?.data?.message || `Failed to ${isEdit ? "update" : "create"} offer`
      );
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setEconomicConditionsUrl(null);
    setTermsDocUrl(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      centered
      width="min(920px, calc(100vw - 24px))"
      title={
        <span className="text-xl! font-bold text-slate-800">
          {isEdit ? "Edit Offer" : "Create New Offer"}
        </span>
      }
      className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-4 sm:[&_.ant-modal-content]:p-6 [&_.ant-modal-header]:rounded-t-2xl [&_.ant-modal-body]:pt-3"
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="pt-1" disabled={isImmutable}>
        {isImmutable && (
          <Alert
            type="warning"
            showIcon
            className="mb-4"
            message="This offer has been accepted by users and cannot be modified. Only status changes are allowed from the offers list."
          />
        )}
        {/* General Information */}
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          General Information
        </p>
        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
          <Form.Item
            name="offerName"
            label="Offer Name"
            rules={[{ required: true, message: "Please enter offer name" }]}
          >
            <Input placeholder="e.g. Trend Home Electricity" className="h-11 rounded-lg" />
          </Form.Item>
          <Form.Item name="offerCode" label="Offer Code" rules={[{ required: true, message: "Please enter offer code" }]}>
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

        {/* Pricing */}
        <p className="mb-2 mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">
          Pricing
        </p>
        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-3">
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
          <Form.Item
            name="fixedMonthlyFee"
            label="Fixed Monthly Fee (EUR)"
            rules={numericRule("fixed monthly fee")}
          >
            <NumericInput placeholder="e.g. 9.90" />
          </Form.Item>
          <Form.Item
            name="activationCost"
            label="Activation Cost (EUR)"
            rules={numericRule("activation cost")}
          >
            <NumericInput placeholder="e.g. 45" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
          {(commodity === "electricity" || commodity === "dual" || !commodity) && (
            <Form.Item name="pricePerKwh" label="Price per kWh (EUR)" rules={numericRule("price per kWh")}>
              <NumericInput placeholder="e.g. 0.085" />
            </Form.Item>
          )}
          {(commodity === "gas" || commodity === "dual" || !commodity) && (
            <Form.Item name="pricePerSmc" label="Price per SMc (EUR)" rules={numericRule("price per SMc")}>
              <NumericInput placeholder="e.g. 0.45" />
            </Form.Item>
          )}
        </div>

        {/* Contract & Validity */}
        <p className="mb-2 mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">
          Contract & Validity
        </p>
        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
          <Form.Item name="validFrom" label="Valid From" rules={[{ required: true, message: "Please select valid from date" }]}>
            <DatePicker
              className="h-11! w-full rounded-lg"
              format="DD/MM/YYYY"
              inputReadOnly
              disabledDate={(current) => current < dayjs().startOf("day")}
            />
          </Form.Item>
          <Form.Item name="validity" label="Valid Until" rules={[{ required: true, message: "Please select valid until date" }]}>
            <DatePicker
              className="h-11! w-full rounded-lg"
              format="DD/MM/YYYY"
              inputReadOnly
              disabledDate={(current) => {
                const tomorrow = dayjs().add(1, "day").startOf("day");
                if (validFrom) {
                  const afterFrom = dayjs(validFrom).add(1, "day").startOf("day");
                  return current < (afterFrom.isAfter(tomorrow) ? afterFrom : tomorrow);
                }
                return current < tomorrow;
              }}
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-3">
          <Form.Item name="target" label="Target" rules={[{ required: true, message: "Please select target" }]}>
            <Select
              size="large"
              placeholder="Select target"
              className="[&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-lg"
              options={[
                { value: "personal", label: "Personal" },
                { value: "business", label: "Business" },
                { value: "both", label: "Both" },
              ]}
            />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true, message: "Please select status" }]}>
            <Select
              size="large"
              placeholder="Select status"
              disabled={isEdit}
              className="[&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-lg"
              options={
                isEdit
                  ? [
                      { value: "draft", label: "Draft" },
                      { value: "active", label: "Active" },
                      { value: "expiring", label: "Expiring" },
                      { value: "expired", label: "Expired" },
                      { value: "archived", label: "Archived" },
                    ]
                  : [
                      { value: "draft", label: "Draft" },
                      { value: "active", label: "Active" },
                    ]
              }
            />
          </Form.Item>
          <Form.Item name="isGreenEnergy" label="Green Energy" valuePropName="checked" rules={[{ required: true, message: "Please select green energy" }]}>
            <Switch />
          </Form.Item>
        </div>

        {/* Additional Details */}
        <p className="mb-2 mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">
          Additional Details
        </p>

        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
          <Form.Item
            name="termsUrl"
            label="Terms & Conditions Document"
          >
            <div>
              <div className="flex items-center gap-3">
                <Upload
                  accept=".pdf,.png,.jpg,.jpeg"
                  maxCount={1}
                  showUploadList={false}
                  beforeUpload={(file) => handleDocUpload(file, setTermsDocUrl, setUploadingTerms, "termsUrl")}
                >
                  <Button
                    icon={<LuUpload className="h-4 w-4" />}
                    loading={uploadingTerms}
                    className="h-10 rounded-lg"
                  >
                    {termsDocUrl ? "Replace Document" : "Upload Document"}
                  </Button>
                </Upload>
                {termsDocUrl && (
                  <div className="flex items-center gap-2">
                    <a
                      href={
                        termsDocUrl.startsWith("http")
                          ? termsDocUrl
                          : `${server_origin}/${termsDocUrl.replace(/^\//, "")}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-indigo-500 hover:text-indigo-600"
                    >
                      <LuFile className="h-3.5 w-3.5" /> View
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setTermsDocUrl(null);
                        form.setFieldsValue({ termsUrl: null });
                      }}
                      className="inline-flex items-center gap-1 text-sm text-red-400 hover:text-red-500"
                    >
                      <LuTrash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Form.Item>

          <Form.Item
            name="economicConditionsUrl"
            label="Economic Conditions Document"
            rules={[{ required: true, message: "Please upload an Economic Conditions document" }]}
          >
            <div>
              <div className="flex items-center gap-3">
                <Upload
                  accept=".pdf,.png,.jpg,.jpeg"
                  maxCount={1}
                  showUploadList={false}
                  beforeUpload={(file) => handleDocUpload(file, setEconomicConditionsUrl, setUploadingEcon, "economicConditionsUrl")}
                >
                  <Button
                    icon={<LuUpload className="h-4 w-4" />}
                    loading={uploadingEcon}
                    className="h-10 rounded-lg"
                  >
                    {economicConditionsUrl ? "Replace Document" : "Upload Document"}
                  </Button>
                </Upload>
                {economicConditionsUrl && (
                  <div className="flex items-center gap-2">
                    <a
                      href={
                        economicConditionsUrl.startsWith("http")
                          ? economicConditionsUrl
                          : `${server_origin}/${economicConditionsUrl.replace(/^\//, "")}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-indigo-500 hover:text-indigo-600"
                    >
                      <LuFile className="h-3.5 w-3.5" /> View
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setEconomicConditionsUrl(null);
                        form.setFieldsValue({ economicConditionsUrl: null });
                      }}
                      className="inline-flex items-center gap-1 text-sm text-red-400 hover:text-red-500"
                    >
                      <LuTrash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Form.Item>
        </div>

        <Form.Item name="highlights" label="Highlights">
          <Select
            mode="tags"
            placeholder="Type and press Enter to add"
            className="[&_.ant-select-selector]:min-h-11 [&_.ant-select-selector]:rounded-lg"
            open={false}
          />
        </Form.Item>

        <Form.Item name="notes" label="Description">
          <Input.TextArea
            rows={3}
            placeholder="Description about this offer..."
            className="rounded-lg"
          />
        </Form.Item>

        <div className="mt-2 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:mt-4 sm:flex-row sm:justify-end">
          <Button onClick={handleCancel} className="h-10 rounded-lg px-5 sm:min-w-[96px]">
            {isImmutable ? "Close" : "Cancel"}
          </Button>
          {!isImmutable && (
            <Button
              type="primary"
              htmlType="submit"
              loading={isCreating || isUpdating}
              className="h-10 rounded-lg bg-[#8b85f6] px-5 font-semibold hover:bg-[#7a74e5] sm:min-w-[136px]"
            >
              {isEdit ? "Save Changes" : "Create Offer"}
            </Button>
          )}
        </div>
      </Form>
    </Modal>
  );
};
