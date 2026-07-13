import { Button, Card, Form, Input, Modal, Select, Spin, Empty, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiClock, FiFolder, FiPlus, FiSearch, FiUser } from "react-icons/fi";
import { useMemo, useState } from "react";
import {
  useGetTicketsQuery,
  useUpdateTicketMutation,
  useGetActiveTopicsQuery,
  type ISupportTicket,
} from "../../redux/features/Support/supportApi";
import { debounce } from "../../utils/debounce";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

const statusStyles: Record<string, string> = {
  open: "bg-blue-500 text-white",
  in_progress: "bg-amber-500 text-white",
  resolved: "bg-emerald-500 text-white",
  closed: "bg-slate-500 text-white",
};

const statusLabel: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const SupportTicket = () => {
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [ticketForm] = Form.useForm();

  // Ticket state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [topicFilter, setTopicFilter] = useState<string | undefined>();

  // API queries
  const { data: ticketsData, isLoading: ticketsLoading } = useGetTicketsQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter,
    topicId: topicFilter,
  });

  const { data: activeTopics } = useGetActiveTopicsQuery();

  // Mutations
  const [updateTicket] = useUpdateTicketMutation();

  const tickets = ticketsData?.data || [];
  const meta = ticketsData?.meta;

  // Compute KPI stats from tickets data
  const kpiStats = useMemo(() => {
    const all = tickets;
    return [
      { label: "Open", value: all.filter((t) => t.status === "open").length, dot: "bg-blue-500" },
      { label: "In Progress", value: all.filter((t) => t.status === "in_progress").length, dot: "bg-amber-500" },
      { label: "Resolved", value: all.filter((t) => t.status === "resolved").length, dot: "bg-emerald-500" },
      { label: "Closed", value: all.filter((t) => t.status === "closed").length, dot: "bg-slate-500" },
    ];
  }, [tickets]);

  const handleSearch = debounce((value: string) => {
    setSearch(value);
    setPage(1);
  }, 400);

  const closeTicketModal = () => {
    setNewTicketOpen(false);
    ticketForm.resetFields();
  };

  const submitTicketForm = () => {
    closeTicketModal();
  };

  const handleUpdateTicketStatus = async (id: string, status: TicketStatus) => {
    try {
      await updateTicket({ id, data: { status } }).unwrap();
      message.success("Ticket status updated");
    } catch {
      message.error("Failed to update ticket status");
    }
  };

  const ticketColumns: ColumnsType<ISupportTicket> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 90,
      render: (value: string) => <span className="font-bold text-slate-700">#{value.slice(0, 6)}</span>,
    },
    {
      title: "CUSTOMER",
      key: "customer",
      width: 200,
      render: (_: any, record: ISupportTicket) => {
        const name = record.user
          ? `${record.user.firstName} ${record.user.lastName}`
          : "Unknown";
        return (
          <span className="inline-flex items-center gap-2 text-slate-700">
            <FiUser className="h-4 w-4 text-slate-400" />
            {name}
          </span>
        );
      },
    },
    {
      title: "SUBJECT",
      dataIndex: "subject",
      key: "subject",
      width: 200,
      render: (value: string) => <span className="text-slate-600 truncate block max-w-[200px]">{value}</span>,
    },
    {
      title: "TOPIC",
      key: "topic",
      width: 160,
      render: (_: any, record: ISupportTicket) => (
        <Tag className="rounded border-0 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
          {record.topic?.name || "—"}
        </Tag>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (value: string, record: ISupportTicket) => (
        <Select
          value={value}
          size="small"
          onChange={(newStatus) => handleUpdateTicketStatus(record.id, newStatus as TicketStatus)}
          className="w-[130px] [&_.ant-select-selector]:rounded-full! [&_.ant-select-selector]:border-0! [&_.ant-select-selector]:h-6!"
          popupClassName="rounded-lg"
          options={[
            { value: "open", label: "Open" },
            { value: "in_progress", label: "In Progress" },
            { value: "resolved", label: "Resolved" },
            { value: "closed", label: "Closed" },
          ]}
          optionRender={(option) => (
            <Tag className={`rounded-full! border-0 px-3 pb-0.5! text-[10px] font-bold ${statusStyles[option.value as string] || ""}`}>
              {option.label}
            </Tag>
          )}
          labelRender={(props) => (
            <Tag className={`rounded-full! border-0 px-3 pb-0.5! text-[10px] font-bold ${statusStyles[props.value as string] || ""}`}>
              {statusLabel[props.value as string] || props.label}
            </Tag>
          )}
        />
      ),
      align: "center",
    },
    {
      title: "LAST UPDATE",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 180,
      render: (value: string) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
          <FiClock className="h-3.5 w-3.5" />
          {value ? new Date(value).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" }) : "—"}
        </span>
      ),
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 100,
      render: (_: any, record: ISupportTicket) => (
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-emerald-500 hover:text-emerald-600 font-medium text-sm"
          onClick={() => handleUpdateTicketStatus(record.id, "resolved")}
        >
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiStats.map((item) => (
          <Card key={item.label} className="rounded-2xl border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] [&_.ant-card-body]:p-5">
            <p className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span className={`h-2 w-2 rounded-full ${item.dot}`} />
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-700">
              {ticketsLoading ? <Spin size="small" /> : item.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Search & Filter Bar Section */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <Input
              className="h-11 rounded-xl border-slate-100 bg-slate-50/30 text-[15px]"
              prefix={<FiSearch className="mr-2 text-slate-300 h-5 w-5" />}
              placeholder="Search tickets by ID, customer, subject..."
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Select
            allowClear
            placeholder="Status"
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            className="w-40 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl"
          >
            <Select.Option value="open">Open</Select.Option>
            <Select.Option value="in_progress">In Progress</Select.Option>
            <Select.Option value="resolved">Resolved</Select.Option>
            <Select.Option value="closed">Closed</Select.Option>
          </Select>
          <Select
            allowClear
            placeholder="Topic"
            onChange={(v) => { setTopicFilter(v); setPage(1); }}
            className="w-48 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl"
            options={
              activeTopics?.map((t) => ({ value: t.id, label: t.name })) || []
            }
          />
        </div>
      </div>

      {/* Tickets Table Section */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
        {ticketsLoading ? (
          <div className="flex items-center justify-center py-24">
            <Spin size="large" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-24">
            <Empty description="No tickets found" />
          </div>
        ) : (
          <Table<ISupportTicket>
            rowKey="id"
            columns={ticketColumns}
            dataSource={tickets}
            scroll={{ x: 1000 }}
            pagination={{
              current: page,
              pageSize: meta?.limit || 20,
              total: meta?.total || 0,
              onChange: setPage,
              showSizeChanger: false,
              className: "p-4 mt-0 border-t border-slate-100",
            }}
            className="[&_.ant-table-thead_th]:bg-slate-50/50 [&_.ant-table-thead_th]:text-[11px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:text-slate-400 [&_.ant-table-thead_th]:tracking-widest [&_.ant-table-cell]:px-5 [&_.ant-table-cell]:py-5"
          />
        )}
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
            name="topicId"
            label="Topic"
            rules={[{ required: true, message: "Please select a topic" }]}
          >
            <Select
              className="[&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-lg [&_.ant-select-selector]:border-slate-300 [&_.ant-select-selection-item]:leading-[42px] [&_.ant-select-selection-placeholder]:leading-[42px]"
              placeholder="Select topic"
              options={
                activeTopics?.map((t) => ({ value: t.id, label: t.name })) || []
              }
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
    </div>
  );
};

export default SupportTicket;
