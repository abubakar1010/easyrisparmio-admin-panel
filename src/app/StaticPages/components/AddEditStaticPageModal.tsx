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

/** Shared control metrics — antd's own selector rules out-specify a plain
 *  arbitrary variant, so the height needs the important flag to land. */
const labelClass = "text-sm font-medium text-slate-500";
const inputClass = "h-11 rounded-xl border-slate-200";
const selectClass =
  "[&_.ant-select-selector]:h-11! [&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200 [&_.ant-select-selection-item]:leading-[42px]! [&_.ant-select-selection-placeholder]:leading-[42px]!";

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
  const [requiresAcceptance, setRequiresAcceptance] = useState(false);
  const audience = Form.useWatch("audience", form);

  const isEditing = !!initialValues;
  const currentVersion = initialValues?.version || "1.0";

  useEffect(() => {
    if (!visible) return;

    setPublishNewVersion(false);

    if (initialValues) {
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

  // Versioning only means anything for a document users have to accept.
  const showLegalSettings = requiresAcceptance;
  const showVersionFields = showLegalSettings && (!isEditing || publishNewVersion);

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width="min(780px, calc(100vw - 24px))"
      centered
      destroyOnHidden
      className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-5 sm:[&_.ant-modal-content]:p-8 [&_.ant-modal-body]:pt-0"
      title={
        <div className="text-center mb-4">
          <h3 className="text-[20px] sm:text-[24px] font-bold text-slate-800">
            {isEditing ? "Edit Static Page" : "Add Static Page"}
          </h3>
          {isEditing && initialValues?.requiresAcceptance && (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
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
      <Form form={form} layout="vertical" className="flex min-h-0 flex-col">
        {/* The form scrolls on its own so the actions stay reachable on short
            screens — a centered modal taller than the viewport clips both ends. */}
        <div className="-mr-2 max-h-[58vh] space-y-5 overflow-y-auto overflow-x-hidden pr-2 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
            <Form.Item
              name="slug"
              label={<span className={labelClass}>Page Type</span>}
              rules={[{ required: true, message: "Please select a page type" }]}
              className="mb-0"
            >
              <Select
                placeholder="Select page type"
                options={slugOptions}
                disabled={isEditing}
                onChange={handleSlugChange}
                className={selectClass}
              />
            </Form.Item>

            <Form.Item
              name="locale"
              label={<span className={labelClass}>Language</span>}
              className="mb-0"
            >
              <Select
                placeholder="Select language"
                className={selectClass}
                options={[
                  { label: "Italian (it)", value: "it" },
                  { label: "English (en)", value: "en" },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="title"
            label={<span className={labelClass}>Title</span>}
            rules={[{ required: true, message: "Please enter a title" }]}
            className="mb-0"
          >
            <Input placeholder="Enter page title" className={inputClass} maxLength={255} />
          </Form.Item>

          <Form.Item
            name="content"
            label={<span className={labelClass}>Content</span>}
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
              className="[&_.ql-toolbar]:rounded-t-xl [&_.ql-toolbar]:border-slate-200 [&_.ql-container]:rounded-b-xl [&_.ql-container]:border-slate-200 [&_.ql-container]:max-h-[280px] [&_.ql-container]:overflow-y-auto [&_.ql-editor]:min-h-[180px]"
            />
          </Form.Item>

          {/* ── Consent settings ───────────────────────────────── */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5 space-y-5">
            <div className="flex items-center gap-2">
              <FiInfo className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="text-sm font-bold text-slate-600">Consent & Versioning</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
              <Form.Item
                name="requiresAcceptance"
                label={
                  <Tooltip title="Users must actively accept this document before they can use the app">
                    <span className={labelClass}>Requires acceptance</span>
                  </Tooltip>
                }
                valuePropName="checked"
                className="mb-0 [&_.ant-form-item-control-input]:min-h-11"
              >
                <Switch onChange={setRequiresAcceptance} />
              </Form.Item>

              {showLegalSettings && (
                <Form.Item
                  name="audience"
                  label={<span className={labelClass}>Applies to</span>}
                  className="mb-0"
                  extra={
                    <span className="text-xs text-slate-400">
                      {audienceOptions.find((o) => o.value === audience)?.hint}
                    </span>
                  }
                >
                  {/* The hint lives in the dropdown and below the field — a
                      two-line label inside the selector overflows its box. */}
                  <Select
                    className={selectClass}
                    options={audienceOptions}
                    optionRender={(option) => (
                      <div className="flex flex-col py-0.5">
                        <span className="text-sm text-slate-700">{option.data.label}</span>
                        <span className="text-[11px] text-slate-400">{option.data.hint}</span>
                      </div>
                    )}
                  />
                </Form.Item>
              )}
            </div>

            {showLegalSettings && isEditing && (
              <div className="flex items-start gap-3 rounded-xl bg-white border border-slate-100 px-4 py-3">
                <Switch
                  checked={publishNewVersion}
                  onChange={handleTogglePublishNewVersion}
                  className="mt-0.5 shrink-0"
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

            {showVersionFields && (
              <>
                <Form.Item
                  name="version"
                  label={<span className={labelClass}>Version</span>}
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
                    className={`${inputClass} max-w-[200px]`}
                    maxLength={20}
                  />
                </Form.Item>

                <Form.Item
                  name="changeSummary"
                  label={<span className={labelClass}>What changed</span>}
                  extra={
                    <span className="block text-xs leading-relaxed text-slate-400">
                      Shown at the top of the re-acceptance prompt in the app. A short,
                      plain-language summary gets read; the full document usually does not.
                    </span>
                  }
                  // showCount hangs its counter below the field, where the
                  // helper text would otherwise sit on top of it.
                  className="mb-0 [&_.ant-form-item-extra]:mt-6"
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
            label={<span className={labelClass}>Active</span>}
            valuePropName="checked"
            className="mb-0"
          >
            <Switch />
          </Form.Item>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-3 border-t border-slate-100 pt-5">
          <Button
            onClick={onCancel}
            className="flex-1 h-12 rounded-2xl bg-[#FFF1F1] border-none text-[#FF4D4F] font-bold text-base hover:bg-[#FFE4E4]! order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isLoading}
            className="flex-1 h-12 rounded-2xl bg-[#8b85f6] border-none text-white font-bold text-base hover:bg-[#7a74e5]! order-1 sm:order-2"
          >
            {publishNewVersion ? "Publish new version" : "Save"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddEditStaticPageModal;
