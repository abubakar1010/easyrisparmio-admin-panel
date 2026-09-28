import i18n from "../../../i18n";
import { getApiErrorMessage } from "../../../utils/apiError";
import { Alert, Button, DatePicker, Form, Input, Modal, Select, Switch, Upload, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuUpload, LuFile, LuTrash2 } from "react-icons/lu";
import {
  PAYMENT_METHOD_OPTIONS,
  useCreateOfferMutation,
  useUpdateOfferMutation,
} from "../../../redux/features/Offers/offerApi";
import { useGetSuppliersQuery } from "../../../redux/features/Suppliers/supplierApi";
import { server_origin } from "../../../config";
import {
  CONTRACT_DURATION_MONTH_OPTIONS,
  INDEFINITE_DURATION,
  formatMonths,
  fromContractDurationFormValue,
  type ContractDurationFormValue,
} from "../../../utils/contractDuration";

const numericRule = (t: (key: string, values?: Record<string, unknown>) => string, fieldLabel: string, maxDecimals?: number) => [
  {
    validator: (_: unknown, value: string) => {
      if (!value && value !== "0") return Promise.reject(t("offers_market.required", { field: fieldLabel }));
      if (!/^\d+(\.\d+)?$/.test(value)) return Promise.reject(t("offers_market.valid_number", { field: fieldLabel }));
      if (maxDecimals !== undefined && value.includes(".")) {
        const decimals = value.split(".")[1]?.length || 0;
        if (decimals > maxDecimals)
          return Promise.reject(t("offers_market.max_decimals", { field: fieldLabel, count: maxDecimals }));
      }
      return Promise.resolve();
    },
  },
];

const sanitizeNumeric = (raw: string) => raw.replace(/[^\d.]/g, "").replace(/(\..*?)\./g, "$1");

