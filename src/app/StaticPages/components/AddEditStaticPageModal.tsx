import { Alert, Modal, Button, Form, Input, Select, Switch, Tag, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { FiAlertTriangle, FiInfo } from "react-icons/fi";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import type {
  IStaticPage,
  IStaticPagePayload,
  LegalAudience,
} from "../../../redux/features/StaticPages/staticPagesApi";
import { LEGAL_SLUGS, nextVersion, slugOptions } from "../constants";

interface AddEditStaticPageModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (values: IStaticPagePayload) => void;
  initialValues?: IStaticPage | null;
  isLoading?: boolean;
}

const audienceOptions: { label: string; value: LegalAudience; hint: string }[] = [
  { label: "All accounts", value: "all", hint: "Every user must accept this document" },
  { label: "Personal only", value: "personal", hint: "Only personal accounts are asked" },
  { label: "Business only", value: "business", hint: "Only business accounts are asked" },
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

  // Editing an existing agreement leaves the version alone unless the admin
  // deliberately asks to publish a new one — a typo fix must not send every
  // user back through the acceptance prompt.
  const [publishNewVersion, setPublishNewVersion] = useState(false);
  const [slug, setSlug] = useState<string | undefined>();
  const [requiresAcceptance, setRequiresAcceptance] = useState(false);

  const isEditing = !!initialValues;
  const currentVersion = initialValues?.version || "1.0";

  useEffect(() => {
    if (!visible) return;

    setPublishNewVersion(false);

    if (initialValues) {
      setSlug(initialValues.slug);
      setRequiresAcceptance(initialValues.requiresAcceptance);
      form.setFieldsValue({
        slug: initialValues.slug,
        title: initialValues.title,
        content: initialValues.content,
        locale: initialValues.locale || "it",
        isActive: initialValues.isActive ?? true,
        version: initialValues.version || "1.0",
        requiresAcceptance: initialValues.requiresAcceptance ?? false,
        audience: initialValues.audience || "all",
        changeSummary: initialValues.changeSummary || "",
      });
    } else {
      form.resetFields();
      setSlug(undefined);
      setRequiresAcceptance(false);
      form.setFieldsValue({
        isActive: true,
        locale: "it",
        version: "1.0",
        requiresAcceptance: false,
        audience: "all",
      });
    }
  }, [visible, initialValues, form]);

  /** Picking a legal page type pre-arms the acceptance settings that go with it. */
  const handleSlugChange = (value: string) => {
    setSlug(value);
    const isLegal = LEGAL_SLUGS.includes(value);
    setRequiresAcceptance(isLegal);
    form.setFieldsValue({
      requiresAcceptance: isLegal,
      audience: value === "business-terms-conditions" ? "business" : "all",
    });
  };

  const handleTogglePublishNewVersion = (checked: boolean) => {
    setPublishNewVersion(checked);
    form.setFieldsValue({
      version: checked ? nextVersion(currentVersion) : currentVersion,
    });
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const payload: IStaticPagePayload = {
        slug: values.slug,
        title: values.title,
        content: values.content,
        locale: values.locale,
        isActive: values.isActive,
        requiresAcceptance: values.requiresAcceptance,
        audience: values.audience,
      };

      if (values.requiresAcceptance) {
        // Sending an unchanged version on every save would be harmless but
        // noisy; it is only included when it is actually meant to move.
        if (!isEditing || publishNewVersion) {
          payload.version = values.version;
          payload.changeSummary = values.changeSummary || undefined;
        }
      }

      onSave(payload);
    });
  };

  const showLegalSettings = requiresAcceptance || (slug && LEGAL_SLUGS.includes(slug));

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
            {isEditing ? "Edit Static Page" : "Add Static Page"}
          </h3>
          {isEditing && initialValues?.requiresAcceptance && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <Tag color="geekblue" className="rounded-full border-0 px-3 py-0.5 text-xs font-semibold">
                v{currentVersion}
              </Tag>
              <span className="text-xs font-medium text-slate-400">
                {initialValues.acceptedCount ?? 0} user
                {(initialValues.acceptedCount ?? 0) === 1 ? "" : "s"} accepted this version
              </span>
            </div>
          )}
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
              disabled={isEditing}
              onChange={handleSlugChange}
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

        {/* ── Consent settings ───────────────────────────────── */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <FiInfo className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-600">Consent & Versioning</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              name="requiresAcceptance"
              label={
                <Tooltip title="Users must actively accept this document before they can use the app">
                  <span className="text-sm font-medium text-slate-500">Requires acceptance</span>
                </Tooltip>
              }
              valuePropName="checked"
              className="mb-0"
            >
              <Switch onChange={setRequiresAcceptance} />
            </Form.Item>

            {showLegalSettings && (
              <Form.Item
                name="audience"
                label={<span className="text-sm font-medium text-slate-500">Applies to</span>}
                className="mb-0"
              >
                <Select
                  className="[&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200 [&_.ant-select-selector]:h-11"
                  options={audienceOptions.map(({ label, value, hint }) => ({
                    label: (
                      <div className="flex flex-col py-0.5">
                        <span>{label}</span>
                        <span className="text-[11px] text-slate-400">{hint}</span>
                      </div>
                    ),
                    value,
                  }))}
                />
              </Form.Item>
            )}
          </div>

          {showLegalSettings && isEditing && (
            <div className="flex items-start gap-3 rounded-xl bg-white border border-slate-100 px-4 py-3">
              <Switch
                checked={publishNewVersion}
                onChange={handleTogglePublishNewVersion}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-semibold text-slate-600 m-0">
                  Publish as a new version
                </p>
                <p className="text-xs text-slate-400 m-0 mt-0.5">
                  Leave off for typo fixes and formatting. Turn on only when the
                  agreement itself has materially changed.
                </p>
              </div>
            </div>
          )}

          {showLegalSettings && (!isEditing || publishNewVersion) && (
            <>
              <Form.Item
                name="version"
                label={<span className="text-sm font-medium text-slate-500">Version <span className="text-red-500">*</span></span>}
                rules={[
                  { required: true, message: "Please enter a version" },
                  {
                    pattern: /^\d{1,3}(\.\d{1,3}){0,2}$/,
                    message: "Use a dotted number such as 2.1",
                  },
                ]}
                extra={
                  isEditing ? (
                    <span className="text-xs text-slate-400">
                      Currently published: v{currentVersion}
                    </span>
                  ) : undefined
                }
                className="mb-0"
              >
                <Input
                  placeholder="1.0"
                  className="h-11 rounded-xl border-slate-200 max-w-[200px]"
                  maxLength={20}
                />
              </Form.Item>

              <Form.Item
                name="changeSummary"
                label={
                  <span className="text-sm font-medium text-slate-500">
                    What changed
                  </span>
                }
                extra={
                  <span className="text-xs text-slate-400">
                    Shown at the top of the re-acceptance prompt in the app. A short,
                    plain-language summary gets read; the full document usually does not.
                  </span>
                }
                className="mb-0"
              >
                <Input.TextArea
                  rows={3}
                  maxLength={2000}
                  showCount
                  placeholder="e.g. Updated the withdrawal notice period from 30 to 14 days."
                  className="rounded-xl border-slate-200"
                />
              </Form.Item>
            </>
          )}

          {showLegalSettings && publishNewVersion && (
            <Alert
              type="warning"
              showIcon
              icon={<FiAlertTriangle className="h-4 w-4" />}
              className="rounded-xl border-amber-100 bg-amber-50"
              message={
                <span className="text-xs font-semibold text-amber-700">
                  Every user will be asked to accept again
                </span>
              }
              description={
                <span className="text-xs text-amber-600">
                  Publishing a new version applies it to all languages of this document
                  and blocks the app until each user reviews and accepts it. Their
                  previous acceptance stays on record.
                </span>
              }
            />
          )}
        </div>

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
            {publishNewVersion ? "Publish new version" : "Save"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddEditStaticPageModal;
