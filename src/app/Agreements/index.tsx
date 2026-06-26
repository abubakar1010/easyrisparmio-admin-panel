import { Button, Card, DatePicker, Form, Input, Modal, Select, Switch, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiEdit2, FiEye, FiPlus, FiTag, FiTrash2, FiUpload } from "react-icons/fi";
import { LuCalendarDays } from "react-icons/lu";
import { useState } from "react";

type AgreementCategory = "Restaurant" | "Brand" | "Service";
type AgreementStatus = "Active" | "Inactive";

type AgreementRow = {
  key: string;
  partner: string;
  logo: string;
  category: AgreementCategory;
  discount: string;
  validityStart: string;
  validityEnd: string;
  status: AgreementStatus;
};

const categoryColor: Record<AgreementCategory, string> = {
  Restaurant: "gold",
  Brand: "blue",
  Service: "purple",
};

const agreements: AgreementRow[] = [
  {
    key: "1",
    partner: "Restaurant Da Mario",
    logo: "🍕",
    category: "Restaurant",
    discount: "15% off the entire menu",
    validityStart: "01/01/2026",
    validityEnd: "31/12/2026",
    status: "Active",
  },
  {
    key: "2",
    partner: "Nike Store",
    logo: "👟",
    category: "Brand",
    discount: "20% off selected items",
    validityStart: "01/03/2026",
    validityEnd: "01/03/2027",
    status: "Active",
  },
  {
    key: "3",
    partner: "Wellness Spa",
    logo: "🧘",
    category: "Service",
    discount: "EUR10 discount on treatments",
    validityStart: "15/02/2026",
    validityEnd: "15/08/2026",
    status: "Inactive",
  },
];

const previewCards = [
  {
    id: "1",
    logo: "🍕",
    partner: "Restaurant Da Mario",
    category: "Restaurant" as AgreementCategory,
    discount: "15% off the entire menu",
    description: "Valid from Monday to Thursday, excluding holidays. Reservation required.",
    validUntil: "31/12/2026",
  },
  {
    id: "2",
    logo: "👟",
    partner: "Nike Store",
    category: "Brand" as AgreementCategory,
    discount: "20% off selected items",
    description: "Discount applicable online and in-store, not combinable with other promotions.",
    validUntil: "01/03/2027",
  },
];

