import { Modal, Button, Collapse, Space } from "antd";
import { FiPlus, FiEdit2, FiTrash2, FiMenu, FiChevronDown } from "react-icons/fi";
import type { FAQCategoryRow } from "../index";

const { Panel } = Collapse;

interface CategoryFAQModalProps {
  visible: boolean;
  onCancel: () => void;
  category: FAQCategoryRow | null;
  onAddFAQ: () => void;
  onEditFAQ: (faq: any) => void;
}

// Mock data for FAQs within a category
const mockFAQs = [
  {
    id: "1",
    question: "How does the switching process work?",
    answer: "The switching process is simple and fast. First, we analyze your current bill...",
    lastUpdated: "2026-04-20",
  },
  {
    id: "2",
    question: "Will my service be interrupted?",
    answer: "No, your service will not be interrupted during the transition...",
    lastUpdated: "2026-04-18",
  },
  {
    id: "3",
    question: "What if my old provider contracts?",
    answer: "We handle all the communication with your previous provider...",
    lastUpdated: "2026-04-15",
  },
];

const CategoryFAQModal = ({ visible, onCancel, category, onAddFAQ, onEditFAQ }: CategoryFAQModalProps) => {
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
        <Collapse
          ghost
          expandIconPosition="end"
          expandIcon={({ isActive }) => <FiChevronDown className={`text-slate-400 transition-transform h-5 w-5 ${isActive ? 'rotate-180' : ''}`} />}
          className="[&_.ant-collapse-item]:mb-4 [&_.ant-collapse-item]:rounded-xl [&_.ant-collapse-item]:border [&_.ant-collapse-item]:border-slate-100 [&_.ant-collapse-item]:bg-white [&_.ant-collapse-item]:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)]"
        >
          {mockFAQs.map((faq) => (
            <Panel
              key={faq.id}
              header={
                <div className="flex items-center gap-4 w-full">
                  <FiMenu className="text-slate-300 cursor-move h-4 w-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-700 text-sm truncate">{faq.question}</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Last updated: {faq.lastUpdated}</p>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle delete
                      }}
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
      </div>
    </Modal>
  );
};

export default CategoryFAQModal;