/** Remove trailing zeros after decimal point: "340000.0000" → "340000", "0.08500" → "0.085", "10.10" → "10.1" */
const trimTrailingZeros = (v: string) => {
  if (!v || !v.includes(".")) return v;
  const trimmed = v.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  return trimmed || "0";
};

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
    onBlur={() => {
      if (value) onChange?.(trimTrailingZeros(value));
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
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const isEdit = mode === "edit";
  const [createOffer, { isLoading: isCreating }] = useCreateOfferMutation();
  const [updateOffer, { isLoading: isUpdating }] = useUpdateOfferMutation();
  const { data: suppliersData } = useGetSuppliersQuery({ limit: 100 });
  const allSuppliers = suppliersData?.data || [];

  // The commodity Select offers electricity / gas / dual — antd cannot infer
  // that from an untyped form, so the domain is stated explicitly here.
  const commodity = Form.useWatch("commodity", form) as
    | "electricity"
    | "gas"
    | "dual"
    | undefined;
  const selectedSupplier = Form.useWatch("supplier", form);

  // Why a supplier cannot carry this offer, or null if it can. Mirrors the
  // backend's checks (OffersService.create) so a listed supplier never fails
  // on save.
  const supplierBlockReason = (s: (typeof allSuppliers)[number]): string | null => {
    if (s.status === "pending_deletion") return t("offers_market.supplier_pending_deletion");
    if (s.status !== "active") return t("offers_market.supplier_inactive");
    if (!commodity || !s.commodity || s.commodity === "dual") return null;
    if (commodity === "dual") return t("offers_market.supplier_needs_dual");
    if (s.commodity !== commodity) {
      return t("offers_market.supplier_commodity_only", { commodity: t(`offers_market.${s.commodity}`) });
    }
    return null;
  };

  const filteredSuppliers = allSuppliers.filter((s) => supplierBlockReason(s) === null);

  // Every supplier is listed, so none seems to be missing: the ones that cannot
  // carry this offer come last, disabled, with the reason beside them.
  const supplierOptions = allSuppliers
    .map((s) => {
      const reason = supplierBlockReason(s);
      return {
        value: s.id,
        label: s.commodity ? `${s.name} (${t(`offers_market.${s.commodity}`)})` : s.name,
        disabled: reason !== null,
        reason,
      };
    })
    .sort((a, b) => Number(a.disabled) - Number(b.disabled));
  const priceType = Form.useWatch("priceType", form);
  const validFrom = Form.useWatch("validFrom", form);
  const contractDuration = Form.useWatch("contractDuration", form) as ContractDurationFormValue | undefined;

  // Standard terms, plus the offer's own if it holds one outside the list
  // (a seeded 6-month offer must still show what it is when edited).
  const durationMonths: number[] = [...CONTRACT_DURATION_MONTH_OPTIONS];
  if (typeof contractDuration === "number" && !durationMonths.includes(contractDuration)) {
    durationMonths.push(contractDuration);
    durationMonths.sort((a, b) => a - b);
  }
  const contractDurationOptions = [
    ...durationMonths.map((months) => ({ value: months, label: formatMonths(months) })),
    { value: INDEFINITE_DURATION, label: formatMonths(null) },
  ];

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

  // Reset supplier selection when commodity changes and current supplier doesn't match
  useEffect(() => {
    if (!open || !commodity || !selectedSupplier) return;
    const stillValid = filteredSuppliers.some((s) => s.id === selectedSupplier);
    if (!stillValid) {
      form.setFieldsValue({ supplier: undefined });
    }
  }, [commodity, filteredSuppliers, selectedSupplier, form, open]);

  // Clear irrelevant pricing fields when price type changes
  useEffect(() => {
    if (!open) return;
    if (priceType === "variable" || priceType === "indexed") {
      form.setFieldsValue({ pricePerKwh: undefined, pricePerSmc: undefined });
    } else if (priceType === "fixed") {
      form.setFieldsValue({ spread: undefined });
    }
  }, [priceType, form, open]);

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
        message.success(t("offers_market.upload_success"));
      } else {
        message.error(getApiErrorMessage({ status: res.status, data: result }, t("offers_market.upload_failed")));
      }
    } catch {
      message.error(t("offers_market.upload_failed"));
    } finally {
      setLoading(false);
    }
    return false;
  };

  const handleSubmit = async (values: Record<string, any>) => {
    // Valid from / until only bound when the offer can be sold. The contract
    // duration is its own field and is never derived from them.
    const startDate = dayjs(values.validFrom ?? null).startOf("day");
    const endDate = dayjs(values.validity ?? null).startOf("day");
    if (!startDate.isValid() || !endDate.isValid() || !endDate.isAfter(startDate)) {
      message.error(t("offers_market.required_fields"));
      return;
    }

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
      spread: values.spread ? parseFloat(values.spread) : undefined,
      contractDurationMonths: fromContractDurationFormValue(values.contractDuration),
      isGreenEnergy: values.isGreenEnergy ?? false,
      validFrom: startDate.format("YYYY-MM-DD"),
      validUntil: endDate.format("YYYY-MM-DD"),
      target: values.target || undefined,
      paymentMethod: values.paymentMethod,
      highlights: values.highlights?.length ? values.highlights : undefined,
      termsUrl: termsDocUrl || undefined,
      economicConditionsUrl: economicConditionsUrl || undefined,
      compensation: values.compensation,
      description: values.notes || undefined,
    };

    try {
      if (isEdit && offerId) {
        await updateOffer({ id: offerId, data: payload }).unwrap();
        message.success(t("offers_market.offer_updated"));
      } else {
        await createOffer(payload).unwrap();
        message.success(t("offers_market.offer_created"));
      }
      form.resetFields();
      onClose();
    } catch (err: any) {
      console.error("Offer save error:", err);
      const msg = getApiErrorMessage(err, t("offers_market.save_failed", { action: isEdit ? t("common.update").toLowerCase() : t("common.create").toLowerCase() }));
      message.error(msg);
    }
  };

  const handleFinishFailed = () => {
    message.error(t("offers_market.required_fields"));
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
          {isEdit ? t("offers_market.edit_offer") : t("offers_market.create_new_offer")}
        </span>
      }
      className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-4 sm:[&_.ant-modal-content]:p-6 [&_.ant-modal-header]:rounded-t-2xl [&_.ant-modal-body]:pt-3"
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} onFinishFailed={handleFinishFailed} className="pt-1" disabled={isImmutable}>
        {isImmutable && (
          <Alert
            type="warning"
            showIcon
            className="mb-4"
            message={t("offers_market.offer_locked_message")}
          />
        )}
        {/* General Information */}
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          {t("offers_market.general_information")}
        </p>
        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
          <Form.Item
            name="offerName"
            label={t("offers_market.offer_name")}
            rules={[{ required: true, message: t("offers_market.required", { field: t("offers_market.offer_name").toLowerCase() }) }]}
          >
            <Input placeholder={i18n.t("audit.e_g_trend_home_electricity")} className="h-11 rounded-lg" />
          </Form.Item>
          <Form.Item name="offerCode" label={t("offers_market.offer_code")} rules={[{ required: true, message: t("offers_market.required", { field: t("offers_market.offer_code").toLowerCase() }) }]}>
            <Input placeholder={i18n.t("audit.e_g_off_007")} className="h-11 rounded-lg" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
          <Form.Item
            name="supplier"
            label={t("offers_market.supplier")}
            rules={[{ required: true, message: t("offers_market.select_supplier") }]}
            help={
              commodity && filteredSuppliers.length === 0
                ? t("offers_market.no_suppliers_for_commodity")
                : undefined
            }
          >
            <Select
              size="large"
              placeholder={t("offers_market.select_supplier")}
              showSearch
              optionFilterProp="label"
              className="[&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-lg"
              notFoundContent={t("offers_market.no_suppliers_found")}
              options={supplierOptions}
              optionRender={(option) => (
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate">{option.data.label}</span>
                  {option.data.reason && (
                    <span className="shrink-0 text-xs text-slate-400">{option.data.reason}</span>
                  )}
                </div>
              )}
            />
          </Form.Item>
          <Form.Item
            name="commodity"
            label={t("offers_market.commodity")}
            rules={[{ required: true, message: t("offers_market.select_commodity") }]}
          >
            <Select
              size="large"
              placeholder={t("offers_market.select_commodity")}
              className="[&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-lg"
              options={[
                { value: "electricity", label: t("offers_market.electricity") },
                { value: "gas", label: t("offers_market.gas") },
                { value: "dual", label: t("offers_market.dual") },
              ]}
            />
          </Form.Item>
        </div>

        {/* Pricing */}
        <p className="mb-2 mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">
          {t("offers_market.pricing")}
        </p>
        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-3">
          <Form.Item
            name="priceType"
            label={t("offers_market.price_type")}
            rules={[{ required: true, message: t("offers_market.select_price_type") }]}
          >
            <Select
              size="large"
              placeholder={t("offers_market.select_price_type")}
              className="[&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-lg"
              options={[
                { value: "fixed", label: t("offers_market.price_fixed") },
                { value: "variable", label: t("offers_market.price_variable") },
                { value: "indexed", label: t("offers_market.price_indexed") },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="fixedMonthlyFee"
            label={`${t("offers_market.fixed_monthly_fee")} (EUR)`}
            rules={numericRule(t, t("offers_market.fixed_monthly_fee").toLowerCase(), 2)}
          >
            <NumericInput placeholder={i18n.t("audit.e_g_9_90")} />
          </Form.Item>
          <Form.Item
            name="activationCost"
            label={`${t("offers_market.activation_cost")} (EUR)`}
            rules={numericRule(t, t("offers_market.activation_cost").toLowerCase(), 2)}
          >
            <NumericInput placeholder={i18n.t("audit.e_g_45")} />
          </Form.Item>
        </div>

        {priceType === "variable" || priceType === "indexed" ? (
          <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
            <Form.Item name="spread" label={`${t("offers_market.spread")} (EUR)`} rules={numericRule(t, t("offers_market.spread").toLowerCase())}>
              <NumericInput placeholder={i18n.t("audit.e_g_0_012")} />
            </Form.Item>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
            {(commodity === "electricity" || commodity === "dual" || !commodity) && (
              <Form.Item name="pricePerKwh" label={`${t("offers_market.price_per_kwh")} (EUR)`} rules={numericRule(t, t("offers_market.price_per_kwh").toLowerCase())}>
                <NumericInput placeholder={i18n.t("audit.e_g_0_085")} />
              </Form.Item>
            )}
            {(commodity === "gas" || commodity === "dual" || !commodity) && (
              <Form.Item name="pricePerSmc" label={`${t("offers_market.price_per_smc")} (EUR)`} rules={numericRule(t, t("offers_market.price_per_smc").toLowerCase())}>
                <NumericInput placeholder={i18n.t("audit.e_g_0_45")} />
              </Form.Item>
            )}
          </div>
        )}

        {/* Contract & Validity */}
        <p className="mb-2 mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">
          {t("offers_market.contract_validity")}
        </p>
        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
          <Form.Item
            name="contractDuration"
            label={t("offers_market.contract_duration")}
            extra={t("offers_market.contract_duration_hint")}
            rules={[{ required: true, message: t("offers_market.select_contract_duration") }]}
          >
            <Select
              size="large"
              placeholder={t("offers_market.select_contract_duration")}
              className="[&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-lg"
              options={contractDurationOptions}
            />
          </Form.Item>
        </div>
        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
          <Form.Item name="validFrom" label={t("offers_market.valid_from")} rules={[{ required: true, message: t("offers_market.valid_from") }]}>
            <DatePicker
              className="h-11! w-full rounded-lg"
              format="DD/MM/YYYY"
              inputReadOnly
              disabledDate={(current) => current < dayjs().startOf("day")}
            />
          </Form.Item>
          <Form.Item name="validity" label={t("offers_market.valid_until")} rules={[{ required: true, message: t("offers_market.valid_until") }]}>
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

        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2 lg:grid-cols-4">
          <Form.Item name="target" label={t("offers_market.target")} rules={[{ required: true, message: t("offers_market.select_target") }]}>
            <Select
              size="large"
              placeholder={t("offers_market.select_target")}
              className="[&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-lg"
              options={[
                { value: "personal", label: t("offers_market.personal") },
                { value: "business", label: t("offers_market.business") },
                { value: "both", label: t("offers_market.both") },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="paymentMethod"
            label={t("offers_market.payment_method")}
            rules={[{ required: true, message: t("offers_market.select_payment_method") }]}
          >
            <Select
              size="large"
              placeholder={t("offers_market.select_payment_method")}
              className="[&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-lg"
              options={PAYMENT_METHOD_OPTIONS.map((option) => ({ ...option, label: t(`offers_market.${option.value}`) }))}
            />
          </Form.Item>
          <Form.Item name="status" label={t("common.status")} rules={[{ required: true, message: t("offers_market.select_status") }]}>
            <Select
              size="large"
              placeholder={t("offers_market.select_status")}
              disabled={isEdit}
              className="[&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-lg"
              options={
                isEdit
                  ? [
                      ...["draft", "active", "expiring", "expired", "archived"].map((value) => ({ value, label: t(`offers_market.${value}`) })),
                    ]
                  : [
                      ...["draft", "active"].map((value) => ({ value, label: t(`offers_market.${value}`) })),
                    ]
              }
            />
          </Form.Item>
          <Form.Item name="isGreenEnergy" label={t("offers_market.green_energy")} valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>
        </div>

        {/* Additional Details */}
        <p className="mb-2 mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">
          {t("offers_market.additional_details")}
        </p>

        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
          <Form.Item
            name="termsUrl"
            label={t("offers_market.terms_document")}
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
                    {termsDocUrl ? t("offers_market.replace_document") : t("offers_market.upload_document")}
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
                      <LuFile className="h-3.5 w-3.5" /> {t("common.view")}
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setTermsDocUrl(null);
                        form.setFieldsValue({ termsUrl: null });
                      }}
                      className="inline-flex items-center gap-1 text-sm text-red-400 hover:text-red-500"
                    >
                      <LuTrash2 className="h-3.5 w-3.5" /> {t("common.remove")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Form.Item>

          <Form.Item
            name="economicConditionsUrl"
            label={t("offers_market.economic_conditions_document")}
            rules={[{ required: true, message: t("offers_market.economic_conditions_document") }]}
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
                    {economicConditionsUrl ? t("offers_market.replace_document") : t("offers_market.upload_document")}
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
                      <LuFile className="h-3.5 w-3.5" /> {t("common.view")}
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setEconomicConditionsUrl(null);
                        form.setFieldsValue({ economicConditionsUrl: null });
                      }}
                      className="inline-flex items-center gap-1 text-sm text-red-400 hover:text-red-500"
                    >
                      <LuTrash2 className="h-3.5 w-3.5" /> {t("common.remove")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Form.Item>
        </div>

        <Form.Item name="highlights" label={t("offers_market.highlights")}>
          <Select
            mode="tags"
            placeholder={t("offers_market.add_highlight")}
            className="[&_.ant-select-selector]:min-h-11 [&_.ant-select-selector]:rounded-lg"
            open={false}
          />
        </Form.Item>

        <Form.Item
          name="compensation"
          label={t("offers_market.compensation")}
          rules={[{ required: true, message: t("offers_market.required", { field: t("offers_market.compensation").toLowerCase() }) }]}
        >
          <Input.TextArea
            rows={2}
            placeholder={i18n.t("audit.e_g_50_bonus_on_first_bill_cashback_etc")}
            className="rounded-lg"
          />
        </Form.Item>

        <Form.Item name="notes" label={t("offers_market.description_label")}>
          <Input.TextArea
            rows={3}
            placeholder={t("offers_market.description_label")}
            className="rounded-lg"
          />
        </Form.Item>

        <div className="mt-2 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:mt-4 sm:flex-row sm:justify-end">
          <Button onClick={handleCancel} className="h-10 rounded-lg px-5 sm:min-w-[96px]">
            {isImmutable ? t("common.close") : t("common.cancel")}
          </Button>
          {!isImmutable && (
            <Button
              type="primary"
              htmlType="submit"
              loading={isCreating || isUpdating}
              className="h-10 rounded-lg bg-[#8b85f6] px-5 font-semibold hover:bg-[#7a74e5] sm:min-w-[136px]"
            >
              {isEdit ? t("offers_market.save_changes") : t("offers_market.create_offer")}
            </Button>
          )}
        </div>
      </Form>
    </Modal>
  );
};
