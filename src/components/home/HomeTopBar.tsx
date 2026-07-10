import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Form, Input, Modal, Select, Upload, message } from "antd";
import type { UploadFile } from "antd";
import { FiSearch, FiUploadCloud } from "react-icons/fi";
import { FaPlus } from "react-icons/fa6";
import { MdOutlineUploadFile } from "react-icons/md";
import { HiOutlineUserPlus } from "react-icons/hi2";
import { useUploadBillMutation } from "../../redux/features/Bills/billApi";

type ModalType = "contract" | "upload" | "lead" | null;

const actionBtn =
  "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition";

export function HomeTopBar() {
  const { t } = useTranslation();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [uploadBill, { isLoading: isUploading }] = useUploadBillMutation();
  const [uploadFile, setUploadFile] = useState<UploadFile | null>(null);
  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            type="button"
            className={`${actionBtn} bg-[#3B82F6] hover:bg-[#2563EB]`}
            onClick={() => setActiveModal("contract")}
          >
            <FaPlus className="h-4 w-4" />
            {t("home.new_contract")}
          </button>
          <button
            type="button"
            className={`${actionBtn} bg-[#22C55E] hover:bg-[#16A34A]`}
            onClick={() => setActiveModal("upload")}
          >
            <MdOutlineUploadFile className="h-5 w-5" />
            {t("home.upload_bill")}
          </button>
          <button
            type="button"
            className={`${actionBtn} bg-[#8B5CF6] hover:bg-[#7C3AED]`}
            onClick={() => setActiveModal("lead")}
          >
            <HiOutlineUserPlus className="h-5 w-5" />
            {t("home.new_lead")}
          </button>
        </div>
        <Input
          size="large"
          placeholder={t("home.search_placeholder")}
          prefix={<FiSearch className="text-owngray" />}
          className="max-w-full lg:max-w-md rounded-lg border-gray-200"
          allowClear
        />
      </div>

      <Modal
        title={<span className="text-xl font-bold text-slate-800">{t("home.new_contract")}</span>}
        open={activeModal === "contract"}
        onCancel={() => setActiveModal(null)}
        footer={null}
        destroyOnClose
        width={680}
        centered
        className="home-action-modal"
      >
        <Form layout="vertical" className="pt-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <Form.Item label={t("home.first_name")} className="mb-2">
              <Input placeholder={t("home.enter_first_name")} />
            </Form.Item>
            <Form.Item label={t("home.last_name")} className="mb-2">
              <Input placeholder={t("home.enter_last_name")} />
            </Form.Item>
            <Form.Item label={t("home.tax_id")} className="mb-2">
              <Input placeholder={t("home.enter_tax_id")} />
            </Form.Item>
            <Form.Item label={t("home.pod_pdr_number")} className="mb-2">
              <Input placeholder="IT001E..." />
            </Form.Item>
            <Form.Item label={t("home.contract_type")} className="mb-2">
              <Select
                placeholder={t("home.select_type")}
                options={[
                  { value: "electricity", label: t("home.electricity") },
                  { value: "gas", label: t("home.gas") },
                  { value: "dual", label: t("home.dual_fuel") },
                ]}
              />
            </Form.Item>
          </div>
          <Form.Item label={t("home.email")} className="mb-2">
            <Input placeholder="customer@email.com" />
          </Form.Item>
          <Form.Item label={t("home.phone")} className="mb-2">
            <Input placeholder="+39 123 456 7890" />
          </Form.Item>
          <Form.Item label={t("home.address")} className="mb-2">
            <Input.TextArea placeholder={t("home.enter_full_address")} autoSize={{ minRows: 2, maxRows: 3 }} />
          </Form.Item>
          <div className="grid gap-3 sm:grid-cols-2">
            <Form.Item label={t("home.start_date")} className="mb-2">
              <Input placeholder="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item label={t("home.contract_duration")} className="mb-2">
              <Select
                placeholder={t("home.select_duration")}
                options={[
                  { value: "12m", label: t("home.12_months") },
                  { value: "24m", label: t("home.24_months") },
                  { value: "36m", label: t("home.36_months") },
                ]}
              />
            </Form.Item>
          </div>
          <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button onClick={() => setActiveModal(null)}>{t("common.cancel")}</Button>
            <Button type="primary">{t("home.create_contract")}</Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title={<span className="text-xl font-bold text-slate-800">{t("home.upload_bill_ocr")}</span>}
        open={activeModal === "upload"}
        onCancel={() => setActiveModal(null)}
        footer={null}
        destroyOnClose
        width={560}
        centered
        className="home-action-modal"
      >
        <Form
          layout="vertical"
          className="pt-2"
          onFinish={async (values: { billType: string }) => {
            if (!uploadFile?.originFileObj) {
              message.error(t("home.please_select_file"));
              return;
            }
            const formData = new FormData();
            formData.append("file", uploadFile.originFileObj);
            formData.append("billType", values.billType);
            try {
              await uploadBill(formData).unwrap();
              message.success(t("home.bill_uploaded_ocr_processing"));
              setUploadFile(null);
              setActiveModal(null);
            } catch {
              message.error(t("home.failed_upload_bill"));
            }
          }}
        >
          <Form.Item label={t("home.bill_type")} name="billType" className="mb-2" rules={[{ required: true, message: t("home.select_bill_type") }]}>
            <Select
              placeholder={t("home.select_bill_type")}
              options={[
                { value: "electricity", label: t("home.electricity") },
                { value: "gas", label: t("home.gas") },
              ]}
            />
          </Form.Item>
          <Form.Item label={t("home.upload_bill_document")} className="mb-2">
            <Upload.Dragger
              beforeUpload={(file) => { setUploadFile({ uid: file.uid, name: file.name, originFileObj: file } as UploadFile); return false; }}
              multiple={false}
              fileList={uploadFile ? [uploadFile] : []}
              onRemove={() => setUploadFile(null)}
            >
              <div className="py-6">
                <FiUploadCloud className="mx-auto mb-3 h-8 w-8 text-owngray" />
                <p className="text-sm text-brand">{t("home.click_upload_drag_drop")}</p>
                <p className="text-xs text-owngray">{t("home.pdf_jpg_png_10mb")}</p>
              </div>
            </Upload.Dragger>
          </Form.Item>
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
            {t("home.ocr_processing_info")}
          </div>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button onClick={() => { setActiveModal(null); setUploadFile(null); }}>{t("common.cancel")}</Button>
            <Button type="primary" htmlType="submit" loading={isUploading} className="!bg-[#22C55E] hover:!bg-[#16A34A]">
              {t("home.upload_process")}
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title={<span className="text-xl font-bold text-slate-800">{t("home.new_lead")}</span>}
        open={activeModal === "lead"}
        onCancel={() => setActiveModal(null)}
        footer={null}
        destroyOnClose
        width={640}
        centered
        className="home-action-modal"
      >
        <Form layout="vertical" className="pt-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <Form.Item label={t("home.lead_type")} className="mb-2">
              <Select
                placeholder={t("home.select_lead_type")}
                options={[
                  { value: "residential", label: t("home.residential") },
                  { value: "business", label: t("home.business") },
                ]}
              />
            </Form.Item>
            <Form.Item label={t("home.priority")} className="mb-2">
              <Select
                placeholder={t("home.priority")}
                options={[
                  { value: "high", label: t("home.high") },
                  { value: "medium", label: t("home.medium") },
                  { value: "low", label: t("home.low") },
                ]}
              />
            </Form.Item>
            <Form.Item label={t("home.name_company")} className="mb-2">
              <Input placeholder={t("home.enter_name_company")} />
            </Form.Item>
            <Form.Item label={t("home.contact_person")} className="mb-2">
              <Input placeholder={t("home.contact_person")} />
            </Form.Item>
            <Form.Item label={t("home.email")} className="mb-2">
              <Input placeholder="email@example.com" />
            </Form.Item>
            <Form.Item label={t("home.phone")} className="mb-2">
              <Input placeholder="+39 123 456 7890" />
            </Form.Item>
          </div>
          <Form.Item label={t("home.estimated_annual_value")} className="mb-2">
            <Input placeholder="€ 24,000" />
          </Form.Item>
          <Form.Item label={t("home.source")} className="mb-2">
            <Select
              placeholder={t("home.source")}
              options={[
                { value: "website", label: t("home.website") },
                { value: "partner", label: t("home.partner") },
                { value: "referral", label: t("home.referral") },
              ]}
            />
          </Form.Item>
          <Form.Item label={t("home.notes")} className="mb-2">
            <Input.TextArea placeholder={t("home.add_relevant_notes")} autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
          <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button onClick={() => setActiveModal(null)}>{t("common.cancel")}</Button>
            <Button type="primary">{t("home.create_lead")}</Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
