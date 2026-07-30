import { useRef, useEffect, useState } from "react";
import { Button, Input, Spin, Empty, Tag, Select, message, Modal } from "antd";
import {
  FiArrowLeft,
  FiSend,
  FiMail,
  FiPhone,
  FiClock,
  FiPaperclip,
  FiX,
} from "react-icons/fi";
import { LuDownload, LuMessageCircle } from "react-icons/lu";
import { useNavigate, useParams } from "react-router";
import {
  useGetTicketByIdQuery,
  useUpdateTicketMutation,
  useAddTicketMessageMutation,
} from "../../redux/features/Support/supportApi";
import { server_origin } from "../../config";

/* ── Config ────────────────────────────────────────────────── */

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

const priorityStyles: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const priorityLabel: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const validTransitions: Record<string, string[]> = {
  open: ["in_progress", "closed"],
  in_progress: ["resolved", "closed"],
  resolved: ["closed"],
  closed: [],
};

/* ── Helpers ───────────────────────────────────────────────── */

const getFileUrl = (url: string) =>
  url.startsWith("http") ? url : `${server_origin}/${url.replace(/^\//, "")}`;

const getInitials = (firstName?: string, lastName?: string) =>
  `${(firstName || "?")[0]}${(lastName || "")[0] || ""}`.toUpperCase();

const getFileName = (url: string) => {
  try {
    const pathname = new URL(url, "https://placeholder.com").pathname;
    return decodeURIComponent(pathname.split("/").pop() || "attachment");
  } catch {
    return url.split("/").pop() || "attachment";
  }
};

const isImageUrl = (url: string) =>
  /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDateTime = (dateStr: string) => `${formatDate(dateStr)} ${formatTime(dateStr)}`;

/* ── Main Component ────────────────────────────────────────── */

