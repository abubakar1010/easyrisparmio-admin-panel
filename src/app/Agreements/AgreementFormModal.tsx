import { getApiErrorMessage } from "../../utils/apiError";
import i18n from '../../i18n';
import { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Select, DatePicker, Switch, Button, message } from "antd";
import { FiX, FiPlus, FiTrash2 } from "react-icons/fi";
import dayjs from "dayjs";
import {
  useCreateAgreementMutation,
  useUpdateAgreementMutation,
} from "../../redux/features/Agreements/agreementApi";
import { useTranslation } from "react-i18next";

interface AgreementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "add" | "edit";
  agreementId?: string;
  initialValues?: Record<string, unknown>;
}

const { Option } = Select;
const { TextArea } = Input;

const MAX_HOW_TO_USE_STEPS = 10;

const AgreementFormModal = ({ isOpen, onClose, mode = "add", agreementId, initialValues }: AgreementFormModalProps) => {
  const [form] = Form.useForm();
  const isEdit = mode === "edit";
  const { t } = useTranslation();

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

  /**
   * Emptying an optional input has to reach the API as an explicit `null` so the
   * column is cleared — omitting the key leaves the old value in place. On
   * create there is nothing to clear, so an empty input is simply left out.
   */
  const clearable = <T,>(value: T | "" | null | undefined): T | null | undefined => {
    const normalised = typeof value === "string" ? value.trim() : value;
    if (normalised === "" || normalised === null || normalised === undefined) {
      return isEdit ? null : undefined;
    }
    return normalised as T;
  };

  const handleFinish = async (values: Record<string, any>) => {
    const steps: string[] = (values.howToUse ?? [])
      .map((step: string | undefined) => (step ?? "").trim())
      .filter(Boolean);

    const payload: Record<string, any> = {
      title: values.title,
      partnerName: values.partnerName,
      partnerLogoUrl: clearable(values.partnerLogoUrl),
      termsUrl: clearable(values.termsUrl),
      address: clearable(values.address),
      discountDescription: clearable(values.discountDescription),
      discountHeadline: clearable(values.discountHeadline),
      discountCode: clearable(values.discountCode),
      howToUse: steps.length > 0 ? steps : isEdit ? null : undefined,
      description: clearable(values.description),
      validFrom: dayjs(values.validFrom).format("YYYY-MM-DD"),
      validUntil: values.validUntil ? dayjs(values.validUntil).format("YYYY-MM-DD") : clearable(""),
      targetAudience: values.targetAudience || undefined,
      sortOrder: values.sortOrder ?? undefined,
      isActive: values.isActive,
    };

    // `null` is meaningful (clear the column); only `undefined` is dropped.
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    try {
      if (isEdit && agreementId) {
        await updateAgreement({ id: agreementId, data: payload }).unwrap();
        message.success(t("agreements.agreement_updated"));
      } else {
        await createAgreement(payload as any).unwrap();
        message.success(t("agreements.agreement_created"));
      }
      onClose();
      if (!isEdit) form.resetFields();
    } catch (err: any) {
      message.error(getApiErrorMessage(err, t("common.generic_error")));
    }
  };

  const labelClass = "text-xs font-bold uppercase tracking-wider text-slate-500";

  return (
    <Modal
      title={
        <div className="py-2">
          <h2 className="text-xl font-bold text-slate-800">{isEdit ? t("agreements.edit_agreement") : t("agreements.add_agreement")}</h2>
          <p className="text-xs font-medium text-slate-400">{t("agreements.form_description")}</p>
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
        initialValues={{ isActive: true, targetAudience: "both", sortOrder: 0, howToUse: [] }}
      >
        {/* Agreement Info */}
        <section>
          <h3 className="mb-4 px-1 text-[15px] font-bold text-slate-800">{t("agreements.form_information")}</h3>
          <div className="grid grid-cols-1 gap-x-4 gap-y-1 rounded-xl border border-slate-100 bg-slate-50/50 p-4 md:grid-cols-2">
            <Form.Item
              label={<span className={labelClass}>{t("agreements.agreement_title")}</span>}
              name="title"
              rules={[{ required: true, message: t("agreements.title_required") }]}
            >
              <Input placeholder={i18n.t("audit.e_g_20_off_on_smart_home_kit")} className="h-10 rounded-lg border-slate-200" />
            </Form.Item>
            <Form.Item
              label={<span className={labelClass}>{t("agreements.partner_name")}</span>}
              name="partnerName"
              rules={[{ required: true, message: t("agreements.partner_name_required") }]}
            >
              <Input placeholder={i18n.t("audit.e_g_enel_x")} className="h-10 rounded-lg border-slate-200" />
            </Form.Item>
            <Form.Item
              label={<span className={labelClass}>{t("agreements.partner_image_url")}</span>}
              name="partnerLogoUrl"
              rules={[{ type: "url", message: t("agreements.valid_url") }]}
              extra={<span className="text-[11px] text-slate-400">{t("agreements.banner_hint")}</span>}
            >
              <Input placeholder="https://..." className="h-10 rounded-lg border-slate-200" />
            </Form.Item>
            <Form.Item
              label={<span className={labelClass}>{t("agreements.terms_url")}</span>}
              name="termsUrl"
              rules={[{ type: "url", message: t("agreements.valid_url") }]}
            >
              <Input placeholder="https://..." className="h-10 rounded-lg border-slate-200" />
            </Form.Item>
            <Form.Item
              label={<span className={labelClass}>{t("agreements.address")}</span>}
              name="address"
              className="md:col-span-2"
              extra={<span className="text-[11px] text-slate-400">{t("agreements.address_hint")}</span>}
            >
              <Input placeholder={i18n.t("audit.e_g_via_cesare_sersale_1_80139_napoli_na_italia")} className="h-10 rounded-lg border-slate-200" />
            </Form.Item>
          </div>
        </section>

        {/* Discount & Description */}
        <section>
          <h3 className="mb-4 px-1 text-[15px] font-bold text-slate-800">{t("agreements.discount_description")}</h3>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-1">
            <div className="grid grid-cols-1 gap-x-4 gap-y-1 md:grid-cols-2">
              <Form.Item
                label={<span className={labelClass}>{t("agreements.discount_headline")}</span>}
                name="discountHeadline"
                rules={[{ max: 60, message: t("agreements.max_characters", { count: 60 }) }]}
                extra={<span className="text-[11px] text-slate-400">{t("agreements.discount_headline_hint")}</span>}
              >
                <Input placeholder={i18n.t("audit.e_g_20")} className="h-10 rounded-lg border-slate-200" />
              </Form.Item>
              <Form.Item
                label={<span className={labelClass}>{t("agreements.discount_code")}</span>}
                name="discountCode"
                rules={[{ max: 50, message: t("agreements.max_characters", { count: 50 }) }]}
                extra={<span className="text-[11px] text-slate-400">{t("agreements.discount_code_hint")}</span>}
              >
                <Input placeholder={i18n.t("audit.e_g_easy20")} className="h-10 rounded-lg border-slate-200" />
              </Form.Item>
            </div>
            <Form.Item label={<span className={labelClass}>{t("agreements.discount_description_field")}</span>} name="discountDescription">
              <Input placeholder={i18n.t("audit.e_g_15_off_the_entire_menu_code_easy15")} className="h-10 rounded-lg border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className={labelClass}>{t("agreements.description_field")}</span>} name="description" className="mb-0">
              <TextArea rows={3} placeholder={t("agreements.description_placeholder")} className="rounded-lg border-slate-200 p-3" />
            </Form.Item>
          </div>
        </section>

        {/* How to Use */}
        <section>
          <h3 className="mb-1 px-1 text-[15px] font-bold text-slate-800">{t("agreements.how_to_use")}</h3>
          <p className="mb-4 px-1 text-xs font-medium text-slate-400">
            {t("agreements.how_to_use_hint")}
          </p>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <Form.List name="howToUse">
              {(fields, { add, remove }) => (
                <div className="space-y-2">
                  {fields.map(({ key, name, ...restField }, index) => (
                    <div key={key} className="flex items-start gap-2">
                      <span className="mt-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8b85f6] text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <Form.Item
                        {...restField}
                        name={name}
                        className="mb-0 flex-1"
                        rules={[{ max: 300, message: t("agreements.max_characters", { count: 300 }) }]}
                      >
                        <Input placeholder={t("agreements.step_placeholder")} className="h-10 rounded-lg border-slate-200" />
                      </Form.Item>
                      <Button
                        type="text"
                        className="mt-1"
                        icon={<FiTrash2 className="text-rose-400" />}
                        onClick={() => remove(name)}
                      />
                    </div>
                  ))}
                  <Button
                    type="dashed"
                    block
                    icon={<FiPlus />}
                    disabled={fields.length >= MAX_HOW_TO_USE_STEPS}
                    onClick={() => add("")}
                    className="h-10 rounded-lg border-slate-300 font-medium text-slate-600"
                  >
                    {fields.length >= MAX_HOW_TO_USE_STEPS ? t("agreements.max_steps", { count: MAX_HOW_TO_USE_STEPS }) : t("agreements.add_step")}
                  </Button>
                </div>
              )}
            </Form.List>
          </div>
        </section>

        {/* Validity & Settings */}
        <section>
          <h3 className="mb-4 px-1 text-[15px] font-bold text-slate-800">{t("agreements.validity_settings")}</h3>
          <div className="grid grid-cols-1 gap-x-4 gap-y-1 rounded-xl border border-slate-100 bg-slate-50/50 p-4 md:grid-cols-2">
            <Form.Item
              label={<span className={labelClass}>{t("agreements.valid_from")}</span>}
              name="validFrom"
              rules={[{ required: true, message: t("agreements.start_date_required") }]}
            >
              <DatePicker className="h-10! w-full rounded-lg border-slate-200" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item
              label={<span className={labelClass}>{t("agreements.valid_until")}</span>}
              name="validUntil"
              dependencies={["validFrom"]}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const from = getFieldValue("validFrom");
                    if (!value || !from || !dayjs(value).isBefore(dayjs(from), "day")) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(t("agreements.end_date_before_start")));
                  },
                }),
              ]}
            >
              <DatePicker className="h-10! w-full rounded-lg border-slate-200" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item label={<span className={labelClass}>{t("agreements.audience")}</span>} name="targetAudience">
              <Select placeholder={t("agreements.select_audience")} className="h-10 rounded-lg border-slate-200" popupClassName="rounded-xl">
                <Option value="personal">{t("client_management.private")}</Option>
                <Option value="business">{t("client_management.business")}</Option>
                <Option value="both">{t("agreements.both")}</Option>
              </Select>
            </Form.Item>
            <Form.Item label={<span className={labelClass}>{t("agreements.sort_order")}</span>} name="sortOrder">
              <InputNumber min={0} controls={false} placeholder="0" className="w-full! rounded-lg [&_.ant-input-number-input]:h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className={labelClass}>{t("common.active")}</span>} name="isActive" valuePropName="checked">
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
            {isEdit ? t("common.save_changes") : t("agreements.save_agreement")}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AgreementFormModal;
