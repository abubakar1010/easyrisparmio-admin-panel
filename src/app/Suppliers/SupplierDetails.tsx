import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { App, Button, Empty, Select, Table, Tag, Tooltip, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  FiArrowLeft,
  FiEdit2,
  FiExternalLink,
  FiFileText,
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
import SupplierFaqs from "./SupplierFaqs";
import {
  useGetSupplierByIdQuery,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useCancelDeletionMutation,
  type ISupplier,
  type SupplierOffer,
} from "../../redux/features/Suppliers/supplierApi";
import type { OfferPaymentMethod } from "../../redux/features/Offers/offerApi";
import { statusTagClass, commodityIconMap, commodityColorMap } from "./types";
import { server_origin } from "../../config";

type TabKey = "overview" | "offers" | "faqs" | "billing";

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
  return { iconKey, ...colors };
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
  const { t } = useTranslation();
  const { modal, message } = App.useApp();
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
        <Empty description={t("suppliers.supplier_not_found")} />
        <Button onClick={() => navigate("/suppliers")} icon={<FiArrowLeft />} className="rounded-lg">
          {t("suppliers.back_to_suppliers")}
        </Button>
      </div>
    );
  }

  const isPendingDeletion = supplier.status === "pending_deletion";
  const { iconKey, color, bg } = getVisuals(supplier);
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
    startDate: supplier.contractStartDate ? dayjs(supplier.contractStartDate) : undefined,
    notes: supplier.notes,
    logoUrl: supplier.logoUrl,
    description: supplier.description,
    contractSigningInstructions: supplier.contractSigningInstructions,
    contractSigningDocumentUrl: supplier.contractSigningDocumentUrl,
    contractSigningDocumentName: supplier.contractSigningDocumentName,
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateSupplier({ id: supplier.id, data: { status } }).unwrap();
      message.success(t("suppliers.status_updated", { status: t(`suppliers.status_${status}`) }));
    } catch {
      message.error(t("suppliers.status_update_failed"));
    }
  };

  const handleDeleteSupplier = () => {
    modal.confirm({
      title: t("suppliers.delete_title", { name: supplier.name }),
      icon: null,
      width: 520,
      centered: true,
      content: (
        <div className="mt-2 space-y-3">
          <p className="text-sm text-slate-600">
            {t("offers_market.delete_confirm_intro")}
          </p>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-600">
            {(["contracts", "offers", "new_offers", "acceptance", "early_cases", "contract_cases", "data"] as const).map((consequence) => (
              <li key={consequence}>
                <Trans t={t} i18nKey={`suppliers.delete_consequences.${consequence}`} components={{ strong: <strong /> }} />
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-400">
            {t("suppliers.you_can_cancel_a_scheduled_deletion_at_any_time_before_it_executes")}
          </p>
        </div>
      ),
      okText: t("suppliers.yes_delete_supplier"),
      cancelText: t("common.cancel"),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const result = await deleteSupplier(supplier.id).unwrap();
          if (result.scheduledDeletionDate) {
            const dateStr = dayjs(result.scheduledDeletionDate).format("DD/MM/YYYY");
            modal.info({
              title: t("suppliers.deletion_scheduled"),
              centered: true,
              content: (
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-slate-600">
                    <Trans t={t} i18nKey="suppliers.deletion_scheduled_explanation" values={{ name: supplier.name }} components={{ strong: <strong /> }} />
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                    <li>
                      {t("suppliers.scheduled_deletion_date")}{" "}
                      <strong>{dateStr}</strong>
                    </li>
                    {result.cancelledCases && result.cancelledCases > 0 ? (
                      <li>
                        <Trans t={t} i18nKey="suppliers.cancelled_cases" count={result.cancelledCases} components={{ strong: <strong /> }} />
                      </li>
                    ) : null}
                    <li>{t("suppliers.no_new_offers_can_be_created_or_sent")}</li>
                    <li>{t("suppliers.you_can_cancel_this_deletion_at_any_time")}</li>
                  </ul>
                </div>
              ),
              okText: t("suppliers.understood"),
            });
          } else {
            message.success(t("suppliers.supplier_deleted_successfully"));
            navigate("/suppliers");
          }
        } catch {
          message.error(t("suppliers.failed_to_delete_supplier"));
        }
      },
    });
  };

  const handleCancelDeletion = async () => {
    try {
      await cancelDeletion(supplier.id).unwrap();
      message.success(t("suppliers.supplier_deletion_cancelled"));
    } catch {
      message.error(t("suppliers.failed_to_cancel_deletion"));
    }
  };

  const offerColumns: ColumnsType<SupplierOffer> = [
    { title: t("suppliers.offer"), dataIndex: "name", key: "name", render: (v) => <span className="font-semibold text-slate-700">{v}</span> },
    {
      title: t("suppliers.commodity"),
      dataIndex: "energyType",
      key: "energyType",
      render: (v: string) => <Tag className="rounded border-0 bg-slate-100 text-xs text-slate-600">{t(`suppliers.commodities.${v}`, { defaultValue: "—" })}</Tag>,
    },
    {
      title: t("offers_market.price_type"),
      dataIndex: "marketType",
      key: "marketType",
      render: (v: string) => <span>{t(`offers_market.price_${v}`, { defaultValue: "—" })}</span>,
    },
    {
      title: t("offers_market.compensation"),
      dataIndex: "compensation",
      key: "compensation",
      render: (v) => <span className="text-xs text-slate-600 line-clamp-2">{v || "—"}</span>,
    },
    {
      title: t("offers_market.payment_method"),
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (v: OfferPaymentMethod) => (
        <span className="text-xs text-slate-600">{t(`offers_market.${v}`, { defaultValue: "—" })}</span>
      ),
    },
    {
      title: t("common.status"),
      dataIndex: "offerStatus",
      key: "offerStatus",
      render: (v: string) => (
        <Tag color={offerStatusColor[v] || "default"} className="rounded-full! px-2.5! text-xs font-semibold">{v === "published" ? t("suppliers.offer_published") : t(`offers_market.${v}`, { defaultValue: "—" })}</Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 60,
      align: "center",
      render: () => (
        <Tooltip title={t("common.remove")}>
          <button type="button" aria-label={t("common.remove")} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500">
            <FiTrash2 className="h-4 w-4" />
          </button>
        </Tooltip>
      ),
    },
  ];

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: t("suppliers.overview") },
    { key: "offers", label: t("suppliers.offers_count", { count: offers.length }) },
    { key: "faqs", label: t("suppliers.faqs_tab") },
    { key: "billing", label: t("suppliers.billing") },
  ];

  const contractDate = supplier.contractStartDate
    ? dayjs(supplier.contractStartDate).format("DD/MM/YYYY")
    : "—";

  return (
    <div className="space-y-5 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button type="link" className="h-auto px-0 text-slate-500 hover:text-slate-800" icon={<FiArrowLeft />} onClick={() => navigate("/suppliers")}>
        {t("suppliers.back_to_suppliers")}
      </Button>

      {/* Pending Deletion Banner */}
      {isPendingDeletion && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div>
            <p className="text-sm font-bold text-red-700">{t("suppliers.supplier_scheduled_for_deletion")}</p>
            <p className="mt-0.5 text-sm text-red-600">
              <Trans
                t={t}
                i18nKey="suppliers.deletion_banner"
                values={{ date: supplier.scheduledDeletionDate ? dayjs(supplier.scheduledDeletionDate).format("DD/MM/YYYY") : "—" }}
                components={{ strong: <span className="font-semibold" /> }}
              />
            </p>
          </div>
          <Button
            danger
            type="primary"
            onClick={handleCancelDeletion}
            loading={isCancelling}
            className="shrink-0 rounded-lg"
          >
            {t("suppliers.cancel_deletion")}
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {supplier.logoUrl ? (
            <img
              src={supplier.logoUrl.startsWith("http") ? supplier.logoUrl : `${server_origin}${supplier.logoUrl}`}
              alt={supplier.name}
              className="h-14 w-14 rounded-2xl object-cover border border-slate-200"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }}
            />
          ) : null}
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${bg} ${color} border border-current/10 ${supplier.logoUrl ? "hidden" : ""}`}>
            {iconMap[iconKey]}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800">{supplier.name}</h1>
              <Tag className={`m-0 rounded-full border-0 px-3 py-0.5 text-[10px] font-bold ${statusTagClass[supplier.status] || ""}`}>{t(`suppliers.status_${supplier.status}`)}</Tag>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">{supplier.legalName || "—"}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label={t("common.status")}
            value={supplier.status}
            onChange={handleStatusChange}
            disabled={isPendingDeletion}
            options={[
              { value: "active", label: t("suppliers.status_active") },
              { value: "inactive", label: t("suppliers.status_inactive") },
              ...(isPendingDeletion
                ? [{ value: "pending_deletion", label: t("suppliers.status_pending_deletion"), disabled: true }]
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
            {t("suppliers.edit_supplier")}
          </Button>
          {!isPendingDeletion && (
            <Button
              danger
              icon={<FiTrash2 />}
              onClick={handleDeleteSupplier}
              className="h-10 rounded-lg font-medium"
            >
              {t("common.delete")}
            </Button>
          )}
        </div>
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {[
          { label: t("suppliers.active_offers_label"), value: activeOffers.length },
          { label: t("suppliers.commodity"), value: supplier.commodity ? t(`suppliers.commodities.${supplier.commodity}`) : "—" },
          { label: t("suppliers.contract_since"), value: contractDate },
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
            <h3 className="mb-4 text-base font-semibold text-slate-800">{t("suppliers.general_information")}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow label={t("suppliers.brand_name")} value={supplier.name} />
              <InfoRow label={t("suppliers.legal_name")} value={supplier.legalName} />
              <InfoRow label={t("suppliers.tax_id")} value={supplier.taxId} />
              <InfoRow label={t("suppliers.commodity")} value={supplier.commodity ? t(`suppliers.commodities.${supplier.commodity}`) : null} />
              <InfoRow
                label={t("suppliers.website_url")}
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
            <h3 className="mb-4 text-base font-semibold text-slate-800">{t("suppliers.primary_contact")}</h3>
            <div className="space-y-4">
              <InfoRow icon={<FiUser className="h-4 w-4" />} label={t("suppliers.contact_name")} value={supplier.contactName} />
              <InfoRow icon={<FiMail className="h-4 w-4" />} label={t("suppliers.email")} value={supplier.contactEmail} />
              <InfoRow icon={<FiPhone className="h-4 w-4" />} label={t("suppliers.phone_number")} value={supplier.contactPhone} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">{t("suppliers.address")}</h3>
            <InfoRow
              icon={<FiMapPin className="h-4 w-4" />}
              label={t("suppliers.address")}
              value={
                [supplier.streetAddress, supplier.city, supplier.province, supplier.zipCode,
                  supplier.country && ["italy", "italia", "it"].includes(supplier.country.toLowerCase()) ? t("suppliers.italy") : supplier.country]
                  .filter(Boolean)
                  .join(", ") || null
              }
            />
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-base font-semibold text-slate-800">{t("suppliers.contract_signing_instructions")}</h3>
            <p className="mb-4 text-xs text-slate-400">
              {t("suppliers.shown_to_users_as_contract_sign_guideline_on_contracts_from_this_supplier")}
            </p>
            {supplier.contractSigningInstructions || supplier.contractSigningDocumentUrl ? (
              <>
                {supplier.contractSigningInstructions && (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                    {supplier.contractSigningInstructions}
                  </p>
                )}
                {supplier.contractSigningDocumentUrl && (
                  <a
                    href={
                      supplier.contractSigningDocumentUrl.startsWith("http")
                        ? supplier.contractSigningDocumentUrl
                        : `${server_origin}${supplier.contractSigningDocumentUrl}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-colors hover:border-[#7061ED] hover:text-[#7061ED]"
                  >
                    <FiFileText className="h-4 w-4" />
                    {supplier.contractSigningDocumentName || t("common.view")}
                  </a>
                )}
              </>
            ) : (
              <p className="text-sm leading-relaxed text-slate-600">{t("suppliers.no_signing_instructions")}</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">{t("suppliers.notes")}</h3>
            <p className="text-sm leading-relaxed text-slate-600">{supplier.notes || t("suppliers.no_notes")}</p>
          </div>
        </div>
      )}

      {activeTab === "offers" && (
        <div className="rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm">
          {offers.length === 0 ? (
            <div className="py-12">
              <Empty description={t("suppliers.no_offers_yet")} />
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

      {activeTab === "faqs" && <SupplierFaqs supplierId={supplier.id} disabled={isPendingDeletion} />}

      {activeTab === "billing" && (
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">{t("suppliers.billing")}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow label={t("suppliers.contract_start_date")} value={contractDate} />
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
