import { useState } from "react";
import { Button, Empty, Select, Table, Tag, Tooltip, message, Modal, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  FiArrowLeft,
  FiEdit2,
  FiExternalLink,
  FiMail,
  FiMapPin,
  FiPhone,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import { LuDatabase, LuFlame, LuGlobe, LuZap } from "react-icons/lu";
import { useNavigate, useParams } from "react-router";
import dayjs from "dayjs";
import AddSupplierModal from "./AddSupplierModal";
import {
  useGetSupplierByIdQuery,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useCancelDeletionMutation,
  type ISupplier,
  type SupplierOffer,
} from "../../redux/features/Suppliers/supplierApi";
import { statusDisplayMap, statusTagClass, commodityIconMap, commodityColorMap } from "./types";

type TabKey = "overview" | "offers" | "billing";

const iconMap: Record<string, React.ReactNode> = {
  database: <LuDatabase className="h-7 w-7" />,
  flame: <LuFlame className="h-7 w-7" />,
  zap: <LuZap className="h-7 w-7" />,
  globe: <LuGlobe className="h-7 w-7" />,
};

function getVisuals(supplier: ISupplier) {
  const commodity = supplier.commodity || "dual";
  const iconKey = commodityIconMap[commodity] || "globe";
  const colors = commodityColorMap[commodity] || { color: "text-blue-500", bg: "bg-blue-50" };
  const displayStatus = statusDisplayMap[supplier.status] || "Good";
  return { iconKey, ...colors, displayStatus };
}

const offerStatusColor: Record<string, string> = {
  active: "green",
  published: "green",
  expiring: "gold",
  draft: "default",
  archived: "default",
};

const InfoRow = ({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div className="flex items-start gap-3">
    {icon && <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">{icon}</div>}
    <div className="min-w-0">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold break-words text-slate-700">{value || "—"}</p>
    </div>
  </div>
);

const SupplierDetails = () => {
  const navigate = useNavigate();
  const { supplierId } = useParams();
  const { data: supplier, isLoading } = useGetSupplierByIdQuery(supplierId!, { skip: !supplierId });
  const [updateSupplier] = useUpdateSupplierMutation();
  const [deleteSupplier] = useDeleteSupplierMutation();
  const [cancelDeletion, { isLoading: isCancelling }] = useCancelDeletionMutation();

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spin size="large" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Empty description="Supplier not found" />
        <Button onClick={() => navigate("/suppliers")} icon={<FiArrowLeft />} className="rounded-lg">
          Back to Suppliers
        </Button>
      </div>
    );
  }

  const isPendingDeletion = supplier.status === "pending_deletion";
  const { iconKey, color, bg, displayStatus } = getVisuals(supplier);
  const offers = supplier.offers || [];
  const activeOffers = offers.filter((o) => o.isActive);
  const editInitialValues: Record<string, unknown> = {
    brandName: supplier.name,
    legalName: supplier.legalName,
    taxId: supplier.taxId,
    commodity: supplier.commodity,
    status: supplier.status,
    website: supplier.website,
    contactName: supplier.contactName,
    email: supplier.contactEmail,
    phoneNumber: supplier.contactPhone,
    streetAddress: supplier.streetAddress,
    city: supplier.city,
    province: supplier.province,
    zipCode: supplier.zipCode,
    iban: supplier.iban,
    startDate: supplier.contractStartDate ? dayjs(supplier.contractStartDate) : undefined,
    notes: supplier.notes,
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateSupplier({ id: supplier.id, data: { status } }).unwrap();
      message.success(`Status set to ${statusDisplayMap[status as keyof typeof statusDisplayMap] || status}`);
    } catch {
      message.error("Failed to update status");
    }
  };

  const handleDeleteSupplier = () => {
    Modal.confirm({
      title: "Delete supplier?",
      content: `"${supplier.name}" will be permanently removed. If this supplier has active contracts, deletion will be scheduled until those contracts expire.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        try {
          const result = await deleteSupplier(supplier.id).unwrap();
          if (result.scheduledDeletionDate) {
            message.success(
              `Supplier deletion scheduled for ${dayjs(result.scheduledDeletionDate).format("DD/MM/YYYY")}${result.cancelledCases ? `. ${result.cancelledCases} early-stage case(s) cancelled.` : ""}`,
            );
          } else {
            message.success("Supplier deleted");
            navigate("/suppliers");
          }
        } catch {
          message.error("Failed to delete supplier");
        }
      },
    });
  };

  const handleCancelDeletion = async () => {
    try {
      await cancelDeletion(supplier.id).unwrap();
      message.success("Supplier deletion cancelled");
    } catch {
      message.error("Failed to cancel deletion");
    }
  };

  const offerColumns: ColumnsType<SupplierOffer> = [
    { title: "OFFER", dataIndex: "name", key: "name", render: (v) => <span className="font-semibold text-slate-700">{v}</span> },
    {
      title: "COMMODITY",
      dataIndex: "energyType",
      key: "energyType",
      render: (v) => <Tag className="rounded border-0 bg-slate-100 text-xs text-slate-600 capitalize">{v}</Tag>,
    },
    {
      title: "PRICE TYPE",
      dataIndex: "marketType",
      key: "marketType",
      render: (v) => <span className="capitalize">{v}</span>,
    },
    {
      title: "STATUS",
      dataIndex: "offerStatus",
      key: "offerStatus",
      render: (v: string) => (
        <Tag color={offerStatusColor[v] || "default"} className="rounded-full! px-2.5! text-xs font-semibold capitalize">{v}</Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 60,
      align: "center",
      render: () => (
        <Tooltip title="Remove">
          <button type="button" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500">
            <FiTrash2 className="h-4 w-4" />
          </button>
        </Tooltip>
      ),
    },
  ];

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "offers", label: `Offers (${offers.length})` },
    { key: "billing", label: "Billing" },
  ];

  const contractDate = supplier.contractStartDate
    ? dayjs(supplier.contractStartDate).format("DD/MM/YYYY")
    : "—";

  return (
    <div className="space-y-5 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button type="link" className="h-auto px-0 text-slate-500 hover:text-slate-800" icon={<FiArrowLeft />} onClick={() => navigate("/suppliers")}>
        Back to Suppliers
      </Button>

      {/* Pending Deletion Banner */}
      {isPendingDeletion && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div>
            <p className="text-sm font-bold text-red-700">Supplier Scheduled for Deletion</p>
            <p className="mt-0.5 text-sm text-red-600">
              This supplier will be automatically deleted on{" "}
              <span className="font-semibold">
                {supplier.scheduledDeletionDate
                  ? dayjs(supplier.scheduledDeletionDate).format("DD/MM/YYYY")
                  : "N/A"}
              </span>
              . No new offers can be created or sent during this period.
            </p>
          </div>
          <Button
            danger
            type="primary"
            onClick={handleCancelDeletion}
            loading={isCancelling}
            className="shrink-0 rounded-lg"
          >
            Cancel Deletion
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${bg} ${color} border border-current/10`}>
            {iconMap[iconKey]}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800">{supplier.name}</h1>
              <Tag className={`m-0 rounded-full border-0 px-3 py-0.5 text-[10px] font-bold ${statusTagClass[displayStatus] || ""}`}>{displayStatus}</Tag>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">{supplier.legalName || "—"}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={supplier.status}
            onChange={handleStatusChange}
            disabled={isPendingDeletion}
            options={[
              { value: "active", label: "Good" },
              { value: "warning", label: "Warning" },
              { value: "inactive", label: "Inactive" },
              ...(isPendingDeletion
                ? [{ value: "pending_deletion", label: "Pending Deletion", disabled: true }]
                : []),
            ]}
            className="min-w-[130px] [&_.ant-select-selector]:h-10! [&_.ant-select-selector]:rounded-lg [&_.ant-select-selection-item]:leading-[40px]!"
          />
          <Button
            icon={<FiEdit2 />}
            onClick={() => setEditOpen(true)}
            disabled={isPendingDeletion}
            className="h-10 rounded-lg font-medium"
          >
            Edit Supplier
          </Button>
        </div>
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {[
          { label: "Active Offers", value: activeOffers.length },
          { label: "Commodity", value: supplier.commodity ? supplier.commodity.charAt(0).toUpperCase() + supplier.commodity.slice(1) : "—" },
          { label: "Contract Since", value: contractDate },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-400">{c.label}</p>
            <p className="mt-1 text-lg font-bold text-slate-800">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-200/70">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`relative pb-3 text-sm font-medium transition-colors ${active ? "text-[#8b85f6]" : "text-slate-500 hover:text-slate-700"}`}
            >
              {tab.label}
              {active && <span className="absolute -bottom-px left-0 h-0.5 w-full rounded-full bg-[#8b85f6]" />}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">General Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow label="Brand Name" value={supplier.name} />
              <InfoRow label="Legal Name" value={supplier.legalName} />
              <InfoRow label="Tax ID" value={supplier.taxId} />
              <InfoRow label="Commodity" value={supplier.commodity ? supplier.commodity.charAt(0).toUpperCase() + supplier.commodity.slice(1) : null} />
              <InfoRow
                label="Website"
                value={
                  supplier.website ? (
                    <a href={supplier.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600">
                      {supplier.website.replace(/^https?:\/\//, "")} <FiExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null
                }
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Primary Contact</h3>
            <div className="space-y-4">
              <InfoRow icon={<FiUser className="h-4 w-4" />} label="Contact Name" value={supplier.contactName} />
              <InfoRow icon={<FiMail className="h-4 w-4" />} label="Email" value={supplier.contactEmail} />
              <InfoRow icon={<FiPhone className="h-4 w-4" />} label="Phone Number" value={supplier.contactPhone} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Address</h3>
            <InfoRow
              icon={<FiMapPin className="h-4 w-4" />}
              label="Address"
              value={
                [supplier.streetAddress, supplier.city, supplier.province, supplier.zipCode, supplier.country]
                  .filter(Boolean)
                  .join(", ") || null
              }
            />
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Notes</h3>
            <p className="text-sm leading-relaxed text-slate-600">{supplier.notes || "No notes."}</p>
          </div>
        </div>
      )}

      {activeTab === "offers" && (
        <div className="rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm">
          {offers.length === 0 ? (
            <div className="py-12">
              <Empty description="No offers yet" />
            </div>
          ) : (
            <Table<SupplierOffer>
              rowKey="id"
              columns={offerColumns}
              dataSource={offers}
              pagination={false}
              scroll={{ x: 700 }}
              className="[&_.ant-table-thead_th]:bg-slate-50 [&_.ant-table-thead_th]:text-xs [&_.ant-table-thead_th]:font-semibold [&_.ant-table-thead_th]:text-slate-500"
            />
          )}
        </div>
      )}

      {activeTab === "billing" && (
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">Billing</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow label="IBAN" value={supplier.iban ? <span className="font-mono">{supplier.iban}</span> : null} />
            <InfoRow label="Contract Start Date" value={contractDate} />
          </div>
        </div>
      )}

      <AddSupplierModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        mode="edit"
        supplierId={supplier.id}
        initialValues={editInitialValues}
      />
    </div>
  );
};

export default SupplierDetails;
