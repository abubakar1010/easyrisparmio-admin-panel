import { useEffect } from "react";
import { Button, Form, Input, InputNumber, Modal, Select, Switch } from "antd";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import {
  COMMODITY_OPTIONS,
  CONTRACT_TYPE_OPTIONS,
  FREQUENCY_OPTIONS,
  OFFER_OPTIONS,
  SUPPLIER_OPTIONS,
  STRUCTURE_LABELS,
  type CommissionRule,
  type StructureType,
} from "../types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (rule: CommissionRule) => void;
  editingRule?: CommissionRule | null;
};

const STRUCTURE_TYPES: StructureType[] = ["one-time", "recurring", "tiered", "hybrid"];

const sectionTitle = "text-sm font-semibold text-slate-800";
const inputCls = "h-11 rounded-lg";
const selectCls =
  "[&_.ant-select-selector]:h-11! [&_.ant-select-selector]:rounded-lg [&_.ant-select-selection-item]:leading-[42px]! [&_.ant-select-selection-placeholder]:leading-[42px]!";

export const CreateCommissionRuleModal = ({ open, onClose, onSubmit, editingRule }: Props) => {
  const [form] = Form.useForm();
  const structureType: StructureType = Form.useWatch("structureType", form) ?? "one-time";
  const isEditing = !!editingRule;

  useEffect(() => {
    if (!open) return;
    if (editingRule) {
      form.setFieldsValue({
        ...editingRule,
        tiers: editingRule.tiers?.length ? editingRule.tiers : [{ from: undefined, to: undefined }],
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        structureType: "one-time",
        duration: 12,
        allowReversals: true,
        clawbackDays: 90,
        tiers: [{ from: undefined, to: undefined }],
      });
    }
  }, [open, editingRule, form]);

  const handleSubmit = (values: any) => {
    const rule: CommissionRule = {
      id: editingRule?.id ?? `rule-${Date.now()}`,
      name: values.name,
      supplier: values.supplier,
      offer: values.offer,
      commodity: values.commodity,
      contractType: values.contractType,
      duration: Number(values.duration),
      structureType: values.structureType,
      status: editingRule?.status ?? "Active",
      allowReversals: !!values.allowReversals,
      clawbackDays: values.allowReversals ? Number(values.clawbackDays) || 0 : undefined,
      bonusAmount: values.bonusAmount != null ? Number(values.bonusAmount) : undefined,
      bonusCondition: values.bonusCondition || undefined,
    };

    if (values.structureType === "one-time" || values.structureType === "hybrid") {
      rule.initialFee = Number(values.initialFee);
    }
    if (values.structureType === "recurring" || values.structureType === "hybrid") {
      rule.recurringFee = Number(values.recurringFee);
      rule.frequency = values.frequency;
    }
    if (values.structureType === "tiered") {
      rule.tiers = (values.tiers ?? []).map((t: any) => ({ from: Number(t.from), to: Number(t.to) }));
    }

    onSubmit(rule);
    form.resetFields();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      centered
      width="min(780px, calc(100vw - 24px))"
      title={<span className="text-lg! font-bold text-slate-800">{isEditing ? "Edit Commission Rule" : "Create Commission Rule"}</span>}
      className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-0 [&_.ant-modal-header]:rounded-t-2xl [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-slate-100 [&_.ant-modal-header]:px-6 [&_.ant-modal-header]:pt-5 [&_.ant-modal-header]:pb-4 [&_.ant-modal-body]:px-6 [&_.ant-modal-body]:py-5"
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark>
        {/* Basic Information */}
        <p className={`${sectionTitle} mb-3`}>Basic Information</p>

        <Form.Item name="name" label="Rule Name" rules={[{ required: true, message: "Please enter a rule name" }]}>
          <Input placeholder="e.g. Energy Plus - Standard Electricity" className={inputCls} />
        </Form.Item>

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item name="supplier" label="Supplier" rules={[{ required: true, message: "Select a supplier" }]}>
            <Select placeholder="Select supplier" className={selectCls} options={SUPPLIER_OPTIONS.map((v) => ({ value: v, label: v }))} showSearch />
          </Form.Item>
          <Form.Item name="offer" label="Offer" rules={[{ required: true, message: "Select an offer" }]}>
            <Select placeholder="Select offer" className={selectCls} options={OFFER_OPTIONS.map((v) => ({ value: v, label: v }))} showSearch />
          </Form.Item>
          <Form.Item name="contractType" label="Contract Type" rules={[{ required: true, message: "Select a contract type" }]}>
            <Select placeholder="Select contract type" className={selectCls} options={CONTRACT_TYPE_OPTIONS.map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item name="commodity" label="Commodity" rules={[{ required: true, message: "Select a commodity" }]}>
            <Select placeholder="Select commodity" className={selectCls} options={COMMODITY_OPTIONS.map((v) => ({ value: v, label: v }))} />
          </Form.Item>
        </div>

        <Form.Item name="duration" label="Duration (months)" rules={[{ required: true, message: "Enter the duration" }]} className="sm:max-w-[calc(50%-8px)]">
          <InputNumber min={1} controls={false} className="w-full! rounded-lg [&_.ant-input-number-input]:h-11" placeholder="12" />
        </Form.Item>

        {/* Commission Structure */}
        <p className={`${sectionTitle} mb-3 mt-2`}>Commission Structure</p>

        <Form.Item name="structureType" label="Structure Type" rules={[{ required: true }]}>
          <StructureTypePicker />
        </Form.Item>

        {(structureType === "one-time" || structureType === "hybrid") && (
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item name="initialFee" label="Initial Fee (EUR)" rules={[{ required: true, message: "Enter the initial fee" }]}>
              <InputNumber min={0} controls={false} className="w-full! rounded-lg [&_.ant-input-number-input]:h-11" placeholder="450" />
            </Form.Item>
            {structureType === "hybrid" && (
              <Form.Item name="recurringFee" label="Recurring Fee (EUR)" rules={[{ required: true, message: "Enter the recurring fee" }]}>
                <InputNumber min={0} controls={false} className="w-full! rounded-lg [&_.ant-input-number-input]:h-11" placeholder="25" />
              </Form.Item>
            )}
          </div>
        )}

        {structureType === "recurring" && (
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item name="recurringFee" label="Recurring Fee (EUR)" rules={[{ required: true, message: "Enter the recurring fee" }]}>
              <InputNumber min={0} controls={false} className="w-full! rounded-lg [&_.ant-input-number-input]:h-11" placeholder="25" />
            </Form.Item>
            <Form.Item name="frequency" label="Frequency" rules={[{ required: true, message: "Select a frequency" }]}>
              <Select placeholder="Select frequency" className={selectCls} options={FREQUENCY_OPTIONS.map((v) => ({ value: v, label: v }))} />
            </Form.Item>
          </div>
        )}

        {structureType === "hybrid" && (
          <Form.Item name="frequency" label="Frequency" rules={[{ required: true, message: "Select a frequency" }]} className="sm:max-w-[calc(50%-8px)]">
            <Select placeholder="Select frequency" className={selectCls} options={FREQUENCY_OPTIONS.map((v) => ({ value: v, label: v }))} />
          </Form.Item>
        )}

        {structureType === "tiered" && (
          <Form.List name="tiers">
            {(fields, { add, remove }) => (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    Consumption Tiers <span className="text-rose-500">*</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => add({ from: undefined, to: undefined })}
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-500 hover:text-blue-600"
                  >
                    <FiPlus className="h-4 w-4" /> Add Tier
                  </button>
                </div>
                <div className="space-y-2">
                  {fields.map((field) => (
                    <div key={field.key} className="flex items-start gap-2">
                      <Form.Item
                        name={[field.name, "from"]}
                        className="mb-0 flex-1"
                        rules={[{ required: true, message: "From" }]}
                      >
                        <InputNumber min={0} controls={false} className="w-full! rounded-lg [&_.ant-input-number-input]:h-11" placeholder="From (kWh)" />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "to"]}
                        className="mb-0 flex-1"
                        rules={[{ required: true, message: "To" }]}
                      >
                        <InputNumber min={0} controls={false} className="w-full! rounded-lg [&_.ant-input-number-input]:h-11" placeholder="To (kWh)" />
                      </Form.Item>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(field.name)}
                          className="mt-2.5 rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Form.List>
        )}

        {/* Bonus & Conditions */}
        <p className={`${sectionTitle} mb-3 mt-5`}>Bonus &amp; Conditions</p>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item name="bonusAmount" label="Bonus Amount (EUR)">
            <InputNumber min={0} controls={false} className="w-full! rounded-lg [&_.ant-input-number-input]:h-11" placeholder="150" />
          </Form.Item>
          <Form.Item name="bonusCondition" label="Bonus Condition">
            <Input placeholder="e.g. Annual renewal, Referral" className={inputCls} />
          </Form.Item>
        </div>

        {/* Reversals & Clawbacks */}
        <p className={`${sectionTitle} mb-3 mt-2`}>Reversals &amp; Clawbacks</p>
        <div className="grid grid-cols-1 items-center gap-x-4 sm:grid-cols-2">
          <Form.Item name="allowReversals" label=" " valuePropName="checked" className="mb-2">
            <ReversalToggle />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.allowReversals !== cur.allowReversals}
          >
            {({ getFieldValue }) =>
              getFieldValue("allowReversals") ? (
                <Form.Item name="clawbackDays" label="Clawback Period (days)">
                  <InputNumber min={0} controls={false} className="w-full! rounded-lg [&_.ant-input-number-input]:h-11" placeholder="90" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </div>

        <div className="-mx-6 mt-3 flex justify-end gap-2 border-t border-slate-100 px-6 pt-4">
          <Button onClick={onClose} className="h-10 rounded-lg px-5">
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" className="h-10 rounded-lg bg-[#8b85f6] px-5 font-semibold hover:bg-[#7a74e5]">
            {isEditing ? "Save Changes" : "Create Rule"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

/* Segmented structure-type picker (controlled by Form.Item) */
const StructureTypePicker = ({ value, onChange }: { value?: StructureType; onChange?: (v: StructureType) => void }) => (
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
    {STRUCTURE_TYPES.map((type) => {
      const active = value === type;
      return (
        <button
          key={type}
          type="button"
          onClick={() => onChange?.(type)}
          className={`h-11 rounded-lg border text-sm font-medium transition-all ${
            active
              ? "border-[#8b85f6] bg-[#8b85f6]/10 text-[#8b85f6]"
              : "border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          {STRUCTURE_LABELS[type]}
        </button>
      );
    })}
  </div>
);

const ReversalToggle = ({ checked, onChange }: { checked?: boolean; onChange?: (v: boolean) => void }) => (
  <div className="flex items-center gap-3">
    <Switch checked={checked} onChange={onChange} className={checked ? "bg-[#8b85f6]!" : ""} />
    <span className="text-sm text-slate-600">Allow commission reversals</span>
  </div>
);
