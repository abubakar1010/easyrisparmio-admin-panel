import { useRef, useEffect, useState } from "react";
import { Button, Input, Spin, Empty, Tag, Select, message } from "antd";
import {
  FiArrowLeft,
  FiSend,
  FiMail,
  FiPhone,
  FiClock,
  FiPaperclip,
} from "react-icons/fi";
import { formatPhone } from "../../utils/formatPhone";
import { LuDownload, LuMessageCircle } from "react-icons/lu";
import { useNavigate, useParams } from "react-router";
import {
  useGetTicketByIdQuery,
  useUpdateTicketMutation,
  useAddTicketMessageMutation,
} from "../../redux/features/Support/supportApi";
import { server_origin } from "../../config";

/* ── Config ────────────────────────────────────────────────── */

const statusDot: Record<string, string> = {
  open: "bg-blue-500",
  in_progress: "bg-amber-500",
  resolved: "bg-emerald-500",
  closed: "bg-slate-500",
};

const priorityDot: Record<string, string> = {
  low: "bg-green-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

const statusLabel: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const priorityStyles: Record<string, string> = {
  low: "bg-green-100! text-green-700!",
  medium: "bg-blue-100! text-blue-700!",
  high: "bg-orange-100! text-orange-700!",
  urgent: "bg-red-100! text-red-700!",
};

const priorityLabel: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const allStatuses = ["open", "in_progress", "resolved", "closed"];

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

const cardClass = "bg-white rounded-2xl border border-slate-200/60 shadow-sm";

/* ── Attachment Renderer ───────────────────────────────────── */

function Attachments({ urls, variant }: { urls: string[]; variant: "light" | "dark" }) {
  return (
    <div className="mt-2 space-y-1.5">
      {urls.map((url, idx) => (
        <a
          key={idx}
          href={getFileUrl(url)}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors ${
            variant === "dark"
              ? "bg-white/15 text-white/90 hover:bg-white/25"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isImageUrl(url) ? (
            <img src={getFileUrl(url)} alt="" className="h-10 w-10 rounded object-cover" />
          ) : (
            <FiPaperclip className="h-3.5 w-3.5 shrink-0 opacity-60" />
          )}
          <span className="flex-1 truncate">{getFileName(url)}</span>
          <LuDownload className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </a>
      ))}
    </div>
  );
}

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

  const handlePriorityChange = async (newPriority: string) => {
    if (!ticket) return;
    try {
      await updateTicket({ id: ticket.id, data: { priority: newPriority } }).unwrap();
      message.success(`Priority updated to ${priorityLabel[newPriority]}`);
    } catch {
      message.error("Failed to update priority");
    }
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

  const firstMessage =
    messages.length > 0 && messages[0].senderId === ticket.userId ? messages[0] : null;

  /* ── Render ────────────────────────────────────────────── */

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate("/support-ticket")}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back to Tickets
      </button>

      {/* ── Two-column grid ──────────────────────────────── */}
      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* ── LEFT COLUMN: Ticket Info ───────────────────── */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1 — Header + Actions */}
          <div className={`${cardClass} overflow-hidden`}>
            <div className="bg-slate-50/60 p-5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Tag className="m-0! rounded-md! border-0! bg-slate-800! px-2.5! py-0.5! text-xs! font-semibold! text-white!">
                  #{ticket.id.slice(0, 8)}
                </Tag>
                {ticket.assignedAgent && (
                  <Tag className="m-0! rounded-md! border-0! bg-purple-50! px-2.5! py-0.5! text-xs! font-semibold! text-purple-600!">
                    Assigned to {ticket.assignedAgent.firstName} {ticket.assignedAgent.lastName}
                  </Tag>
                )}
              </div>

              <h2 className="text-lg font-bold text-slate-800 leading-snug">
                {ticket.subject}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {ticket.topic?.name || "General"} &middot; {formatDateTime(ticket.createdAt)}
              </p>

              {/* Status & Priority controls */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Status
                  </span>
                  <Select
                    value={ticket.status}
                    onChange={handleStatusChange}
                    loading={isUpdating}
                    className="w-full [&_.ant-select-selector]:h-9! [&_.ant-select-selector]:rounded-lg! [&_.ant-select-selector]:border-slate-200! [&_.ant-select-selector]:bg-white!"
                    popupClassName="rounded-lg"
                    options={allStatuses.map((s) => ({
                      value: s,
                      label: statusLabel[s],
                    }))}
                    optionRender={(option) => (
                      <span className="flex items-center gap-2 text-sm text-slate-700">
                        <span className={`h-2 w-2 rounded-full ${statusDot[option.value as string] || ""}`} />
                        {option.label}
                      </span>
                    )}
                    labelRender={(props) => (
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <span className={`h-2 w-2 rounded-full ${statusDot[props.value as string] || ""}`} />
                        {statusLabel[props.value as string] || props.label}
                      </span>
                    )}
                  />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Priority
                  </span>
                  <Select
                    value={ticket.priority}
                    onChange={handlePriorityChange}
                    loading={isUpdating}
                    className="w-full [&_.ant-select-selector]:h-9! [&_.ant-select-selector]:rounded-lg! [&_.ant-select-selector]:border-slate-200! [&_.ant-select-selector]:bg-white!"
                    popupClassName="rounded-lg"
                    options={[
                      { value: "low", label: "Low" },
                      { value: "medium", label: "Medium" },
                      { value: "high", label: "High" },
                      { value: "urgent", label: "Urgent" },
                    ]}
                    optionRender={(option) => (
                      <span className="flex items-center gap-2 text-sm text-slate-700">
                        <span className={`h-2 w-2 rounded-full ${priorityDot[option.value as string] || ""}`} />
                        {option.label}
                      </span>
                    )}
                    labelRender={(props) => (
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <span className={`h-2 w-2 rounded-full ${priorityDot[props.value as string] || ""}`} />
                        {priorityLabel[props.value as string] || props.label}
                      </span>
                    )}
                  />
                </div>
              </div>

              {isClosed && (
                <div className="mt-4 rounded-lg bg-slate-100 px-4 py-2.5 text-xs text-slate-500 flex items-center justify-center gap-1.5">
                  <FiClock className="h-3.5 w-3.5" />
                  Closed {ticket.closedAt ? formatDateTime(ticket.closedAt) : ""}
                </div>
              )}
            </div>
          </div>

          {/* Card 2 — Customer Info */}
          <div className={`${cardClass} p-5`}>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Customer
            </h4>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7061ED]/10 text-[#7061ED] text-sm font-bold">
                {getInitials(ticket.user?.firstName, ticket.user?.lastName)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{customerName}</p>
                <p className="text-xs text-slate-400">Customer</p>
              </div>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <FiMail className="h-4 w-4 text-slate-400 shrink-0" />
                {ticket.user?.email || "—"}
              </div>
              {ticket.user?.phone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <FiPhone className="h-4 w-4 text-slate-400 shrink-0" />
                  {formatPhone(ticket.user.phone)}
                </div>
              )}
            </div>
          </div>

          {/* Card 3 — Ticket Details */}
          <div className={`${cardClass} p-5`}>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Ticket Details
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <div className="col-span-2">
                <span className="text-xs text-slate-400">Subject</span>
                <p className="text-sm font-medium text-slate-700">{ticket.subject}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Topic</span>
                <p className="text-sm font-medium text-slate-700">{ticket.topic?.name || "—"}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Priority</span>
                <p className="mt-0.5">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${priorityStyles[ticket.priority] || ""}`}>
                    {priorityLabel[ticket.priority] || ticket.priority}
                  </span>
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

          {/* Card 4 — Original Message */}
          {firstMessage && (
            <div className={`${cardClass} p-5`}>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Original Message
              </h4>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {firstMessage.message}
                </p>
                {firstMessage.attachments && firstMessage.attachments.length > 0 && (
                  <Attachments urls={firstMessage.attachments} variant="light" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: Chat Panel ──────────────────── */}
        <div className="lg:col-span-7">
          <div
            className={`${cardClass} flex flex-col overflow-hidden max-h-[600px] lg:max-h-none lg:h-[calc(100vh-160px)] lg:sticky lg:top-5`}
          >
            {/* Chat header */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/40">
              <LuMessageCircle className="h-4 w-4 text-slate-500" />
              <h4 className="text-sm font-semibold text-slate-700">Conversation</h4>
              {messages.length > 0 && (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#7061ED] px-1.5 text-[10px] font-bold text-white">
                  {messages.length}
                </span>
              )}
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50/20">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <Empty description="No messages yet" />
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    const isCustomer = msg.senderId === ticket.userId;
                    const senderName = msg.sender
                      ? `${msg.sender.firstName} ${msg.sender.lastName}`
                      : "Unknown";

                    if (isCustomer) {
                      /* ── Customer bubble (left) ───── */
                      return (
                        <div key={msg.id} className="flex gap-2.5 max-w-[85%]">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-400 text-xs font-bold text-white mt-5">
                            {getInitials(msg.sender?.firstName, msg.sender?.lastName)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-slate-600">
                                {senderName}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {formatDateTime(msg.createdAt)}
                              </span>
                            </div>
                            <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5">
                              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {msg.message}
                              </p>
                            </div>
                            {msg.attachments && msg.attachments.length > 0 && (
                              <Attachments urls={msg.attachments} variant="light" />
                            )}
                          </div>
                        </div>
                      );
                    }

                    /* ── Admin bubble (right) ─────── */
                    return (
                      <div key={msg.id} className="flex gap-2.5 max-w-[85%] ml-auto flex-row-reverse">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7061ED] text-xs font-bold text-white mt-5">
                          {getInitials(msg.sender?.firstName, msg.sender?.lastName)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 justify-end">
                            <span className="text-[10px] text-slate-400">
                              {formatDateTime(msg.createdAt)}
                            </span>
                            <span className="text-xs font-semibold text-[#7061ED]">
                              {senderName}
                            </span>
                          </div>
                          <div className="rounded-2xl rounded-tr-sm bg-[#7061ED] px-4 py-2.5">
                            <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">
                              {msg.message}
                            </p>
                          </div>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <Attachments urls={msg.attachments} variant="dark" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Reply bar */}
            <div className="border-t border-slate-100 px-5 py-3.5 bg-white">
              {!isClosed ? (
                <div className="flex items-end gap-3">
                  <Input.TextArea
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 rounded-2xl! border-slate-200! resize-none"
                    onPressEnter={(e) => {
                      if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleReply();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleReply}
                    disabled={!replyText.trim() || isSending}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7061ED] text-white hover:bg-[#5f52d4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSending ? (
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FiSend className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-center text-sm text-slate-400 py-1">
                  This ticket is closed. No further replies can be sent.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailsView;