const Agreements = () => {
  const [addPartnerOpen, setAddPartnerOpen] = useState(false);
  const [partnerForm] = Form.useForm();

  const closePartnerModal = () => {
    setAddPartnerOpen(false);
    partnerForm.resetFields();
  };

  const submitPartnerForm = () => {
    closePartnerModal();
  };

  const columns: ColumnsType<AgreementRow> = [
    {
      title: "PARTNER",
      dataIndex: "partner",
      key: "partner",
      width: 260,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-lg">
            {record.logo}
          </span>
          <span className="font-semibold text-slate-700">{record.partner}</span>
        </div>
      ),
    },
    {
      title: "CATEGORY",
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (value: AgreementCategory) => (
        <Tag color={categoryColor[value]} className="rounded-full! border-0 px-2 pb-0.5! text-[10px] font-semibold">
          {value}
        </Tag>
      ),
      align: "center",
    },
    {
      title: "DISCOUNT",
      dataIndex: "discount",
      key: "discount",
      render: (value: string) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
          <FiTag className="text-emerald-500" />
          {value}
        </span>
      ),
    },
    {
      title: "VALIDITY",
      key: "validity",
      width: 160,
      render: (_, record) => (
        <div className="text-sm text-slate-500">
          <p className="inline-flex items-center gap-1.5">
            <LuCalendarDays className="h-3.5 w-3.5" />
            {record.validityStart}
          </p>
          <p>{record.validityEnd}</p>
        </div>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (value: AgreementStatus) => (
        <div className="flex items-center gap-2">
          <Switch size="small" checked={value === "Active"} />
          <span className={`text-sm font-medium ${value === "Active" ? "text-emerald-600" : "text-slate-500"}`}>
            {value}
          </span>
        </div>
      ),
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 110,
      render: () => (
        <div className="flex items-center gap-1">
          <Button type="text" size="small" icon={<FiEdit2 className="text-emerald-500" />} />
          <Button type="text" size="small" icon={<FiEye className="text-slate-500" />} />
          <Button type="text" size="small" icon={<FiTrash2 className="text-rose-400" />} />
        </div>
      ),
      align: "center",
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      <div className="mb-4 flex flex-col gap-3 border-b border-cborder/45 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-brand">Agreements</h2>
          <p className="text-sm text-owngray">Management of partnerships and discounts for customers</p>
        </div>
        <Button
          type="primary"
          icon={<FiPlus />}
          className="h-10 rounded-lg border-0 bg-[#8b85f6] px-5 font-semibold hover:bg-[#7a74e5]"
          onClick={() => setAddPartnerOpen(true)}
        >
          Add Partner
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <Table<AgreementRow>
          rowKey="key"
          columns={columns}
          dataSource={agreements}
          pagination={false}
          scroll={{ x: 920 }}
          className="[&_.ant-table-thead_th]:bg-slate-50 [&_.ant-table-thead_th]:text-[11px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:text-slate-500 [&_.ant-table-thead_th]:tracking-wider [&_.ant-table-cell]:py-3"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-slate-800">Mobile App Preview</h3>
          <p className="text-xs text-slate-400">How it appears in the "Agreements" section</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {previewCards.map((card) => (
            <Card
              key={card.id}
              className="overflow-hidden rounded-3xl border-slate-200/80 bg-white shadow-[0_12px_35px_-18px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-20px_rgba(15,23,42,0.38)] [&_.ant-card-body]:p-6 sm:[&_.ant-card-body]:p-7"
            >
              <div className="text-center">
                <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-3xl">
                  {card.logo}
                </div>
                <h4 className="text-[26px] font-bold leading-tight tracking-tight text-slate-800">{card.partner}</h4>
                <Tag
                  color={categoryColor[card.category]}
                  className="mb-5 mt-2! rounded-full! border-0 px-2.5 py-0.5! text-xs font-semibold"
                >
                  {card.category}
                </Tag>

                <div className="my-5 rounded-2xl bg-linear-to-r from-indigo-500 via-violet-500 to-purple-500 px-4 py-2.5 text-white shadow-[0_10px_22px_-10px_rgba(99,102,241,0.65)]">
                  <p className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight">
                    <FiTag className="h-4 w-4" />
                    {card.discount}
                  </p>
                </div>

                <p className="mx-auto max-w-[500px] text-[15px] leading-relaxed text-slate-500">{card.description}</p>
                <p className="mt-4 text-sm font-medium text-slate-400">Valid until {card.validUntil}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Modal
        open={addPartnerOpen}
        onCancel={closePartnerModal}
        footer={null}
        centered
        destroyOnClose
        width={980}
        className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-4 sm:[&_.ant-modal-content]:p-6"
      >
        <h3 className="mb-4 text-2xl font-semibold text-slate-800">Add New Agreement</h3>
        <Form form={partnerForm} layout="vertical" onFinish={submitPartnerForm}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Form.Item
              name="partnerName"
              label="Partner Name"
              rules={[{ required: true, message: "Please enter partner name" }]}
            >
              <Input className="h-11 rounded-lg" placeholder="E.g.: Restaurant Da Mario" />
            </Form.Item>
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: "Please select category" }]}
            >
              <Select
                size="large"
                className="[&_.ant-select-selector]:h-11! [&_.ant-select-selector]:rounded-lg! [&_.ant-select-selection-placeholder]:leading-[42px]! [&_.ant-select-selection-item]:leading-[42px]!"
                placeholder="Select category"
                options={[
                  { value: "Restaurant", label: "Restaurant" },
                  { value: "Brand", label: "Brand" },
                  { value: "Service", label: "Service" },
                ]}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Form.Item
              name="logo"
              label="Logo (Emoji or Upload)"
              rules={[{ required: true, message: "Please provide logo" }]}
            >
              <Input
                size="large"
                placeholder="🍕"
                className="rounded-lg! h-11!"
                suffix={<FiUpload className="text-slate-500" />}
              />
            </Form.Item>
            <Form.Item
              name="discount"
              label="Discount Offered"
              rules={[{ required: true, message: "Please enter discount" }]}
            >
              <Input className="h-11 rounded-lg" placeholder="E.g.: 15% off the entire menu" />
            </Form.Item>
          </div>

          <Form.Item
            name="terms"
            label="Terms and Conditions"
            rules={[{ required: true, message: "Please add terms and conditions" }]}
          >
            <Input.TextArea
              rows={4}
              className="rounded-lg"
              placeholder="Describe the conditions of use for the discount..."
            />
          </Form.Item>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Form.Item
              name="validFrom"
              label="Valid From"
              rules={[{ required: true, message: "Please select start date" }]}
            >
              <DatePicker className="h-11! w-full rounded-lg" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item
              name="validUntil"
              label="Valid Until"
              rules={[{ required: true, message: "Please select end date" }]}
            >
              <DatePicker className="h-11! w-full rounded-lg" format="DD/MM/YYYY" />
            </Form.Item>
          </div>

          <Form.Item name="location" label="Location" rules={[{ required: true, message: "Please enter location" }]}>
            <Input className="h-11 rounded-lg" placeholder="E.g.: Restaurant Da Mario" />
          </Form.Item>

          <Button
            htmlType="submit"
            type="primary"
            className="h-11 w-full rounded-xl border-0 bg-[#8b85f6] text-base font-semibold hover:bg-[#7a74e5]"
          >
            Save Agreement
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default Agreements;
