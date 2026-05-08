import { Button, Form, Input, Modal, Select, Card, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiClock, FiFolder, FiPlus, FiSearch, FiUser } from "react-icons/fi";
import { useState } from "react";

type Priority = "Low" | "Medium" | "High" | "Urgent";
type TicketStatus = "Open" | "In Progress" | "Resolved";

type SupportTicketRow = {
  key: string;
  id: string;
  customer: string;
  subject: string;
  category: string;
  priority: Priority;
  status: TicketStatus;
  operator: string;
  lastUpdate: string;
};

const ticketRows: SupportTicketRow[] = [
  {
    key: "1",
    id: "#T001",
    customer: "Mario Rossi",
    subject: "Bill Not Received",
    category: "Bill Problem",
    priority: "Medium",
    status: "Open",
    operator: "Giuseppe Verdi",
    lastUpdate: "2026-04-14 10:30",
  },
  {
    key: "2",
    id: "#T002",
    customer: "Giulia Bianchi",
    subject: "Contract Cancellation Request",
    category: "Complaint",
    priority: "High",
    status: "In Progress",
    operator: "Maria Ferrari",
    lastUpdate: "2026-04-14 09:15",
  },
  {
    key: "3",
    id: "#T003",
    customer: "Luca Ferrari",
    subject: "Information on New Offers",
    category: "Info Request",
    priority: "Low",
    status: "Resolved",
    operator: "Giuseppe Verdi",
    lastUpdate: "2026-04-13 16:30",
  },
  {
    key: "4",
    id: "#T004",
    customer: "Anna Verde",
    subject: "Service Interruption",
    category: "Technical Issue",
    priority: "Urgent",
    status: "In Progress",
    operator: "Maria Ferrari",
    lastUpdate: "2026-04-15 08:45",
  },
];

const priorityStyles: Record<Priority, string> = {
  Low: "bg-emerald-500 text-white",
  Medium: "bg-blue-500 text-white",
  High: "bg-amber-500 text-white",
  Urgent: "bg-rose-500 text-white",
};

const statusStyles: Record<TicketStatus, string> = {
  Open: "bg-blue-500 text-white",
  "In Progress": "bg-amber-500 text-white",
  Resolved: "bg-emerald-500 text-white",
};

const SupportTicket = () => {
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [ticketForm] = Form.useForm();

  const closeTicketModal = () => {
    setNewTicketOpen(false);
    ticketForm.resetFields();
  };

  const submitTicketForm = () => {
    closeTicketModal();
  };

  const columns: ColumnsType<SupportTicketRow> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 90,
      render: (value: string) => <span className="font-semibold text-slate-700">{value}</span>,
    },
    {
      title: "CUSTOMER",
      dataIndex: "customer",
      key: "customer",
      width: 150,
      render: (value: string) => (
        <span className="inline-flex items-center gap-2 text-slate-700">
          <FiUser className="h-3.5 w-3.5 text-slate-400" />
          {value}
        </span>
      ),
    },
    { title: "SUBJECT", dataIndex: "subject", key: "subject", width: 230 },
    {
      title: "CATEGORY",
      dataIndex: "category",
      key: "category",
      width: 140,
      render: (value: string) => <Tag className="rounded border-0 bg-slate-100 text-xs text-slate-600">{value}</Tag>,
    },
    {
      title: "PRIORITY",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (value: Priority) => <Tag className={`rounded-full border-0 px-2.5 py-0 text-[10px] font-semibold ${priorityStyles[value]}`}>{value}</Tag>,
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (value: TicketStatus) => <Tag className={`rounded-full! border-0 px-2.5 pb-0.5! text-[10px] font-semibold ${statusStyles[value]}`}>{value}</Tag>,
      align: "center",
    },
    { title: "OPERATOR", dataIndex: "operator", key: "operator", width: 150 },
    {
      title: "LAST UPDATE",
      dataIndex: "lastUpdate",
      key: "lastUpdate",
      width: 150,
      render: (value: string) => (
        <span className="inline-flex items-center gap-1.5 text-slate-500">
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
        <button type="button" className="inline-flex items-center gap-1 text-emerald-500 hover:text-emerald-600">
          <FiFolder className="h-3.5 w-3.5" />
          Open
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      <div className="mb-4 flex flex-col gap-3 border-b border-cborder/45 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-brand">Support Ticket</h2>
          <p className="text-sm text-owngray">Managing Support Requests</p>
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: "Open", value: "12", dot: "bg-blue-500" },
          { label: "In Progress", value: "8", dot: "bg-amber-500" },
          { label: "Awaiting Customer", value: "5", dot: "bg-violet-500" },
          { label: "Resolved", value: "34", dot: "bg-emerald-500" },
          { label: "Closed", value: "156", dot: "bg-slate-500" },
        ].map((item) => (
          <Card key={item.label} className="rounded-2xl border-slate-200/70 shadow-sm [&_.ant-card-body]:p-4">
            <p className="inline-flex items-center gap-2 text-sm text-slate-500">
              <span className={`h-2 w-2 rounded-full ${item.dot}`} />
              {item.label}
            </p>
            <p className="mt-1 text-4xl font-semibold leading-none text-slate-700">{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
        <Input
          className="h-11 rounded-xl border-slate-200 text-base"
          prefix={<FiSearch className="mr-2 text-slate-400" />}
          placeholder="Search tickets by ID, customer, subject..."
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <Table<SupportTicketRow>
          rowKey="key"
          columns={columns}
          dataSource={ticketRows}
          pagination={false}
          scroll={{ x: 1220 }}
          className="[&_.ant-table-thead_th]:bg-slate-50 [&_.ant-table-thead_th]:text-[11px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:tracking-widest [&_.ant-table-thead_th]:text-slate-500 [&_.ant-table-cell]:py-4"
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
            className="h-11 w-full rounded-xl border-0 bg-[#6C63FF] text-base font-semibold hover:bg-[#5f57f0]"
          >
            Save Ticket
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default SupportTicket;
