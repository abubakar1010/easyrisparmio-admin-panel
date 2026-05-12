import { Modal, Button, Form, Input } from "antd";
import { useEffect, useState } from "react";

interface AddEditFAQModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (values: any) => void;
  initialValues?: any;
}

const AddEditFAQModal = ({ visible, onCancel, onSave, initialValues }: AddEditFAQModalProps) => {
  const [form] = Form.useForm();
  const [questionCount, setQuestionCount] = useState(0);
  const [answerCount, setAnswerCount] = useState(0);

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue(initialValues);
        setQuestionCount(initialValues.question?.length || 0);
        setAnswerCount(initialValues.answer?.length || 0);
      } else {
        form.resetFields();
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

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={780}
      centered
      zIndex={1100}
      className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-8"
      title={
        <div className="text-center mb-6">
          <h3 className="text-[24px] font-bold text-slate-800">{initialValues ? "Edit FAQ" : "Add FAQ"}</h3>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        className="space-y-6"
      >
        <div className="space-y-4">
          <p className="text-[16px] font-bold text-slate-700">FAQ Content</p>
          
          <Form.Item
            name="question"
            label={
              <div className="flex justify-between w-full">
                <span className="text-sm font-medium text-slate-500">Question <span className="text-red-500">*</span></span>
                <span className="text-[11px] text-slate-300">{questionCount}/200</span>
              </div>
            }
            rules={[{ required: true, message: "Please enter a question" }]}
            className="mb-0"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Enter the question users will see..." 
              className="rounded-xl border-slate-200"
              maxLength={200}
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
              rows={8} 
              placeholder="Enter the detailed answer..." 
              className="rounded-xl border-slate-200"
              maxLength={2000}
              onChange={(e) => setAnswerCount(e.target.value.length)}
            />
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
