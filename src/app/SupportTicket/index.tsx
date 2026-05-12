import { Button, Form, Input, Modal, Select, Card, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiClock, FiEye, FiFolder, FiPlus, FiSearch, FiUser } from "react-icons/fi";
import { useState } from "react";
import CategoryFAQModal from "./components/CategoryFAQModal";
import AddEditFAQModal from "./components/AddEditFAQModal";

type TicketStatus = "Open" | "In Progress" | "Resolved";

export type SupportTicketRow = {
  key: string;
  id: string;
  customer: string;
  category: string;
  status: TicketStatus;
  lastUpdate: string;
};

export type FAQCategoryRow = {
  key: string;
  order: number;
  categoryName: string;
  faqCount: string;
  lastUpdated: string;
  updatedBy: string;
};

const faqCategories: FAQCategoryRow[] = [
  {
    key: "1",
    order: 1,
    categoryName: "How to Get Started",
    faqCount: "8 FAQs",
    lastUpdated: "2026-04-20",
    updatedBy: "by Maria Ferrari",
  },
  {
    key: "2",
    order: 2,
    categoryName: "Configuration Utilities",
    faqCount: "12 FAQs",
    lastUpdated: "2026-04-18",
    updatedBy: "by Giuseppe Verdi",
  },
  {
    key: "3",
    order: 3,
    categoryName: "Bills",
    faqCount: "6 FAQs",
    lastUpdated: "2026-04-15",
    updatedBy: "by Maria Ferrari",
  },
];

const ticketRows: SupportTicketRow[] = [
  {
    key: "1",
    id: "#T001",
    customer: "Mario Rossi",
    category: "Bill Problem",
    status: "Open",
    lastUpdate: "2026-04-14 10:30",
  },
  {
    key: "2",
    id: "#T002",
    customer: "Giulia Bianchi",
    category: "Complaint",
    status: "In Progress",
    lastUpdate: "2026-04-14 09:15",
  },
  {
    key: "3",
    id: "#T003",
    customer: "Luca Ferrari",
    category: "Info Request",
    status: "Resolved",
    lastUpdate: "2026-04-13 16:30",
  },
  {
    key: "4",
    id: "#T004",
    customer: "Anna Verde",
    category: "Technical Issue",
    status: "In Progress",
    lastUpdate: "2026-04-15 08:45",
  },
];

const statusStyles: Record<TicketStatus, string> = {
  Open: "bg-blue-500 text-white",
  "In Progress": "bg-amber-500 text-white",
  Resolved: "bg-emerald-500 text-white",
};

