import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, Switch, Upload, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { LuUpload, LuFile, LuTrash2 } from "react-icons/lu";
import { useCreateOfferMutation, useUpdateOfferMutation } from "../../../redux/features/Offers/offerApi";
import { useGetSuppliersQuery } from "../../../redux/features/Suppliers/supplierApi";
import { server_origin } from "../../../config";

type CreateOfferModalProps = {
  open: boolean;
  onClose: () => void;
  mode?: "add" | "edit";
  offerId?: string;
  initialValues?: Record<string, unknown>;
};

export const CreateOfferModal = ({
  open,
  onClose,
  mode = "add",
  offerId,
  initialValues,
}: CreateOfferModalProps) => {
  const [form] = Form.useForm();
  const isEdit = mode === "edit";
  const [createOffer, { isLoading: isCreating }] = useCreateOfferMutation();
  const [updateOffer, { isLoading: isUpdating }] = useUpdateOfferMutation();
  const { data: suppliersData } = useGetSuppliersQuery({ limit: 100 });
  const suppliers = suppliersData?.data || [];

  const commodity = Form.useWatch("commodity", form);

  const [economicConditionsUrl, setEconomicConditionsUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (isEdit && initialValues) {
      form.setFieldsValue(initialValues);
      setEconomicConditionsUrl((initialValues.economicConditionsUrl as string) || null);
    } else {
      form.resetFields();
      setEconomicConditionsUrl(null);
    }
  }, [open, isEdit, initialValues, form]);

  const handleEconDocUpload = async (file: File) => {
    setUploading(true);
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
      if (res.ok && result?.url) {
        setEconomicConditionsUrl(result.url);
        message.success("Document uploaded successfully");
      } else {
        message.error(result?.message || "Upload failed");
      }
    } catch {
      message.error("Upload failed");
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleSubmit = async (values: Record<string, any>) => {
    if (!economicConditionsUrl) {
      message.error("Please upload an Economic Conditions document");
      return;
    }

    const payload = {
      name: values.offerName,
      offerCode: values.offerCode || undefined,
      supplierId: values.supplier,
      energyType: values.commodity?.toLowerCase(),
      marketType: values.priceType?.toLowerCase(),
      offerStatus: values.status?.toLowerCase() || "draft",
      activationCost: values.commission ?? 0,
      fixedMonthlyFee: values.fixedMonthlyFee ?? 0,
      pricePerKwh: values.pricePerKwh ?? undefined,
      pricePerSmc: values.pricePerSmc ?? undefined,
      contractDurationMonths: values.durationMonths || 12,
      isGreenEnergy: values.isGreenEnergy ?? false,
      validFrom: values.validFrom
        ? dayjs(values.validFrom).format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD"),
      validUntil: values.validity
        ? dayjs(values.validity).format("YYYY-MM-DD")
        : undefined,
      target: values.target || undefined,
      highlights: values.highlights?.length ? values.highlights : undefined,
      termsUrl: values.termsUrl || undefined,
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
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="pt-1">
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
            rules={[{ required: true, message: "Required" }]}
            initialValue={0}
          >
            <InputNumber
              min={0}
              step={0.01}
              className="w-full! rounded-lg [&_.ant-input-number-input]:h-11"
              controls={false}
              placeholder="e.g. 9.90"
            />
          </Form.Item>
          <Form.Item
            name="commission"
            label="Activation Cost (EUR)"
            rules={[{ required: true, message: "Required" }]}
            initialValue={0}
          >
            <InputNumber
              min={0}
              step={0.01}
              className="w-full! rounded-lg [&_.ant-input-number-input]:h-11"
              controls={false}
              placeholder="e.g. 45"
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
          {(commodity === "electricity" || commodity === "dual" || !commodity) && (
            <Form.Item name="pricePerKwh" label="Price per kWh (EUR)">
              <InputNumber
                min={0}
                step={0.001}
                className="w-full! rounded-lg [&_.ant-input-number-input]:h-11"
                controls={false}
                placeholder="e.g. 0.085"
              />
            </Form.Item>
          )}
          {(commodity === "gas" || commodity === "dual" || !commodity) && (
            <Form.Item name="pricePerSmc" label="Price per SMc (EUR)">
              <InputNumber
                min={0}
                step={0.001}
                className="w-full! rounded-lg [&_.ant-input-number-input]:h-11"
                controls={false}
                placeholder="e.g. 0.45"
              />
            </Form.Item>
          )}
        </div>

        {/* Contract & Validity */}
        <p className="mb-2 mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">
          Contract & Validity
        </p>
        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-3">
          <Form.Item
            name="durationMonths"
            label="Contract Duration (months)"
            rules={[{ required: true, message: "Required" }]}
            initialValue={12}
          >
            <InputNumber
              min={1}
              max={120}
              className="w-full! rounded-lg [&_.ant-input-number-input]:h-11"
              controls={false}
              placeholder="e.g. 12"
            />
          </Form.Item>
          <Form.Item name="validFrom" label="Valid From" initialValue={dayjs()}>
            <DatePicker className="h-11! w-full rounded-lg" format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="validity" label="Valid Until">
            <DatePicker className="h-11! w-full rounded-lg" format="DD/MM/YYYY" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-3">
          <Form.Item name="target" label="Target" initialValue="both">
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
          <Form.Item name="status" label="Status" initialValue="draft">
            <Select
              size="large"
              placeholder="Select status"
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
          <Form.Item name="isGreenEnergy" label="Green Energy" valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>
        </div>

        {/* Additional Details */}
        <p className="mb-2 mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">
          Additional Details
        </p>
        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
          <Form.Item name="termsUrl" label="Terms & Conditions URL" rules={[{ type: "url", message: "Please enter a valid URL" }]}>
            <Input placeholder="https://..." className="h-11 rounded-lg" />
          </Form.Item>
          <Form.Item name="highlights" label="Highlights">
            <Select
              mode="tags"
              placeholder="Type and press Enter to add"
              className="[&_.ant-select-selector]:min-h-11 [&_.ant-select-selector]:rounded-lg"
              open={false}
            />
          </Form.Item>
        </div>

        <div className="mb-3">
          <p className="mb-1 text-sm text-slate-600">
            <span className="mr-1 text-red-500">*</span>Economic Conditions Document
          </p>
          <div className="flex items-center gap-3">
            <Upload
              accept=".pdf,.png,.jpg,.jpeg"
              maxCount={1}
              showUploadList={false}
              beforeUpload={handleEconDocUpload}
            >
              <Button
                icon={<LuUpload className="h-4 w-4" />}
                loading={uploading}
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
                  onClick={() => setEconomicConditionsUrl(null)}
                  className="inline-flex items-center gap-1 text-sm text-red-400 hover:text-red-500"
                >
                  <LuTrash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            )}
          </div>
        </div>

        <Form.Item name="notes" label="Description">
          <Input.TextArea
            rows={3}
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
            loading={isCreating || isUpdating}
            className="h-10 rounded-lg bg-[#8b85f6] px-5 font-semibold hover:bg-[#7a74e5] sm:min-w-[136px]"
          >
            {isEdit ? "Save Changes" : "Create Offer"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
