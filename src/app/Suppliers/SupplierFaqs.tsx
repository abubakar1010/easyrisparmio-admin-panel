import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { App, Button, Empty, Form, Input, InputNumber, Modal, Spin, Switch, Tag, Tooltip } from "antd";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import {
  useGetSupplierFaqsQuery,
  useCreateSupplierFaqMutation,
  useUpdateSupplierFaqMutation,
  useDeleteSupplierFaqMutation,
  type ISupplierFaq,
  type ISupplierFaqInput,
} from "../../redux/features/Suppliers/supplierFaqApi";
import { getApiErrorMessage } from "../../utils/apiError";

interface SupplierFaqModalProps {
  open: boolean;
  faq: ISupplierFaq | null;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (values: ISupplierFaqInput) => void;
}

const SupplierFaqModal = ({ open, faq, isSaving, onCancel, onSave }: SupplierFaqModalProps) => {
  const { t } = useTranslation();
  const [form] = Form.useForm<ISupplierFaqInput>();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(
      faq
        ? { question: faq.question, answer: faq.answer, sortOrder: faq.sortOrder, isActive: faq.isActive }
        : { sortOrder: 0, isActive: true },
    );
  }, [open, faq, form]);

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={680}
      centered
      destroyOnHidden
      className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-8"
      title={
        <h3 className="mb-4 text-center text-[22px] font-bold text-slate-800">
          {faq ? t("faq_management.edit") : t("faq_management.add")}
        </h3>
      }
    >
      <Form form={form} layout="vertical" onFinish={onSave} className="space-y-4">
        <Form.Item
          name="question"
          label={<span className="text-sm font-medium text-slate-500">{t("faq_management.question")}</span>}
          rules={[{ required: true, whitespace: true, message: t("faq_management.question_required") }]}
          className="mb-0"
        >
          <Input.TextArea rows={2} maxLength={500} showCount placeholder={t("faq_management.question_hint")} className="rounded-xl" />
        </Form.Item>

        <Form.Item
          name="answer"
          label={<span className="text-sm font-medium text-slate-500">{t("faq_management.answer")}</span>}
          rules={[{ required: true, whitespace: true, message: t("faq_management.answer_required") }]}
          className="mb-0"
        >
          <Input.TextArea rows={6} maxLength={2000} showCount placeholder={t("faq_management.answer_hint")} className="rounded-xl" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="sortOrder"
            label={<span className="text-sm font-medium text-slate-500">{t("faq_management.sort_order")}</span>}
            className="mb-0"
          >
            <InputNumber min={0} precision={0} className="h-11 w-full rounded-xl [&_input]:h-11" />
          </Form.Item>
          <Form.Item
            name="isActive"
            label={<span className="text-sm font-medium text-slate-500">{t("common.active")}</span>}
            valuePropName="checked"
            className="mb-0"
          >
            <Switch />
          </Form.Item>
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={onCancel} className="h-11 flex-1 rounded-xl">
            {t("common.cancel")}
          </Button>
          <Button type="primary" htmlType="submit" loading={isSaving} className="h-11 flex-1 rounded-xl bg-[#8b85f6]">
            {t("common.save")}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

/**
 * The FAQs of one supplier. The active ones are what that supplier's customers
 * read in the FAQ section of the utility details in the app, in this order.
 */
const SupplierFaqs = ({ supplierId, disabled }: { supplierId: string; disabled?: boolean }) => {
  const { t } = useTranslation();
  const { modal, message } = App.useApp();
  const { data: faqs = [], isLoading } = useGetSupplierFaqsQuery(supplierId);
  const [createFaq, { isLoading: isCreating }] = useCreateSupplierFaqMutation();
  const [updateFaq, { isLoading: isUpdating }] = useUpdateSupplierFaqMutation();
  const [deleteFaq] = useDeleteSupplierFaqMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ISupplierFaq | null>(null);

  const openModal = (faq: ISupplierFaq | null) => {
    setEditing(faq);
    setModalOpen(true);
  };

  const handleSave = async (values: ISupplierFaqInput) => {
    const data = { ...values, question: values.question.trim(), answer: values.answer.trim() };
    try {
      if (editing) {
        await updateFaq({ supplierId, faqId: editing.id, data }).unwrap();
        message.success(t("faq_management.updated"));
      } else {
        await createFaq({ supplierId, data }).unwrap();
        message.success(t("faq_management.created"));
      }
      setModalOpen(false);
    } catch (err) {
      message.error(getApiErrorMessage(err, t("faq_management.save_failed")));
    }
  };

  const handleToggle = async (faq: ISupplierFaq, isActive: boolean) => {
    try {
      await updateFaq({ supplierId, faqId: faq.id, data: { isActive } }).unwrap();
    } catch (err) {
      message.error(getApiErrorMessage(err, t("faq_management.status_update_failed")));
    }
  };

  const handleDelete = (faq: ISupplierFaq) => {
    modal.confirm({
      title: t("faq_management.delete_confirm"),
      content: t("faq_management.delete_warning"),
      centered: true,
      okText: t("common.delete"),
      cancelText: t("common.cancel"),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteFaq({ supplierId, faqId: faq.id }).unwrap();
          message.success(t("faq_management.deleted"));
        } catch (err) {
          message.error(getApiErrorMessage(err, t("faq_management.delete_failed")));
        }
      },
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-800">{t("suppliers.faqs_title")}</h3>
          <p className="mt-1 text-xs text-slate-400">{t("suppliers.faqs_hint")}</p>
        </div>
        <Button
          type="primary"
          icon={<FiPlus />}
          onClick={() => openModal(null)}
          disabled={disabled}
          className="h-10 rounded-lg bg-[#8b85f6] font-medium"
        >
          {t("faq_management.add")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spin />
        </div>
      ) : faqs.length === 0 ? (
        <div className="py-12">
          <Empty description={t("faq_management.no_faqs")} />
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div key={faq.id} className="flex items-start gap-4 rounded-xl border border-slate-200 p-4">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">
                {faq.sortOrder}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold break-words text-slate-800">{faq.question}</p>
                  {!faq.isActive && (
                    <Tag className="m-0 rounded-full border-0 bg-slate-100 text-[10px] font-bold text-slate-500">
                      {t("common.inactive")}
                    </Tag>
                  )}
                </div>
                <p className="mt-1 text-sm whitespace-pre-line break-words text-slate-600">{faq.answer}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Tooltip title={faq.isActive ? t("common.active") : t("common.inactive")}>
                  <Switch size="small" checked={faq.isActive} disabled={disabled} onChange={(checked) => handleToggle(faq, checked)} />
                </Tooltip>
                <Tooltip title={t("common.edit")}>
                  <button
                    type="button"
                    aria-label={t("common.edit")}
                    disabled={disabled}
                    onClick={() => openModal(faq)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                </Tooltip>
                <Tooltip title={t("common.delete")}>
                  <button
                    type="button"
                    aria-label={t("common.delete")}
                    disabled={disabled}
                    onClick={() => handleDelete(faq)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      )}

      <SupplierFaqModal
        open={modalOpen}
        faq={editing}
        isSaving={isCreating || isUpdating}
        onCancel={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
};

export default SupplierFaqs;
