import { getLocale } from "../../utils/format";
import { Button, Card, Form, Input, Modal, Select, Spin, Empty, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiClock, FiEye, FiPlus, FiSearch, FiUser } from "react-icons/fi";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  useGetTicketsQuery,
  useUpdateTicketMutation,
  useGetActiveTopicsQuery,
  type ISupportTicket,
} from "../../redux/features/Support/supportApi";
import { debounce } from "../../utils/debounce";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

const statusStyles: Record<string, string> = {
  open: "bg-blue-500! text-white!",
  in_progress: "bg-amber-500! text-white!",
  resolved: "bg-emerald-500! text-white!",
  closed: "bg-slate-500! text-white!",
};

const priorityStyles: Record<string, string> = {
  low: "bg-green-100! text-green-700!",
  medium: "bg-blue-100! text-blue-700!",
  high: "bg-orange-100! text-orange-700!",
  urgent: "bg-red-100! text-red-700!",
};

const SupportTicket = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [ticketForm] = Form.useForm();

  // Ticket state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [topicFilter, setTopicFilter] = useState<string | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();

  // API queries
  const { data: ticketsData, isLoading: ticketsLoading } = useGetTicketsQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter,
    topicId: topicFilter,
    priority: priorityFilter,
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
      { label: t("support_ticket.open"), value: all.filter((t) => t.status === "open").length, dot: "bg-blue-500" },
      { label: t("support_ticket.in_progress"), value: all.filter((t) => t.status === "in_progress").length, dot: "bg-amber-500" },
      { label: t("support_ticket.resolved"), value: all.filter((t) => t.status === "resolved").length, dot: "bg-emerald-500" },
      { label: t("support_ticket.closed"), value: all.filter((t) => t.status === "closed").length, dot: "bg-slate-500" },
    ];
  }, [tickets, t]);

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
      message.success(t("support_ticket.status_updated"));
    } catch {
      message.error(t("support_ticket.status_update_failed"));
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
      title: t("support_ticket.customer"),
      key: "customer",
      width: 200,
      render: (_: any, record: ISupportTicket) => {
        const name = record.user
          ? `${record.user.firstName} ${record.user.lastName}`
          : t("common.unknown");
        return (
          <span className="inline-flex items-center gap-2 text-slate-700">
            <FiUser className="h-4 w-4 text-slate-400" />
            {name}
          </span>
        );
      },
    },
    {
      title: t("support_ticket.subject"),
      dataIndex: "subject",
      key: "subject",
      width: 200,
      render: (value: string) => <span className="text-slate-600 truncate block max-w-[200px]">{value}</span>,
    },
    {
      title: t("support_ticket.topic").toUpperCase(),
      key: "topic",
      width: 160,
      render: (_: any, record: ISupportTicket) => (
        <Tag className="rounded border-0 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
          {record.topic?.name || "—"}
        </Tag>
      ),
    },
    {
      title: t("support_ticket.priority").toUpperCase(),
      dataIndex: "priority",
      key: "priority",
      width: 110,
      render: (value: string) => (
        <Tag className={`m-0! rounded-full! border-0! px-2.5! py-0.5! text-[10px]! font-bold! ${priorityStyles[value] || ""}`}>
          {t(`support_ticket.${value}`) === `support_ticket.${value}` ? value : t(`support_ticket.${value}`)}
        </Tag>
      ),
      align: "center",
    },
    {
      title: t("common.status").toUpperCase(),
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (value: string, record: ISupportTicket) => (
        <div onClick={(e) => e.stopPropagation()}>
        <Select
          value={value}
          size="small"
          onChange={(newStatus) => handleUpdateTicketStatus(record.id, newStatus as TicketStatus)}
          className="w-[130px] [&_.ant-select-selector]:rounded-full! [&_.ant-select-selector]:border-0! [&_.ant-select-selector]:h-6!"
          popupClassName="rounded-lg"
          options={[
            { value: "open", label: t("support_ticket.open") },
            { value: "in_progress", label: t("support_ticket.in_progress") },
            { value: "resolved", label: t("support_ticket.resolved") },
            { value: "closed", label: t("support_ticket.closed") },
          ]}
          optionRender={(option) => (
            <Tag className={`rounded-full! border-0 px-3 pb-0.5! text-[10px] font-bold ${statusStyles[option.value as string] || ""}`}>
              {option.label}
            </Tag>
          )}
          labelRender={(props) => (
            <Tag className={`rounded-full! border-0 px-3 pb-0.5! text-[10px] font-bold ${statusStyles[props.value as string] || ""}`}>
              {t(`support_ticket.${props.value as string}`) === `support_ticket.${props.value as string}` ? props.label : t(`support_ticket.${props.value as string}`)}
            </Tag>
          )}
        />
        </div>
      ),
      align: "center",
    },
    {
      title: t("support_ticket.last_update"),
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 180,
      render: (value: string) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
          <FiClock className="h-3.5 w-3.5" />
          {value ? new Date(value).toLocaleString(getLocale(), { dateStyle: "short", timeStyle: "short" }) : "—"}
        </span>
      ),
    },
    {
      title: t("common.actions").toUpperCase(),
      key: "actions",
      width: 100,
      render: (_: any, record: ISupportTicket) => (
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-emerald-500 hover:text-emerald-600 font-medium text-sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/support-ticket/${record.id}`);
          }}
        >
          <FiEye className="h-4 w-4" />
          {t("support_ticket.view")}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div className="mb-4 flex flex-col gap-3 border-b border-cborder/45 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{t("support_ticket.title")}</h2>
          <p className="text-sm text-slate-400 font-medium">{t("support_ticket.description")}</p>
        </div>
        <Button
          type="primary"
          icon={<FiPlus />}
          className="h-10 rounded-lg border-0 bg-[#8b85f6] px-5 font-semibold hover:bg-[#7a74e5]"
          onClick={() => setNewTicketOpen(true)}
        >
          {t("support_ticket.new_ticket")}
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
              placeholder={t("support_ticket.search")}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Select
            allowClear
            placeholder={t("common.status")}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            className="w-40 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl"
          >
            <Select.Option value="open">{t("support_ticket.open")}</Select.Option>
            <Select.Option value="in_progress">{t("support_ticket.in_progress")}</Select.Option>
            <Select.Option value="resolved">{t("support_ticket.resolved")}</Select.Option>
            <Select.Option value="closed">{t("support_ticket.closed")}</Select.Option>
          </Select>
          <Select
            allowClear
            placeholder={t("support_ticket.priority")}
            onChange={(v) => { setPriorityFilter(v); setPage(1); }}
            className="w-40 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl"
          >
            <Select.Option value="low">{t("support_ticket.low")}</Select.Option>
            <Select.Option value="medium">{t("support_ticket.medium")}</Select.Option>
            <Select.Option value="high">{t("support_ticket.high")}</Select.Option>
            <Select.Option value="urgent">{t("support_ticket.urgent")}</Select.Option>
          </Select>
          <Select
            allowClear
            placeholder={t("support_ticket.topic")}
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
            <Empty description={t("support_ticket.no_tickets")} />
          </div>
        ) : (
          <Table<ISupportTicket>
            rowKey="id"
            columns={ticketColumns}
            dataSource={tickets}
            onRow={(record) => ({
              onClick: () => navigate(`/support-ticket/${record.id}`),
              className: "cursor-pointer",
            })}
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
        <h3 className="mb-4 text-2xl font-semibold text-slate-800">{t("support_ticket.add_new_ticket")}</h3>

        <Form form={ticketForm} layout="vertical" onFinish={submitTicketForm}>
          <Form.Item
            name="subject"
            label={t("support_ticket.subject")}
            rules={[{ required: true, message: t("support_ticket.subject_required") }]}
          >
            <Input className="h-11 rounded-lg border-slate-300" placeholder={t("support_ticket.subject_example")} />
          </Form.Item>

          <Form.Item
            name="topicId"
            label={t("support_ticket.topic")}
            rules={[{ required: true, message: t("support_ticket.topic_required") }]}
          >
            <Select
              className="[&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-lg [&_.ant-select-selector]:border-slate-300 [&_.ant-select-selection-item]:leading-[42px] [&_.ant-select-selection-placeholder]:leading-[42px]"
              placeholder={t("support_ticket.select_topic")}
              options={
                activeTopics?.map((t) => ({ value: t.id, label: t.name })) || []
              }
            />
          </Form.Item>

          <Form.Item
            name="messageDetails"
            label={t("support_ticket.message_details")}
            rules={[{ required: true, message: t("support_ticket.details_required")}]}
          >
            <Input.TextArea rows={4} className="rounded-lg border-slate-300" placeholder={t("support_ticket.details_placeholder")} />
          </Form.Item>

          <Button
            htmlType="submit"
            type="primary"
            className="h-11 w-full rounded-xl border-0 bg-[#8b85f6] text-base font-semibold hover:bg-[#7a74e5]"
          >
            {t("support_ticket.save_ticket")}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default SupportTicket;
