import { Modal, Button, Form, Input, Select, Switch } from "antd";
import { useEffect } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import type { IStaticPage } from "../../../redux/features/StaticPages/staticPagesApi";

interface AddEditStaticPageModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (values: {
    slug: string;
    title: string;
    content: string;
    locale: string;
    isActive: boolean;
  }) => void;
  initialValues?: IStaticPage | null;
  isLoading?: boolean;
}

const slugOptions = [
  { label: "Privacy Policy", value: "privacy-policy" },
  { label: "Terms & Conditions", value: "terms-conditions" },
  { label: "About Us", value: "about-us" },
];

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const AddEditStaticPageModal = ({
  visible,
  onCancel,
  onSave,
  initialValues,
  isLoading,
}: AddEditStaticPageModalProps) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue({
          slug: initialValues.slug,
          title: initialValues.title,
          content: initialValues.content,
          locale: initialValues.locale || "it",
          isActive: initialValues.isActive ?? true,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ isActive: true, locale: "it" });
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
      destroyOnClose
      className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-8"
      title={
        <div className="text-center mb-6">
          <h3 className="text-[24px] font-bold text-slate-800">
            {initialValues ? "Edit Static Page" : "Add Static Page"}
          </h3>
        </div>
      }
    >
      <Form form={form} layout="vertical" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Form.Item
            name="slug"
            label={<span className="text-sm font-medium text-slate-500">Page Type <span className="text-red-500">*</span></span>}
            rules={[{ required: true, message: "Please select a page type" }]}
            className="mb-0"
          >
            <Select
              placeholder="Select page type"
              options={slugOptions}
              disabled={!!initialValues}
              className="[&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200 [&_.ant-select-selector]:h-11"
            />
          </Form.Item>

          <Form.Item
            name="locale"
            label={<span className="text-sm font-medium text-slate-500">Language</span>}
            className="mb-0"
          >
            <Select
              placeholder="Select language"
              className="[&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200 [&_.ant-select-selector]:h-11"
              options={[
                { label: "Italian (it)", value: "it" },
                { label: "English (en)", value: "en" },
              ]}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="title"
          label={<span className="text-sm font-medium text-slate-500">Title <span className="text-red-500">*</span></span>}
          rules={[{ required: true, message: "Please enter a title" }]}
          className="mb-0"
        >
          <Input
            placeholder="Enter page title"
            className="h-11 rounded-xl border-slate-200"
            maxLength={255}
          />
        </Form.Item>

        <Form.Item
          name="content"
          label={<span className="text-sm font-medium text-slate-500">Content <span className="text-red-500">*</span></span>}
          rules={[
            {
              required: true,
              validator: (_, value) => {
                if (!value || value === "<p><br></p>" || value.trim() === "") {
                  return Promise.reject("Please enter content");
                }
                return Promise.resolve();
              },
            },
          ]}
          className="mb-0"
        >
          <ReactQuill
            theme="snow"
            modules={quillModules}
            placeholder="Write page content here..."
            className="[&_.ql-container]:min-h-[200px] [&_.ql-container]:rounded-b-xl [&_.ql-toolbar]:rounded-t-xl [&_.ql-container]:border-slate-200 [&_.ql-toolbar]:border-slate-200"
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

export default AddEditStaticPageModal;
