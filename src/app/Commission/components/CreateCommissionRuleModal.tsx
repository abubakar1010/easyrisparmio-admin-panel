import { useEffect } from "react";
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, Switch, message } from "antd";
import dayjs from "dayjs";
import {
  useCreateCommissionRuleMutation,
  useUpdateCommissionRuleMutation,
  type ICommissionRule,
} from "../../../redux/features/Commissions/commissionApi";
import { useGetSuppliersQuery } from "../../../redux/features/Suppliers/supplierApi";

type Props = {
  open: boolean;
  onClose: () => void;
  editingRule?: ICommissionRule | null;
};

const sectionTitle = "text-sm font-semibold text-slate-800";
const inputCls = "h-11 rounded-lg";
const selectCls =
  "[&_.ant-select-selector]:h-11! [&_.ant-select-selector]:rounded-lg [&_.ant-select-selection-item]:leading-[42px]! [&_.ant-select-selection-placeholder]:leading-[42px]!";

const ENERGY_TYPE_OPTIONS = [
  { value: "electricity", label: "Electricity" },
  { value: "gas", label: "Gas" },
  { value: "dual", label: "Dual" },
];

const TARGET_OPTIONS = [
  { value: "residential", label: "Residential" },
  { value: "business", label: "Business" },
  { value: "commercial", label: "Commercial" },
];

export const CreateCommissionRuleModal = ({ open, onClose, editingRule }: Props) => {
  const [form] = Form.useForm();
  const isEditing = !!editingRule;

  const [createRule, { isLoading: creating }] = useCreateCommissionRuleMutation();
  const [updateRule, { isLoading: updating }] = useUpdateCommissionRuleMutation();
  const { data: suppliersData } = useGetSuppliersQuery({ page: 1, limit: 100 });

  const suppliers = suppliersData?.data || [];

  useEffect(() => {
    if (!open) return;
    if (editingRule) {
      form.setFieldsValue({
        supplierId: editingRule.supplierId,
        energyType: editingRule.energyType,
        commissionAmount: editingRule.commissionAmount,
        commissionPercentage: editingRule.commissionPercentage,
        isActive: editingRule.isActive,
        validFrom: editingRule.validFrom ? dayjs(editingRule.validFrom) : undefined,
        validUntil: editingRule.validUntil ? dayjs(editingRule.validUntil) : undefined,
        offerId: editingRule.offerId,
        target: editingRule.target,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        isActive: true,
      });
    }
  }, [open, editingRule, form]);

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        supplierId: values.supplierId,
        energyType: values.energyType,
        commissionAmount: Number(values.commissionAmount),
        commissionPercentage: values.commissionPercentage != null ? Number(values.commissionPercentage) : undefined,
        validFrom: values.validFrom ? values.validFrom.toISOString() : new Date().toISOString(),
        validUntil: values.validUntil ? values.validUntil.toISOString() : undefined,
        offerId: values.offerId || undefined,
        target: values.target || undefined,
      };

      if (isEditing && editingRule) {
        await updateRule({
          id: editingRule.id,
          data: { ...payload, isActive: values.isActive },
        }).unwrap();
        message.success("Commission rule updated");
      } else {
        await createRule(payload).unwrap();
        message.success("Commission rule created");
      }

      form.resetFields();
      onClose();
    } catch {
      message.error(isEditing ? "Failed to update commission rule" : "Failed to create commission rule");
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      centered
      width="min(780px, calc(100vw - 24px))"
      title={
        <span className="text-lg! font-bold text-slate-800">
          {isEditing ? "Edit Commission Rule" : "Create Commission Rule"}
        </span>
      }
      className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-0 [&_.ant-modal-header]:rounded-t-2xl [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-slate-100 [&_.ant-modal-header]:px-6 [&_.ant-modal-header]:pt-5 [&_.ant-modal-header]:pb-4 [&_.ant-modal-body]:px-6 [&_.ant-modal-body]:py-5"
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark>
        {/* Basic Information */}
        <p className={`${sectionTitle} mb-3`}>Basic Information</p>

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item
            name="supplierId"
            label="Supplier"
            rules={[{ required: true, message: "Select a supplier" }]}
          >
            <Select
              placeholder="Select supplier"
              className={selectCls}
              showSearch
              optionFilterProp="label"
              options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
            />
          </Form.Item>
          <Form.Item
            name="energyType"
            label="Energy Type"
            rules={[{ required: true, message: "Select an energy type" }]}
          >
            <Select
              placeholder="Select energy type"
              className={selectCls}
              options={ENERGY_TYPE_OPTIONS}
            />
          </Form.Item>
        </div>

        <Form.Item name="target" label="Target">
          <Select
            placeholder="Select target"
            className={selectCls}
            allowClear
            options={TARGET_OPTIONS}
          />
        </Form.Item>

        {/* Commission Values */}
        <p className={`${sectionTitle} mb-3 mt-2`}>Commission Values</p>

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item
            name="commissionAmount"
            label="Commission Amount (EUR)"
            rules={[{ required: true, message: "Enter the commission amount" }]}
          >
            <InputNumber
              min={0}
              controls={false}
              className="w-full! rounded-lg [&_.ant-input-number-input]:h-11"
              placeholder="e.g. 45.00"
            />
          </Form.Item>
          <Form.Item name="commissionPercentage" label="Commission Percentage (%)">
            <InputNumber
              min={0}
              max={100}
              controls={false}
              className="w-full! rounded-lg [&_.ant-input-number-input]:h-11"
              placeholder="e.g. 5"
            />
          </Form.Item>
        </div>

        {/* Validity Period */}
        <p className={`${sectionTitle} mb-3 mt-2`}>Validity Period</p>

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item
            name="validFrom"
            label="Valid From"
            rules={[{ required: true, message: "Select start date" }]}
          >
            <DatePicker className={`w-full! ${inputCls}`} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="validUntil" label="Valid Until">
            <DatePicker className={`w-full! ${inputCls}`} format="DD/MM/YYYY" />
          </Form.Item>
        </div>

        {/* Offer & Status */}
        <p className={`${sectionTitle} mb-3 mt-2`}>Additional Settings</p>

        <Form.Item name="offerId" label="Offer ID (optional)">
          <Input placeholder="Link to a specific offer ID" className={inputCls} />
        </Form.Item>

        {isEditing && (
          <Form.Item name="isActive" label=" " valuePropName="checked" className="mb-2">
            <ActiveToggle />
          </Form.Item>
        )}

        <div className="-mx-6 mt-3 flex justify-end gap-2 border-t border-slate-100 px-6 pt-4">
          <Button onClick={onClose} className="h-10 rounded-lg px-5">
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={creating || updating}
            className="h-10 rounded-lg bg-[#8b85f6] px-5 font-semibold hover:bg-[#7a74e5]"
          >
            {isEditing ? "Save Changes" : "Create Rule"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

const ActiveToggle = ({ checked, onChange }: { checked?: boolean; onChange?: (v: boolean) => void }) => (
  <div className="flex items-center gap-3">
    <Switch checked={checked} onChange={onChange} className={checked ? "bg-[#8b85f6]!" : ""} />
    <span className="text-sm text-slate-600">Rule is active</span>
  </div>
);
