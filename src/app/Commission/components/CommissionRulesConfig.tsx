import { useState } from "react";
import { Button, Empty, Spin, message, Modal } from "antd";
import { FiPlus } from "react-icons/fi";
import { CommissionRuleCard } from "./CommissionRuleCard";
import { CreateCommissionRuleModal } from "./CreateCommissionRuleModal";
import {
  useGetCommissionRulesQuery,
  useUpdateCommissionRuleMutation,
  type ICommissionRule,
} from "../../../redux/features/Commissions/commissionApi";

export const CommissionRulesConfig = () => {
  const { data: rules = [], isLoading, isError } = useGetCommissionRulesQuery();
  const [updateRule] = useUpdateCommissionRuleMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ICommissionRule | null>(null);

  const openCreate = () => {
    setEditingRule(null);
    setModalOpen(true);
  };

  const openEdit = (rule: ICommissionRule) => {
    setEditingRule(rule);
    setModalOpen(true);
  };

  const handleToggleActive = async (rule: ICommissionRule) => {
    const newActive = !rule.isActive;
    Modal.confirm({
      title: newActive ? "Activate commission rule?" : "Deactivate commission rule?",
      content: `This rule for ${rule.supplier?.name || "this supplier"} will be ${newActive ? "activated" : "deactivated"}.`,
      okText: newActive ? "Activate" : "Deactivate",
      okButtonProps: newActive ? {} : { danger: true },
      cancelText: "Cancel",
      centered: true,
      onOk: async () => {
        try {
          await updateRule({ id: rule.id, data: { isActive: newActive } }).unwrap();
          message.success(`Commission rule ${newActive ? "activated" : "deactivated"}`);
        } catch {
          message.error("Failed to update commission rule");
        }
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Commission Rules</h3>
          <p className="text-sm text-slate-500">Configure commission structures by supplier, offer, and contract type</p>
        </div>
        <Button
          type="primary"
          icon={<FiPlus />}
          onClick={openCreate}
          className="h-10 rounded-lg bg-[#8b85f6] px-5 font-semibold hover:bg-[#7a74e5]"
        >
          Create Rule
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spin size="large" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white py-16">
          <Empty description="Failed to load commission rules" />
        </div>
      ) : rules.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white py-16">
          <Empty description="No commission rules yet" />
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <CommissionRuleCard
              key={rule.id}
              rule={rule}
              onEdit={openEdit}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      <CreateCommissionRuleModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingRule(null);
        }}
        editingRule={editingRule}
      />
    </div>
  );
};
