import { useState } from "react";
import { Button, Empty, message, Modal } from "antd";
import { FiPlus } from "react-icons/fi";
import { CommissionRuleCard } from "./CommissionRuleCard";
import { CreateCommissionRuleModal } from "./CreateCommissionRuleModal";
import { initialRules, type CommissionRule } from "../types";

export const CommissionRulesConfig = () => {
  const [rules, setRules] = useState<CommissionRule[]>(initialRules);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);

  const openCreate = () => {
    setEditingRule(null);
    setModalOpen(true);
  };

  const openEdit = (rule: CommissionRule) => {
    setEditingRule(rule);
    setModalOpen(true);
  };

  const handleSubmit = (rule: CommissionRule) => {
    setRules((prev) => {
      const exists = prev.some((r) => r.id === rule.id);
      return exists ? prev.map((r) => (r.id === rule.id ? rule : r)) : [rule, ...prev];
    });
    message.success(editingRule ? "Commission rule updated" : "Commission rule created");
    setModalOpen(false);
    setEditingRule(null);
  };

  const handleDuplicate = (rule: CommissionRule) => {
    const copy: CommissionRule = { ...rule, id: `rule-${Date.now()}`, name: `${rule.name} (Copy)` };
    setRules((prev) => [copy, ...prev]);
    message.success("Commission rule duplicated");
  };

  const handleDelete = (rule: CommissionRule) => {
    Modal.confirm({
      title: "Delete commission rule?",
      content: `"${rule.name}" will be permanently removed.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      centered: true,
      onOk: () => {
        setRules((prev) => prev.filter((r) => r.id !== rule.id));
        message.success("Commission rule deleted");
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

      {rules.length === 0 ? (
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
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
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
        onSubmit={handleSubmit}
        editingRule={editingRule}
      />
    </div>
  );
};
