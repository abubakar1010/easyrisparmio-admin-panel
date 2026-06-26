import { useState } from "react";
import { Button, Form, Input, Modal, Select, Upload } from "antd";
import { FiSearch, FiUploadCloud } from "react-icons/fi";
import { FaPlus } from "react-icons/fa6";
import { MdOutlineUploadFile } from "react-icons/md";
import { HiOutlineUserPlus } from "react-icons/hi2";

type ModalType = "contract" | "upload" | "lead" | null;

const actionBtn =
  "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition";

export function HomeTopBar() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  // console.log(activeModal);
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
            New Contract
          </button>
          <button
            type="button"
            className={`${actionBtn} bg-[#22C55E] hover:bg-[#16A34A]`}
            onClick={() => setActiveModal("upload")}
          >
            <MdOutlineUploadFile className="h-5 w-5" />
            Upload Bill
          </button>
          <button
            type="button"
            className={`${actionBtn} bg-[#8B5CF6] hover:bg-[#7C3AED]`}
            onClick={() => setActiveModal("lead")}
          >
            <HiOutlineUserPlus className="h-5 w-5" />
            New Lead
          </button>
        </div>
        <Input
          size="large"
          placeholder="Search by Name, Tax ID, POD, PDR..."
          prefix={<FiSearch className="text-owngray" />}
          className="max-w-full lg:max-w-md rounded-lg border-gray-200"
          allowClear
        />
      </div>

      <Modal
        title={<span className="text-xl font-bold text-slate-800">New Contract</span>}
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
            <Form.Item label="First Name" className="mb-2">
              <Input placeholder="Enter first name" />
            </Form.Item>
            <Form.Item label="Last Name" className="mb-2">
              <Input placeholder="Enter last name" />
            </Form.Item>
            <Form.Item label="Tax ID" className="mb-2">
              <Input placeholder="Enter tax ID" />
            </Form.Item>
            <Form.Item label="POD/PDR Number" className="mb-2">
              <Input placeholder="IT001E..." />
            </Form.Item>
            <Form.Item label="Contract Type" className="mb-2">
              <Select
                placeholder="Select type"
                options={[
                  { value: "electricity", label: "Electricity" },
                  { value: "gas", label: "Gas" },
                  { value: "dual", label: "Dual Fuel" },
                ]}
              />
            </Form.Item>
          </div>
          <Form.Item label="Email" className="mb-2">
            <Input placeholder="customer@email.com" />
          </Form.Item>
          <Form.Item label="Phone" className="mb-2">
            <Input placeholder="+39 123 456 7890" />
          </Form.Item>
          <Form.Item label="Address" className="mb-2">
            <Input.TextArea placeholder="Enter full address" autoSize={{ minRows: 2, maxRows: 3 }} />
          </Form.Item>
          <div className="grid gap-3 sm:grid-cols-2">
            <Form.Item label="Start Date" className="mb-2">
              <Input placeholder="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item label="Contract Duration" className="mb-2">
              <Select
                placeholder="Select duration"
                options={[
                  { value: "12m", label: "12 Months" },
                  { value: "24m", label: "24 Months" },
                  { value: "36m", label: "36 Months" },
                ]}
              />
            </Form.Item>
          </div>
          <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button type="primary">Create Contract</Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title={<span className="text-xl font-bold text-slate-800">Upload Bill (OCR)</span>}
        open={activeModal === "upload"}
        onCancel={() => setActiveModal(null)}
        footer={null}
        destroyOnClose
        width={560}
        centered
        className="home-action-modal"
      >
        <Form layout="vertical" className="pt-2">
          <Form.Item label="Customer Name or Tax ID" className="mb-2">
            <Input placeholder="Search existing customer" />
          </Form.Item>
          <Form.Item label="Bill Type" className="mb-2">
            <Select
              placeholder="Select bill type"
              options={[
                { value: "electricity", label: "Electricity" },
                { value: "gas", label: "Gas" },
                { value: "water", label: "Water" },
              ]}
            />
          </Form.Item>
          <Form.Item label="Upload Bill Document" className="mb-2">
            <Upload.Dragger beforeUpload={() => false} multiple={false} showUploadList={false}>
              <div className="py-6">
                <FiUploadCloud className="mx-auto mb-3 h-8 w-8 text-owngray" />
                <p className="text-sm text-brand">Click to upload or drag and drop</p>
                <p className="text-xs text-owngray">PDF, JPG, PNG up to 10MB</p>
              </div>
            </Upload.Dragger>
          </Form.Item>
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
            OCR Processing: the system will automatically extract POD/PDR, consumption data, and billing information.
          </div>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button type="primary" className="!bg-[#22C55E] hover:!bg-[#16A34A]">
              Upload &amp; Process
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title={<span className="text-xl font-bold text-slate-800">New Lead</span>}
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
            <Form.Item label="Lead Type" className="mb-2">
              <Select
                placeholder="Select lead type"
                options={[
                  { value: "residential", label: "Residential" },
                  { value: "business", label: "Business" },
                ]}
              />
            </Form.Item>
            <Form.Item label="Priority" className="mb-2">
              <Select
                placeholder="Priority level"
                options={[
                  { value: "high", label: "High" },
                  { value: "medium", label: "Medium" },
                  { value: "low", label: "Low" },
                ]}
              />
            </Form.Item>
            <Form.Item label="Name / Company" className="mb-2">
              <Input placeholder="Enter name or company" />
            </Form.Item>
            <Form.Item label="Contact Person" className="mb-2">
              <Input placeholder="Contact name" />
            </Form.Item>
            <Form.Item label="Email" className="mb-2">
              <Input placeholder="email@example.com" />
            </Form.Item>
            <Form.Item label="Phone" className="mb-2">
              <Input placeholder="+39 123 456 7890" />
            </Form.Item>
          </div>
          <Form.Item label="Estimated Annual Value" className="mb-2">
            <Input placeholder="€ 24,000" />
          </Form.Item>
          <Form.Item label="Source" className="mb-2">
            <Select
              placeholder="Lead source"
              options={[
                { value: "website", label: "Website" },
                { value: "partner", label: "Partner" },
                { value: "referral", label: "Referral" },
              ]}
            />
          </Form.Item>
          <Form.Item label="Notes" className="mb-2">
            <Input.TextArea placeholder="Add any relevant notes..." autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
          <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button type="primary">Create Lead</Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
