import { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Select, DatePicker, Switch, Button, message } from "antd";
import { FiX, FiPlus, FiTrash2 } from "react-icons/fi";
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

const MAX_HOW_TO_USE_STEPS = 10;

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

  const labelClass = "text-xs font-bold uppercase tracking-wider text-slate-500";

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
        initialValues={{ isActive: true, targetAudience: "both", sortOrder: 0, howToUse: [] }}
      >
        {/* Agreement Info */}
        <section>
          <h3 className="mb-4 px-1 text-[15px] font-bold text-slate-800">Agreement Information</h3>
          <div className="grid grid-cols-1 gap-x-4 gap-y-1 rounded-xl border border-slate-100 bg-slate-50/50 p-4 md:grid-cols-2">
            <Form.Item
              label={<span className={labelClass}>Agreement Title</span>}
              name="title"
              rules={[{ required: true, message: "Title is required" }]}
            >
              <Input placeholder="E.g.: 20% Off on Smart Home Kit" className="h-10 rounded-lg border-slate-200" />
            </Form.Item>
            <Form.Item
              label={<span className={labelClass}>Partner Name</span>}
              name="partnerName"
              rules={[{ required: true, message: "Partner name is required" }]}
            >
              <Input placeholder="E.g.: Enel X" className="h-10 rounded-lg border-slate-200" />
            </Form.Item>
            <Form.Item
              label={<span className={labelClass}>Partner Image URL</span>}
              name="partnerLogoUrl"
              rules={[{ type: "url", message: "Enter a valid URL" }]}
              extra={<span className="text-[11px] text-slate-400">Shown as the banner on the app detail screen — landscape images work best.</span>}
            >
              <Input placeholder="https://..." className="h-10 rounded-lg border-slate-200" />
            </Form.Item>
            <Form.Item
              label={<span className={labelClass}>Terms & Conditions URL</span>}
              name="termsUrl"
              rules={[{ type: "url", message: "Enter a valid URL" }]}
            >
              <Input placeholder="https://..." className="h-10 rounded-lg border-slate-200" />
            </Form.Item>
            <Form.Item
              label={<span className={labelClass}>Address</span>}
              name="address"
              className="md:col-span-2"
              extra={<span className="text-[11px] text-slate-400">Opened in Google Maps from the app — write a complete, searchable address.</span>}
            >
              <Input placeholder="E.g.: Via Cesare Sersale 1, 80139 Napoli NA, Italia" className="h-10 rounded-lg border-slate-200" />
            </Form.Item>
          </div>
        </section>

        {/* Discount & Description */}
        <section>
          <h3 className="mb-4 px-1 text-[15px] font-bold text-slate-800">Discount & Description</h3>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-1">
            <div className="grid grid-cols-1 gap-x-4 gap-y-1 md:grid-cols-2">
              <Form.Item
                label={<span className={labelClass}>Discount Headline</span>}
                name="discountHeadline"
                rules={[{ max: 60, message: "Keep it under 60 characters" }]}
                extra={<span className="text-[11px] text-slate-400">The large figure in the app. Keep it short: "20%", "5 cent/litro".</span>}
              >
                <Input placeholder="E.g.: 20%" className="h-10 rounded-lg border-slate-200" />
              </Form.Item>
              <Form.Item
                label={<span className={labelClass}>Discount Code</span>}
                name="discountCode"
                rules={[{ max: 50, message: "Keep it under 50 characters" }]}
                extra={<span className="text-[11px] text-slate-400">Copied by the user with one tap. Leave empty if no code is needed.</span>}
              >
                <Input placeholder="E.g.: EASY20" className="h-10 rounded-lg border-slate-200" />
              </Form.Item>
            </div>
            <Form.Item label={<span className={labelClass}>Discount Description</span>} name="discountDescription">
              <Input placeholder="E.g.: 15% off the entire menu. Code: EASY15" className="h-10 rounded-lg border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className={labelClass}>Description</span>} name="description" className="mb-0">
              <TextArea rows={3} placeholder="Describe the agreement details and conditions..." className="rounded-lg border-slate-200 p-3" />
            </Form.Item>
          </div>
        </section>

        {/* How to Use */}
        <section>
          <h3 className="mb-1 px-1 text-[15px] font-bold text-slate-800">How to Use</h3>
          <p className="mb-4 px-1 text-xs font-medium text-slate-400">
            Numbered steps shown to the customer. Leave empty to use the app's generic steps.
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
                        rules={[{ max: 300, message: "Keep each step under 300 characters" }]}
                      >
                        <Input placeholder="E.g.: Show the code to the staff before ordering" className="h-10 rounded-lg border-slate-200" />
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
                    {fields.length >= MAX_HOW_TO_USE_STEPS ? `Maximum ${MAX_HOW_TO_USE_STEPS} steps` : "Add step"}
                  </Button>
                </div>
              )}
            </Form.List>
          </div>
        </section>

        {/* Validity & Settings */}
        <section>
          <h3 className="mb-4 px-1 text-[15px] font-bold text-slate-800">Validity & Settings</h3>
          <div className="grid grid-cols-1 gap-x-4 gap-y-1 rounded-xl border border-slate-100 bg-slate-50/50 p-4 md:grid-cols-2">
            <Form.Item
              label={<span className={labelClass}>Valid From</span>}
              name="validFrom"
              rules={[{ required: true, message: "Start date is required" }]}
            >
              <DatePicker className="h-10! w-full rounded-lg border-slate-200" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item
              label={<span className={labelClass}>Valid Until</span>}
              name="validUntil"
              dependencies={["validFrom"]}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const from = getFieldValue("validFrom");
                    if (!value || !from || !dayjs(value).isBefore(dayjs(from), "day")) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("End date cannot be before the start date"));
                  },
                }),
              ]}
            >
              <DatePicker className="h-10! w-full rounded-lg border-slate-200" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item label={<span className={labelClass}>Target Audience</span>} name="targetAudience">
              <Select placeholder="Select audience" className="h-10 rounded-lg border-slate-200" popupClassName="rounded-xl">
                <Option value="personal">Personal</Option>
                <Option value="business">Business</Option>
                <Option value="both">Both</Option>
              </Select>
            </Form.Item>
            <Form.Item label={<span className={labelClass}>Sort Order</span>} name="sortOrder">
              <InputNumber min={0} controls={false} placeholder="0" className="w-full! rounded-lg [&_.ant-input-number-input]:h-10 border-slate-200" />
            </Form.Item>
            <Form.Item label={<span className={labelClass}>Active</span>} name="isActive" valuePropName="checked">
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