const TicketDetailsView = () => {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const { data: ticket, isLoading } = useGetTicketByIdQuery(ticketId!, {
    skip: !ticketId,
  });
  const [updateTicket, { isLoading: isUpdating }] = useUpdateTicketMutation();
  const [addMessage, { isLoading: isSending }] = useAddTicketMessageMutation();

  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = [...(ticket?.messages || [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  /* ── Handlers ──────────────────────────────────────────── */

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    try {
      await updateTicket({ id: ticket.id, data: { status: newStatus } }).unwrap();
      message.success(`Status updated to ${statusLabel[newStatus]}`);
    } catch {
      message.error("Failed to update status");
    }
  };

  const handleCloseTicket = () => {
    Modal.confirm({
      title: "Close Ticket",
      content:
        "Are you sure you want to close this ticket? No further replies can be sent after closing.",
      okText: "Close Ticket",
      okButtonProps: { danger: true },
      onOk: () => handleStatusChange("closed"),
    });
  };

  const handleReply = async () => {
    if (!ticket || !replyText.trim()) return;
    try {
      await addMessage({
        ticketId: ticket.id,
        message: replyText.trim(),
      }).unwrap();
      setReplyText("");
      message.success("Reply sent");
    } catch {
      message.error("Failed to send reply");
    }
  };

  /* ── Loading / Not Found ───────────────────────────────── */

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spin size="large" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Empty description="Ticket not found" />
        <Button onClick={() => navigate("/support-ticket")} icon={<FiArrowLeft />}>
          Back to Tickets
        </Button>
      </div>
    );
  }

  /* ── Derived data ──────────────────────────────────────── */

  const isClosed = ticket.status === "closed";
  const customerName = ticket.user
    ? `${ticket.user.firstName} ${ticket.user.lastName}`
    : "Unknown";
  const transitions = validTransitions[ticket.status] || [];

  /* ── Render ────────────────────────────────────────────── */

  return (
    <div className="space-y-5 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate("/support-ticket")}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back to Tickets
      </button>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="bg-slate-50/60 px-6 pt-6 pb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Tag className="m-0! rounded-md! border-0! bg-slate-800! px-2.5! py-0.5! text-xs! font-semibold! text-white!">
              #{ticket.id.slice(0, 8)}
            </Tag>
            <Tag
              className={`m-0! rounded-md! border-0! px-2.5! py-0.5! text-xs! font-semibold! ${statusStyles[ticket.status]}`}
            >
              {statusLabel[ticket.status] || ticket.status}
            </Tag>
            <Tag
              className={`m-0! rounded-md! border-0! px-2.5! py-0.5! text-xs! font-semibold! ${priorityStyles[ticket.priority]}`}
            >
              {priorityLabel[ticket.priority] || ticket.priority} Priority
            </Tag>
            {ticket.assignedAgent && (
              <Tag className="m-0! rounded-md! border-0! bg-purple-50! px-2.5! py-0.5! text-xs! font-semibold! text-purple-600!">
                Assigned to {ticket.assignedAgent.firstName} {ticket.assignedAgent.lastName}
              </Tag>
            )}
          </div>

          <h2 className="text-xl font-bold text-slate-800">{ticket.subject}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {ticket.topic?.name || "General"} &middot; Opened{" "}
            {formatDateTime(ticket.createdAt)}
          </p>

          {/* Actions */}
          {!isClosed && (
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {transitions.filter((s) => s !== "closed").length > 0 && (
                <Select
                  placeholder="Change Status"
                  onChange={handleStatusChange}
                  loading={isUpdating}
                  className="w-48 [&_.ant-select-selector]:h-10! [&_.ant-select-selector]:rounded-lg!"
                  options={transitions
                    .filter((s) => s !== "closed")
                    .map((s) => ({ value: s, label: statusLabel[s] }))}
                />
              )}
              <Button
                danger
                icon={<FiX className="h-3.5 w-3.5" />}
                onClick={handleCloseTicket}
                loading={isUpdating}
                className="h-10 rounded-lg font-semibold"
              >
                Close Ticket
              </Button>
            </div>
          )}

          {isClosed && (
            <div className="mt-4 rounded-lg bg-slate-100 px-4 py-2.5 text-sm text-slate-500 inline-flex items-center gap-2">
              <FiClock className="h-4 w-4" />
              Closed on{" "}
              {ticket.closedAt ? formatDateTime(ticket.closedAt) : "unknown date"}
            </div>
          )}
        </div>

        {/* ── Info Section ───────────────────────────────── */}
        <div className="px-6 py-6 border-b border-slate-100">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Customer Info */}
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-4">
                Customer Information
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7061ED]/10 text-[#7061ED] text-sm font-bold">
                    {getInitials(ticket.user?.firstName, ticket.user?.lastName)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{customerName}</p>
                    <p className="text-xs text-slate-400">Customer</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FiMail className="h-4 w-4 text-slate-400 shrink-0" />
                  {ticket.user?.email || "—"}
                </div>
                {ticket.user?.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <FiPhone className="h-4 w-4 text-slate-400 shrink-0" />
                    {ticket.user.phone}
                  </div>
                )}
              </div>
            </div>

            {/* Ticket Details */}
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-4">Ticket Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400">Topic</span>
                  <p className="text-sm font-medium text-slate-700">
                    {ticket.topic?.name || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Priority</span>
                  <p className="text-sm font-medium text-slate-700 capitalize">
                    {ticket.priority}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Assigned Agent</span>
                  <p className="text-sm font-medium text-slate-700">
                    {ticket.assignedAgent
                      ? `${ticket.assignedAgent.firstName} ${ticket.assignedAgent.lastName}`
                      : "Unassigned"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Last Updated</span>
                  <p className="text-sm font-medium text-slate-700">
                    {formatDateTime(ticket.updatedAt)}
                  </p>
                </div>
                {ticket.resolvedAt && (
                  <div>
                    <span className="text-xs text-slate-400">Resolved At</span>
                    <p className="text-sm font-medium text-slate-700">
                      {formatDateTime(ticket.resolvedAt)}
                    </p>
                  </div>
                )}
                {ticket.closedAt && (
                  <div>
                    <span className="text-xs text-slate-400">Closed At</span>
                    <p className="text-sm font-medium text-slate-700">
                      {formatDateTime(ticket.closedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Conversation ───────────────────────────────── */}
        <div className="px-6 py-6">
          <div className="flex items-center gap-2 mb-4">
            <LuMessageCircle className="h-4 w-4 text-slate-600" />
            <h4 className="text-sm font-semibold text-slate-800">Conversation</h4>
            {messages.length > 0 && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#7061ED] px-1.5 text-[10px] font-bold text-white">
                {messages.length}
              </span>
            )}
          </div>

          {messages.length === 0 ? (
            <div className="py-12">
              <Empty description="No messages yet" />
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {messages.map((msg) => {
                const isCustomer = msg.senderId === ticket.userId;
                const senderName = msg.sender
                  ? `${msg.sender.firstName} ${msg.sender.lastName}`
                  : "Unknown";

                return (
                  <div
                    key={msg.id}
                    className={`rounded-xl p-4 ${
                      isCustomer
                        ? "bg-slate-50 border border-slate-100"
                        : "bg-[#7061ED]/5 border border-[#7061ED]/10"
                    }`}
                  >
                    {/* Sender row */}
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                          isCustomer ? "bg-slate-400" : "bg-[#7061ED]"
                        }`}
                      >
                        {getInitials(msg.sender?.firstName, msg.sender?.lastName)}
                      </div>
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700">
                          {senderName}
                        </span>
                        <Tag
                          className={`m-0! rounded-full! border-0! px-2! py-0! text-[10px]! font-bold! ${
                            isCustomer
                              ? "bg-slate-200! text-slate-600!"
                              : "bg-[#7061ED]/15! text-[#7061ED]!"
                          }`}
                        >
                          {isCustomer ? "Customer" : "Admin"}
                        </Tag>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {formatDateTime(msg.createdAt)}
                      </span>
                    </div>

                    {/* Message body */}
                    <p className="text-sm text-slate-600 whitespace-pre-wrap ml-11">
                      {msg.message}
                    </p>

                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-3 ml-11 space-y-2">
                        {msg.attachments.map((url, idx) => (
                          <a
                            key={idx}
                            href={getFileUrl(url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                          >
                            {isImageUrl(url) ? (
                              <img
                                src={getFileUrl(url)}
                                alt="attachment"
                                className="h-12 w-12 rounded object-cover"
                              />
                            ) : (
                              <FiPaperclip className="h-4 w-4 text-slate-400 shrink-0" />
                            )}
                            <span className="flex-1 truncate">{getFileName(url)}</span>
                            <LuDownload className="h-4 w-4 text-slate-400 shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Reply Section ──────────────────────────────── */}
        {!isClosed ? (
          <div className="px-6 pb-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <Input.TextArea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                className="resize-none rounded-lg! border-slate-200! bg-white! mb-3"
                onPressEnter={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    handleReply();
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Press Ctrl+Enter to send</span>
                <Button
                  type="primary"
                  icon={<FiSend className="h-3.5 w-3.5" />}
                  onClick={handleReply}
                  loading={isSending}
                  disabled={!replyText.trim()}
                  className="h-10 rounded-lg bg-[#7061ED]! hover:bg-[#5f52d4]! border-0! font-semibold px-6"
                >
                  Send Reply
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 pb-6">
            <div className="rounded-xl bg-slate-100 p-4 text-center text-sm text-slate-500">
              This ticket is closed. No further replies can be sent.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetailsView;