const SupportTicket = () => {
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [addEditModalVisible, setAddEditModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FAQCategoryRow | null>(null);
  const [selectedFAQ, setSelectedFAQ] = useState<any>(null);
  const [ticketForm] = Form.useForm();

  const closeTicketModal = () => {
    setNewTicketOpen(false);
    ticketForm.resetFields();
  };

  const submitTicketForm = () => {
    closeTicketModal();
  };

  const handleViewCategory = (category: FAQCategoryRow) => {
    setSelectedCategory(category);
    setCategoryModalVisible(true);
  };

  const handleAddFAQ = () => {
    setSelectedFAQ(null);
    setAddEditModalVisible(true);
  };

  const handleEditFAQ = (faq: any) => {
    setSelectedFAQ(faq);
    setAddEditModalVisible(true);
  };

  const handleSaveFAQ = (values: any) => {
    console.log("Saving FAQ:", values);
    setAddEditModalVisible(false);
  };

  const faqColumns: ColumnsType<FAQCategoryRow> = [
    {
      title: "ORDER",
      dataIndex: "order",
      key: "order",
      width: 100,
      render: (value: number) => <span className="text-slate-500">{value}</span>,
    },
    {
      title: "CATEGORY NAME",
      dataIndex: "categoryName",
      key: "categoryName",
      render: (value: string) => <span className="font-semibold text-slate-700">{value}</span>,
    },
    {
      title: "FAQ COUNT",
      dataIndex: "faqCount",
      key: "faqCount",
      render: (value: string) => <span className="text-slate-500">{value}</span>,
    },
    {
      title: "LAST UPDATED",
      key: "lastUpdated",
      render: (_: any, record: FAQCategoryRow) => (
        <div className="text-sm">
          <p className="font-medium text-slate-700">{record.lastUpdated}</p>
          <p className="text-[11px] text-slate-400">{record.updatedBy}</p>
        </div>
      ),
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 120,
      render: (_: any, record: FAQCategoryRow) => (
        <div className="flex items-center gap-3">
          <Button
            type="text"
            size="small"
            icon={<FiEye className="text-blue-500 h-4 w-4" />}
            onClick={() => handleViewCategory(record)}
          />
          <Button
            type="primary"
            size="small"
            className="flex items-center justify-center bg-[#8b85f6] hover:bg-[#7a74e5]! border-none h-8 w-8 rounded-full"
            icon={<FiPlus className="text-white h-4 w-4" />}
            onClick={handleAddFAQ}
          />
        </div>
      ),
      align: "center",
    },
  ];

  const ticketColumns: ColumnsType<SupportTicketRow> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 90,
      render: (value: string) => <span className="font-bold text-slate-700">{value}</span>,
    },
    {
      title: "CUSTOMER",
      dataIndex: "customer",
      key: "customer",
      width: 200,
      render: (value: string) => (
        <span className="inline-flex items-center gap-2 text-slate-700">
          <FiUser className="h-4 w-4 text-slate-400" />
          {value}
        </span>
      ),
    },
    {
      title: "CATEGORY",
      dataIndex: "category",
      key: "category",
      width: 160,
      render: (value: string) => (
        <Tag className="rounded border-0 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">{value}</Tag>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (value: TicketStatus) => (
        <Tag className={`rounded-full! border-0 px-3 pb-0.5! text-[10px] font-bold ${statusStyles[value]}`}>
          {value}
        </Tag>
      ),
      align: "center",
    },
    {
      title: "LAST UPDATE",
      dataIndex: "lastUpdate",
      key: "lastUpdate",
      width: 180,
      render: (value: string) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
          <FiClock className="h-3.5 w-3.5" />
          {value}
        </span>
      ),
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 100,
      render: () => (
        <button type="button" className="inline-flex items-center gap-1.5 text-emerald-500 hover:text-emerald-600 font-medium text-sm">
          <FiFolder className="h-4 w-4" />
          Open
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div className="mb-4 flex flex-col gap-3 border-b border-cborder/45 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Support Ticket</h2>
          <p className="text-sm text-slate-400 font-medium">Managing Support Requests</p>
        </div>
        <Button
          type="primary"
          icon={<FiPlus />}
          className="h-10 rounded-lg border-0 bg-[#8b85f6] px-5 font-semibold hover:bg-[#7a74e5]"
          onClick={() => setNewTicketOpen(true)}
        >
          New Ticket
        </Button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: "Open", value: "12", dot: "bg-blue-500" },
          { label: "In Progress", value: "8", dot: "bg-amber-500" },
          { label: "Awaiting Customer", value: "5", dot: "bg-violet-500" },
          { label: "Resolved", value: "34", dot: "bg-emerald-500" },
          { label: "Closed", value: "156", dot: "bg-slate-500" },
        ].map((item) => (
          <Card key={item.label} className="rounded-2xl border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] [&_.ant-card-body]:p-5">
            <p className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span className={`h-2 w-2 rounded-full ${item.dot}`} />
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-700">{item.value}</p>
          </Card>
        ))}
      </div>

      {/* FAQ Categories Section */}
      <Card
        className="rounded-2xl border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] overflow-hidden"
        title={<span className="text-lg font-bold text-slate-700">FAQ Categories Overview</span>}
        styles={{ header: { borderBottom: '1px solid #f1f5f9', padding: '16px 20px' }, body: { padding: '0' } }}
      >
        <Table<FAQCategoryRow>
          rowKey="key"
          columns={faqColumns}
          dataSource={faqCategories}
          pagination={false}
          scroll={{ x: 800 }}
          className="[&_.ant-table-thead_th]:bg-slate-50/50 [&_.ant-table-thead_th]:text-[11px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:text-slate-400 [&_.ant-table-thead_th]:tracking-widest [&_.ant-table-cell]:px-5 [&_.ant-table-cell]:py-4"
        />
      </Card>

      {/* Search Bar Section */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
        <Input
          className="h-11 rounded-xl border-slate-100 bg-slate-50/30 text-[15px]"
          prefix={<FiSearch className="mr-2 text-slate-300 h-5 w-5" />}
          placeholder="Search tickets by ID, customer, subject..."
        />
      </div>

      {/* Tickets Table Section */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
        <Table<SupportTicketRow>
          rowKey="key"
          columns={ticketColumns}
          dataSource={ticketRows}
          pagination={false}
          scroll={{ x: 1000 }}
          className="[&_.ant-table-thead_th]:bg-slate-50/50 [&_.ant-table-thead_th]:text-[11px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:text-slate-400 [&_.ant-table-thead_th]:tracking-widest [&_.ant-table-cell]:px-5 [&_.ant-table-cell]:py-5"
        />
      </div>

      <Modal
        open={newTicketOpen}
        onCancel={closeTicketModal}
        footer={null}
        centered
        destroyOnClose
        width={780}
        className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-4 sm:[&_.ant-modal-content]:p-6"
      >
        <h3 className="mb-4 text-2xl font-semibold text-slate-800">Add New Ticket</h3>

        <Form form={ticketForm} layout="vertical" onFinish={submitTicketForm}>
          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: "Please enter subject" }]}
          >
            <Input className="h-11 rounded-lg border-slate-300" placeholder="E.g: Restaurant Da Mario" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: "Please select category" }]}
          >
            <Select
              className="[&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-lg [&_.ant-select-selector]:border-slate-300 [&_.ant-select-selection-item]:leading-[42px] [&_.ant-select-selection-placeholder]:leading-[42px]"
              placeholder="Select category"
              options={[
                { value: "Bill Problem", label: "Bill Problem" },
                { value: "Complaint", label: "Complaint" },
                { value: "Info Request", label: "Info Request" },
                { value: "Technical Issue", label: "Technical Issue" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="messageDetails"
            label="Message Details"
            rules={[{ required: true, message: "Please enter message details" }]}
          >
            <Input.TextArea rows={4} className="rounded-lg border-slate-300" placeholder="Type ticket details..." />
          </Form.Item>

          <Button
            htmlType="submit"
            type="primary"
            className="h-11 w-full rounded-xl border-0 bg-[#8b85f6] text-base font-semibold hover:bg-[#7a74e5]"
          >
            Save Ticket
          </Button>
        </Form>
      </Modal>
      <AddEditFAQModal
        visible={addEditModalVisible}
        onCancel={() => setAddEditModalVisible(false)}
        onSave={handleSaveFAQ}
        initialValues={selectedFAQ}
      />
      <CategoryFAQModal
        visible={categoryModalVisible}
        onCancel={() => setCategoryModalVisible(false)}
        category={selectedCategory}
        onAddFAQ={handleAddFAQ}
        onEditFAQ={handleEditFAQ}
      />
    </div>
  );
};

export default SupportTicket;

