import { useMemo, useState } from "react";
import { Button, Empty, Select, Table, Tag, Tooltip, message, Modal } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  FiArrowLeft,
  FiEdit2,
  FiExternalLink,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import { LuDatabase, LuFlame, LuGlobe, LuZap } from "react-icons/lu";
import { useNavigate, useParams } from "react-router";
import AddSupplierModal from "./AddSupplierModal";
import { CreateOfferModal } from "../OffersMarket/components/CreateOfferModal";
import { getSupplierById, type IconKey, type Supplier, type SupplierOffer, type SupplierStatus } from "./types";

type TabKey = "overview" | "offers" | "billing";

const iconMap: Record<IconKey, React.ReactNode> = {
  database: <LuDatabase className="h-7 w-7" />,
  flame: <LuFlame className="h-7 w-7" />,
  zap: <LuZap className="h-7 w-7" />,
  globe: <LuGlobe className="h-7 w-7" />,
};

const statusTagClass: Record<SupplierStatus, string> = {
  Good: "bg-emerald-100 text-emerald-600",
  Warning: "bg-amber-100 text-amber-600",
  Inactive: "bg-slate-100 text-slate-500",
};

const offerStatusColor: Record<SupplierOffer["status"], string> = {
  Active: "green",
  Expiring: "gold",
  Draft: "default",
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
  const found = useMemo(() => getSupplierById(supplierId), [supplierId]);

  const [supplier, setSupplier] = useState<Supplier | undefined>(found);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);

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

  const avgCommission = supplier.offers.length
    ? Math.round(supplier.offers.reduce((sum, o) => sum + o.commission, 0) / supplier.offers.length)
    : 0;

  const editInitialValues: Record<string, unknown> = {
    brandName: supplier.brandName,
    legalName: supplier.legalName,
    taxId: supplier.taxId,
    commodity: supplier.commodity,
    status: supplier.status.toLowerCase() === "good" ? "active" : supplier.status.toLowerCase(),
    website: supplier.website,
    contactName: supplier.contactName,
    email: supplier.email,
    phoneNumber: supplier.phone,
    streetAddress: supplier.street,
    city: supplier.city,
    zipCode: supplier.zip,
    country: supplier.country,
    iban: supplier.iban,
    commElectricity: supplier.commElectricity,
    commGas: supplier.commGas,
    notes: supplier.notes,
  };

  const handleSaved = (values: Record<string, any>) => {
    setSupplier((prev) =>
      prev
        ? {
            ...prev,
            brandName: values.brandName ?? prev.brandName,
            legalName: values.legalName ?? prev.legalName,
            taxId: values.taxId ?? prev.taxId,
            commodity: values.commodity ?? prev.commodity,
            website: values.website ?? prev.website,
            contactName: values.contactName ?? prev.contactName,
            email: values.email ?? prev.email,
            phone: values.phoneNumber ?? prev.phone,
            street: values.streetAddress ?? prev.street,
            city: values.city ?? prev.city,
            zip: values.zipCode ?? prev.zip,
            country: values.country ?? prev.country,
            iban: values.iban ?? prev.iban,
            commElectricity: values.commElectricity ?? prev.commElectricity,
            commGas: values.commGas ?? prev.commGas,
            notes: values.notes ?? prev.notes,
          }
        : prev,
    );
  };

  const handleStatusChange = (status: SupplierStatus) => {
    setSupplier((prev) => (prev ? { ...prev, status } : prev));
    message.success(`Status set to ${status}`);
  };

  const handleDeleteOffer = (offer: SupplierOffer) => {
    Modal.confirm({
      title: "Remove offer?",
      content: `"${offer.name}" will be removed from this supplier.`,
      okText: "Remove",
      okButtonProps: { danger: true },
      centered: true,
      onOk: () => {
        setSupplier((prev) => (prev ? { ...prev, offers: prev.offers.filter((o) => o.id !== offer.id) } : prev));
        message.success("Offer removed");
      },
    });
  };

  const offerColumns: ColumnsType<SupplierOffer> = [
    { title: "OFFER", dataIndex: "name", key: "name", render: (v) => <span className="font-semibold text-slate-700">{v}</span> },
    { title: "COMMODITY", dataIndex: "commodity", key: "commodity", render: (v) => <Tag className="rounded border-0 bg-slate-100 text-xs text-slate-600">{v}</Tag> },
    { title: "PRICE TYPE", dataIndex: "priceType", key: "priceType" },
    { title: "COMMISSION", dataIndex: "commission", key: "commission", render: (v) => <span className="font-semibold text-emerald-600">€{v}</span> },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (v: SupplierOffer["status"]) => (
        <Tag color={offerStatusColor[v]} className="rounded-full! px-2.5! text-xs font-semibold">{v}</Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 60,
      align: "center",
      render: (_, record) => (
        <Tooltip title="Remove">
          <button type="button" onClick={() => handleDeleteOffer(record)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500">
            <FiTrash2 className="h-4 w-4" />
          </button>
        </Tooltip>
      ),
    },
  ];

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "offers", label: `Offers (${supplier.offers.length})` },
    { key: "billing", label: "Billing & Commissions" },
  ];

  return (
    <div className="space-y-5 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button type="link" className="h-auto px-0 text-slate-500 hover:text-slate-800" icon={<FiArrowLeft />} onClick={() => navigate("/suppliers")}>
        Back to Suppliers
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${supplier.bg} ${supplier.color} border border-current/10`}>
            {iconMap[supplier.iconKey]}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800">{supplier.brandName}</h1>
              <Tag className={`m-0 rounded-full border-0 px-3 py-0.5 text-[10px] font-bold ${statusTagClass[supplier.status]}`}>{supplier.status}</Tag>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">{supplier.legalName}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={supplier.status}
            onChange={handleStatusChange}
            options={[{ value: "Good", label: "Good" }, { value: "Warning", label: "Warning" }, { value: "Inactive", label: "Inactive" }]}
            className="min-w-[130px] [&_.ant-select-selector]:h-10! [&_.ant-select-selector]:rounded-lg [&_.ant-select-selection-item]:leading-[40px]!"
          />
          <Button icon={<FiEdit2 />} onClick={() => setEditOpen(true)} className="h-10 rounded-lg font-medium">
            Edit Supplier
          </Button>
          <Button type="primary" icon={<FiPlus />} onClick={() => setOfferOpen(true)} className="h-10 rounded-lg bg-[#8b85f6] font-semibold hover:bg-[#7a74e5]">
            Add Offer
          </Button>
        </div>
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Active Offers", value: supplier.offers.length },
          { label: "Avg. Commission", value: `€${avgCommission}` },
          { label: "Commodity", value: supplier.commodity },
          { label: "Contract Since", value: supplier.contractStartDate },
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
              <InfoRow label="Brand Name" value={supplier.brandName} />
              <InfoRow label="Legal Name" value={supplier.legalName} />
              <InfoRow label="Tax ID" value={supplier.taxId} />
              <InfoRow label="Commodity" value={supplier.commodity} />
              <InfoRow
                label="Website"
                value={
                  <a href={supplier.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600">
                    {supplier.website.replace(/^https?:\/\//, "")} <FiExternalLink className="h-3.5 w-3.5" />
                  </a>
                }
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Primary Contact</h3>
            <div className="space-y-4">
              <InfoRow icon={<FiUser className="h-4 w-4" />} label="Contact Name" value={supplier.contactName} />
              <InfoRow icon={<FiMail className="h-4 w-4" />} label="Email" value={supplier.email} />
              <InfoRow icon={<FiPhone className="h-4 w-4" />} label="Phone Number" value={supplier.phone} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Address</h3>
            <InfoRow
              icon={<FiMapPin className="h-4 w-4" />}
              label="Address"
              value={`${supplier.street}, ${supplier.zip} ${supplier.city}, ${supplier.country}`}
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
          {supplier.offers.length === 0 ? (
            <div className="py-12">
              <Empty description="No offers yet">
                <Button type="primary" icon={<FiPlus />} onClick={() => setOfferOpen(true)} className="rounded-lg bg-[#8b85f6] font-semibold hover:bg-[#7a74e5]">
                  Add Offer
                </Button>
              </Empty>
            </div>
          ) : (
            <Table<SupplierOffer>
              rowKey="id"
              columns={offerColumns}
              dataSource={supplier.offers}
              pagination={false}
              scroll={{ x: 700 }}
              className="[&_.ant-table-thead_th]:bg-slate-50 [&_.ant-table-thead_th]:text-xs [&_.ant-table-thead_th]:font-semibold [&_.ant-table-thead_th]:text-slate-500"
            />
          )}
        </div>
      )}

      {activeTab === "billing" && (
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">Billing &amp; Commissions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow label="IBAN" value={<span className="font-mono">{supplier.iban}</span>} />
            <InfoRow label="Contract Start Date" value={supplier.contractStartDate} />
            <InfoRow label="Commission Per Electricity Contract" value={`€${supplier.commElectricity}`} />
            <InfoRow label="Commission Per Gas Contract" value={supplier.commGas ? `€${supplier.commGas}` : "—"} />
          </div>
        </div>
      )}

      <AddSupplierModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        mode="edit"
        initialValues={editInitialValues}
        onSaved={handleSaved}
      />
      <CreateOfferModal open={offerOpen} onClose={() => setOfferOpen(false)} />
    </div>
  );
};

export default SupplierDetails;
