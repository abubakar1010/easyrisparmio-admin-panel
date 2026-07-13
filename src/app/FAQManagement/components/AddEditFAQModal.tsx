import { Modal, Button, Form, Input, InputNumber, Select, Switch } from "antd";
import { useEffect, useState } from "react";
import type { IFaq } from "../../../redux/features/Support/supportApi";

interface AddEditFAQModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (values: {
    category: string;
    question: string;
    answer: string;
    sortOrder: number;
    isActive: boolean;
    locale: string;
    targetAudience: string;
  }) => void;
  initialValues?: IFaq | null;
  isLoading?: boolean;
  existingCategories?: string[];
}

const AddEditFAQModal = ({
  visible,
  onCancel,
  onSave,
  initialValues,
  isLoading,
  existingCategories = [],
}: AddEditFAQModalProps) => {
  const [form] = Form.useForm();
  const [questionCount, setQuestionCount] = useState(0);
  const [answerCount, setAnswerCount] = useState(0);

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue({
          category: initialValues.category,
          question: initialValues.question,
          answer: initialValues.answer,
          sortOrder: initialValues.sortOrder ?? 0,
          isActive: initialValues.isActive ?? true,
          locale: initialValues.locale || "it",
          targetAudience: initialValues.targetAudience || "both",
        });
        setQuestionCount(initialValues.question?.length || 0);
        setAnswerCount(initialValues.answer?.length || 0);
      } else {
        form.resetFields();
        form.setFieldsValue({ sortOrder: 0, isActive: true, locale: "it", targetAudience: "both" });
        setQuestionCount(0);
        setAnswerCount(0);
      }
    }
  }, [visible, initialValues, form]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSave(values);
    });
  };

  const categoryOptions = existingCategories.map((c) => ({ label: c, value: c }));

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={780}
      centered
      destroyOnClose
      className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-8"
      title={
        <div className="text-center mb-6">
          <h3 className="text-[24px] font-bold text-slate-800">
            {initialValues ? "Edit FAQ" : "Add FAQ"}
          </h3>
        </div>
      }
    >
      <Form form={form} layout="vertical" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Form.Item
            name="category"
            label={<span className="text-sm font-medium text-slate-500">Category <span className="text-red-500">*</span></span>}
            rules={[{ required: true, message: "Please enter a category" }]}
            className="mb-0"
          >
            <Select
              showSearch
              allowClear
              placeholder="Select or type a category"
              options={categoryOptions}
              className="[&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200 [&_.ant-select-selector]:h-11"
              mode={undefined}
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <div className="px-3 py-2 text-xs text-slate-400 border-t border-slate-100">
                    Type to search or enter a new category
                  </div>
                </>
              )}
              onSearch={() => {}}
            />
          </Form.Item>

          <Form.Item
            name="sortOrder"
            label={<span className="text-sm font-medium text-slate-500">Sort Order</span>}
            className="mb-0"
          >
            <InputNumber
              min={0}
              placeholder="0"
              className="w-full h-11 rounded-xl border-slate-200 [&_input]:h-11"
            />
          </Form.Item>
        </div>

        <Form.Item
          name="question"
          label={
            <div className="flex justify-between w-full">
              <span className="text-sm font-medium text-slate-500">Question <span className="text-red-500">*</span></span>
              <span className="text-[11px] text-slate-300">{questionCount}/500</span>
            </div>
          }
          rules={[{ required: true, message: "Please enter a question" }]}
          className="mb-0"
        >
          <Input.TextArea
            rows={3}
            placeholder="Enter the question users will see..."
            className="rounded-xl border-slate-200"
            maxLength={500}
            onChange={(e) => setQuestionCount(e.target.value.length)}
          />
        </Form.Item>

        <Form.Item
          name="answer"
          label={
            <div className="flex justify-between w-full">
              <span className="text-sm font-medium text-slate-500">Answer <span className="text-red-500">*</span></span>
              <span className="text-[11px] text-slate-300">{answerCount}/2000</span>
            </div>
          }
          rules={[{ required: true, message: "Please enter an answer" }]}
          className="mb-0"
        >
          <Input.TextArea
            rows={6}
            placeholder="Enter the detailed answer..."
            className="rounded-xl border-slate-200"
            maxLength={2000}
            onChange={(e) => setAnswerCount(e.target.value.length)}
          />
        </Form.Item>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Form.Item
            name="targetAudience"
            label={<span className="text-sm font-medium text-slate-500">Target Audience</span>}
            className="mb-0"
          >
            <Select
              placeholder="Select audience"
              className="[&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200 [&_.ant-select-selector]:h-11"
              options={[
                { label: "Both", value: "both" },
                { label: "Personal", value: "personal" },
                { label: "Business", value: "business" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="locale"
            label={<span className="text-sm font-medium text-slate-500">Locale</span>}
            className="mb-0"
          >
            <Select
              placeholder="Select locale"
              className="[&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200 [&_.ant-select-selector]:h-11"
              options={[
                { label: "Italian (it)", value: "it" },
                { label: "English (en)", value: "en" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label={<span className="text-sm font-medium text-slate-500">Active</span>}
            valuePropName="checked"
            className="mb-0"
          >
            <Switch />
          </Form.Item>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            onClick={onCancel}
            className="flex-1 h-14 rounded-2xl bg-[#FFF1F1] border-none text-[#FF4D4F] font-bold text-lg hover:bg-[#FFE4E4]! order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isLoading}
            className="flex-1 h-14 rounded-2xl bg-[#8b85f6] border-none text-white font-bold text-lg hover:bg-[#7a74e5]! order-1 sm:order-2"
          >
            Save
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddEditFAQModal;
