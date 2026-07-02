import { Modal, Button, Collapse, Space } from "antd";
import { FiPlus, FiEdit2, FiTrash2, FiMenu, FiChevronDown } from "react-icons/fi";
import type { FAQCategoryGroup } from "../index";
import type { IFaq } from "../../../redux/features/Support/supportApi";

const { Panel } = Collapse;

interface CategoryFAQModalProps {
  visible: boolean;
  onCancel: () => void;
  category: FAQCategoryGroup | null;
  onAddFAQ: () => void;
  onEditFAQ: (faq: IFaq) => void;
  onDeleteFAQ: (faqId: string) => void;
}

const CategoryFAQModal = ({ visible, onCancel, category, onAddFAQ, onEditFAQ, onDeleteFAQ }: CategoryFAQModalProps) => {
  const faqs = category?.faqs || [];

  const handleDelete = (e: React.MouseEvent, faqId: string) => {
    e.stopPropagation();
    Modal.confirm({
      title: "Delete this FAQ?",
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      centered: true,
      onOk: () => onDeleteFAQ(faqId),
    });
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
      centered
      zIndex={1000}
      className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-6"
      title={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-8">
          <span className="text-[16px] font-bold text-slate-800">
            FAQs in this Category <span className="text-slate-400 font-medium block sm:inline">({category?.categoryName})</span>
          </span>
          <Button
            type="primary"
            icon={<FiPlus className="text-sm" />}
            className="bg-[#8b85f6] hover:bg-[#7a74e5]! border-none rounded-lg font-semibold flex items-center gap-1.5 h-9 w-fit pb-0.5!"
            onClick={onAddFAQ}
          >
            Add FAQ
          </Button>
        </div>
      }
    >
      <div className="mt-6 space-y-4">
        {faqs.length === 0 ? (
          <div className="py-12 text-center text-slate-400">No FAQs in this category yet.</div>
        ) : (
          <Collapse
            ghost
            expandIconPosition="end"
            expandIcon={({ isActive }) => <FiChevronDown className={`text-slate-400 transition-transform h-5 w-5 ${isActive ? 'rotate-180' : ''}`} />}
            className="[&_.ant-collapse-item]:mb-4 [&_.ant-collapse-item]:rounded-xl [&_.ant-collapse-item]:border [&_.ant-collapse-item]:border-slate-100 [&_.ant-collapse-item]:bg-white [&_.ant-collapse-item]:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)]"
          >
            {faqs.map((faq) => (
              <Panel
                key={faq.id}
                header={
                  <div className="flex items-center gap-4 w-full">
                    <FiMenu className="text-slate-300 cursor-move h-4 w-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-700 text-sm truncate">{faq.question}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        Last updated: {faq.updatedAt ? new Date(faq.updatedAt).toLocaleDateString("it-IT") : new Date(faq.createdAt).toLocaleDateString("it-IT")}
                      </p>
                    </div>
                    <Space size="middle" className="mr-2 shrink-0">
                      <Button
                        type="text"
                        size="small"
                        icon={<FiEdit2 className="text-slate-400 h-4 w-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditFAQ(faq);
                        }}
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<FiTrash2 className="text-red-400 h-4 w-4" />}
                        onClick={(e) => handleDelete(e, faq.id)}
                      />
                    </Space>
                  </div>
                }
              >
                <div className="pl-8 pb-2">
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </Panel>
            ))}
          </Collapse>
        )}
      </div>
    </Modal>
  );
};

export default CategoryFAQModal;
