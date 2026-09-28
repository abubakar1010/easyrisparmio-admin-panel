import { getApiErrorMessage } from "../../utils/apiError";
import { getLocale } from "../../utils/format";
import { Table, Button, Tag, Space, Input, Select, Card, Spin, Empty, Modal, Dropdown, Tooltip, message } from "antd";
import { FiPlus, FiSearch, FiEdit2, FiEye, FiMoreVertical } from "react-icons/fi";
import { LuTrendingUp, LuTag, LuLeaf } from "react-icons/lu";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { useNavigate } from "react-router";
import { CreateOfferModal } from "./components/CreateOfferModal";
import {
  useGetOffersAdminQuery,
  useDeleteOfferMutation,
  useUpdateOfferStatusMutation,
  PAYMENT_METHOD_LABELS,
  type IOffer,
  type OfferPaymentMethod,
} from "../../redux/features/Offers/offerApi";
import { debounce } from "../../utils/debounce";
import { formatMoney } from "../../utils/format";
import { toContractDurationFormValue } from "../../utils/contractDuration";

const { Option } = Select;

const statusDot: Record<string, string> = {
  active: "bg-emerald-500",
  expiring: "bg-amber-500",
  draft: "bg-slate-300",
  expired: "bg-red-400",
  archived: "bg-slate-400",
};

const BASE_STATUS_TRANSITIONS: Record<string, { value: string; label: string }[]> = {
  draft: [
    { value: "active", label: "activate" },
    { value: "archived", label: "archive" },
  ],
  active: [
    { value: "expiring", label: "mark_expiring" },
    { value: "archived", label: "archive" },
  ],
  expiring: [
    { value: "expired", label: "mark_expired" },
    { value: "archived", label: "archive" },
  ],
  expired: [{ value: "archived", label: "archive" }],
  // Archiving retires an offer from the catalogue, it does not destroy it.
  archived: [{ value: "active", label: "restore" }],
};

/** Returns available status transitions for an offer, considering acceptance state. */
const getStatusTransitions = (offer: IOffer) => {
  const transitions = [...(BASE_STATUS_TRANSITIONS[offer.offerStatus] || [])];
  // DRAFT is the only editable state, so it stays out of reach while a live
  // case depends on the offer's terms. A cancelled or rejected case does not
  // count — `hasAcceptedCases` already excludes those.
  const canReturnToDraft =
    (offer.offerStatus === "active" || offer.offerStatus === "archived") &&
    !offer.hasAcceptedCases;
  if (canReturnToDraft) {
    transitions.unshift({ value: "draft", label: "back_to_draft" });
  }
  return transitions;
};

const OffersMarket = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [createOfferOpen, setCreateOfferOpen] = useState(false);
  const [editOfferOpen, setEditOfferOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<IOffer | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [energyType, setEnergyType] = useState<string | undefined>();
  const [offerStatus, setOfferStatus] = useState<string | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<OfferPaymentMethod | undefined>();

  const { data, isLoading } = useGetOffersAdminQuery({
    page,
    limit: 20,
    search: search || undefined,
    paymentMethod,
    energyType,
    offerStatus,
  });
  const [deleteOffer] = useDeleteOfferMutation();
  const [updateStatus] = useUpdateOfferStatusMutation();

  const offers = data?.data || [];
  const meta = data?.meta;

  const totalOffers = meta?.total || 0;
  const activeCount = offers.filter((o) => o.offerStatus === "active").length;

  const handleSearch = debounce((value: string) => {
    setSearch(value);
    setPage(1);
  }, 400);

  const handleViewDetails = (offer: IOffer) => {
    navigate(`/offers-market/${offer.id}`);
  };

  const handleEdit = (offer: IOffer) => {
    setSelectedOffer(offer);
    setEditOfferOpen(true);
  };

  /** Strip meaningless trailing zeros from decimal strings returned by the backend */
  const cleanDecimal = (v: number | string | null | undefined) =>
    v != null ? String(parseFloat(String(v))) : undefined;

  const getEditInitialValues = (offer: IOffer): Record<string, unknown> => ({
    offerName: offer.name,
    offerCode: offer.offerCode,
    supplier: offer.supplierId,
    commodity: offer.energyType,
    priceType: offer.marketType,
    status: offer.offerStatus,
    activationCost: cleanDecimal(offer.activationCost),
    fixedMonthlyFee: cleanDecimal(offer.fixedMonthlyFee),
    pricePerKwh: cleanDecimal(offer.pricePerKwh),
    pricePerSmc: cleanDecimal(offer.pricePerSmc),
    spread: cleanDecimal(offer.spread),
    contractDuration: toContractDurationFormValue(offer.contractDurationMonths),
    isGreenEnergy: offer.isGreenEnergy,
    validFrom: offer.validFrom ? dayjs(offer.validFrom) : undefined,
    validity: offer.validUntil ? dayjs(offer.validUntil) : undefined,
    target: offer.target,
    paymentMethod: offer.paymentMethod,
    highlights: offer.highlights,
    termsUrl: offer.termsUrl,
    economicConditionsUrl: offer.economicConditionsUrl,
    compensation: offer.compensation,
    notes: offer.description,
  });

  const handleDelete = (offer: IOffer) => {
    Modal.confirm({
      title: t("offers_market.delete_confirm_title", { name: offer.name }),
      icon: null,
      width: 500,
      centered: true,
      content: (
        <div className="mt-2 space-y-3">
          <p className="text-sm text-slate-600">
            {t("offers_market.delete_confirm_intro")}
          </p>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-600">
            <li>
              {t("offers_market.delete_confirm_item_1")}
            </li>
            <li>
              {t("offers_market.delete_confirm_item_2")}
            </li>
            <li>
              {t("offers_market.delete_confirm_item_3")}
            </li>
            <li>
              {t("offers_market.delete_confirm_item_4")}
            </li>
          </ul>
        </div>
      ),
      okText: t("offers_market.delete_offer_confirm"),
      cancelText: t("common.cancel"),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteOffer(offer.id).unwrap();
          message.success(t("offers_market.offer_deleted"));
        } catch (err: any) {
          const msg = getApiErrorMessage(err, t("offers_market.delete_failed"));
          message.error(msg);
        }
      },
    });
  };

  const handleStatusChange = (offer: IOffer, newStatus: string) => {
    const transitionKey = getStatusTransitions(offer).find((t) => t.value === newStatus)?.label;
    const label = transitionKey ? t(`offers_market.${transitionKey}`) : t(`offers_market.${newStatus}`);
    Modal.confirm({
      title: t("offers_market.change_status_title", { action: label }),
      content: t("offers_market.change_status_content", { name: offer.name, from: t(`offers_market.${offer.offerStatus}`), to: t(`offers_market.${newStatus}`) }),
      okText: label,
      centered: true,
      onOk: async () => {
        try {
          await updateStatus({ id: offer.id, offerStatus: newStatus }).unwrap();
          message.success(t("offers_market.status_changed", { status: t(`offers_market.${newStatus}`) }));
        } catch {
          message.error(t("offers_market.status_update_failed"));
        }
      },
    });
  };

  const columns: ColumnsType<IOffer> = [
    {
      title: "ID",
      dataIndex: "offerCode",
      key: "offerCode",
      className: "text-slate-500 font-medium",
      render: (v) => v || "—",
    },
    {
      title: t("notification_templates.name").toUpperCase(),
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="font-bold text-slate-800">{text}</span>,
    },
    {
      title: t("offers_market.supplier"),
      key: "supplier",
      className: "text-slate-500",
      responsive: ["md"],
      render: (_, record) => record.supplier?.name || "—",
    },
    {
      title: t("offers_market.commodity").toUpperCase(),
      dataIndex: "energyType",
      key: "energyType",
      render: (type: string) => (
        <Tag
          className={`border-0 rounded font-bold text-[10px] px-2 py-0 uppercase ${
            type === "electricity"
              ? "bg-emerald-50 text-emerald-600"
              : type === "gas"
              ? "bg-blue-50 text-blue-600"
              : "bg-purple-50 text-purple-600"
          }`}
        >
          {t(`offers_market.${type}`)}
        </Tag>
      ),
      align: "center",
    },
    {
      title: t("offers_market.price_type"),
      dataIndex: "marketType",
      key: "marketType",
      className: "text-slate-500 capitalize",
      responsive: ["lg"],
    },
    {
      title: t("offers_market.payment_method"),
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      className: "text-slate-500",
      responsive: ["lg"],
      render: (val: OfferPaymentMethod) => PAYMENT_METHOD_LABELS[val] || "—",
    },
    {
      title: t("offers_market.activation_cost"),
      dataIndex: "activationCost",
      key: "activationCost",
      render: (val) => (
        <span className="text-emerald-600 font-bold">
          {formatMoney(val)}
        </span>
      ),
    },
    {
      title: t("offers_market.compensation"),
      dataIndex: "compensation",
      key: "compensation",
      className: "text-slate-600",
      render: (val) => (
        <span className="text-sm text-slate-600 line-clamp-2">{val || "—"}</span>
      ),
    },
    {
      title: t("offers_market.validity"),
      dataIndex: "validUntil",
      key: "validUntil",
      className: "text-slate-500",
      responsive: ["md"],
      render: (v) => (v ? new Date(v).toLocaleDateString(getLocale()) : "—"),
    },
    {
      title: t("common.status").toUpperCase(),
      dataIndex: "offerStatus",
      key: "offerStatus",
      render: (status: string) => (
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${statusDot[status] || "bg-slate-300"}`} />
          <span className="text-sm font-medium text-slate-600">{t(`offers_market.${status}`)}</span>
        </span>
      ),
    },
    {
      title: t("common.actions").toUpperCase(),
      key: "action",
      width: 140,
      render: (_, record) => {
        const transitions = getStatusTransitions(record);
        const isImmutable = record.offerStatus !== "draft" && !!record.hasAcceptedCases;
        const menuItems: MenuProps["items"] = [
          ...transitions.map((transition) => ({
            key: transition.value,
            label: t(`offers_market.${transition.label}`),
            onClick: () => handleStatusChange(record, transition.value),
          })),
          ...(transitions.length > 0 ? [{ type: "divider" as const }] : []),
          {
            key: "delete",
            label: t("common.delete"),
            danger: true,
            onClick: () => handleDelete(record),
          },
        ];

        return (
          <Space size={2} onClick={(e) => e.stopPropagation()}>
            <Tooltip title={t("offers_market.view_details")}>
              <Button
                type="text"
                size="small"
                icon={<FiEye className="h-4 w-4" />}
                onClick={() => handleViewDetails(record)}
              />
            </Tooltip>
            <Tooltip title={isImmutable ? t("audit.offer_fields_locked") : t("common.edit")}>
              <Button
                type="text"
                size="small"
                icon={<FiEdit2 className={isImmutable ? "text-slate-200" : "text-slate-400"} />}
                onClick={() => !isImmutable && handleEdit(record)}
                disabled={isImmutable}
              />
            </Tooltip>
            <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
              <Button
                type="text"
                size="small"
                icon={<FiMoreVertical className="text-slate-400" />}
              />
            </Dropdown>
          </Space>
        );
      },
      align: "center",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t("offers_market.title")}</h1>
          <p className="text-sm text-slate-500 mt-1">{t("offers_market.description")}</p>
        </div>
        <Button
          type="primary"
          icon={<FiPlus />}
          className="bg-[#8b85f6] hover:bg-[#7a74e5] rounded-lg h-10 px-6 font-bold border-0 shadow-sm"
          onClick={() => setCreateOfferOpen(true)}
        >
          {t("offers_market.create_offer")}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: t("offers_market.total_offers"), value: String(totalOffers), icon: <LuTag className="h-6 w-6" />, color: "bg-blue-50 text-blue-500" },
          { title: t("offers_market.active"), value: String(activeCount), icon: <LuLeaf className="h-6 w-6" />, color: "bg-emerald-50 text-emerald-500" },
          { title: t("offers_market.avg_activation_cost"), value: "—", icon: <LuLeaf className="h-6 w-6" />, color: "bg-emerald-50 text-emerald-500" },
          { title: t("suppliers.title"), value: String(new Set(offers.map((o) => o.supplierId)).size), icon: <LuTrendingUp className="h-6 w-6" />, color: "bg-purple-50 text-purple-500" },
        ].map((kpi, idx) => (
          <Card key={idx} className="border-slate-100 shadow-sm rounded-2xl overflow-hidden [&_.ant-card-body]:p-5">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${kpi.color}`}>
                {kpi.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.title}</p>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">{kpi.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white p-4">
          <div className="w-full min-w-0 flex-1 sm:min-w-[280px]">
            <Input
              placeholder={t("offers_market.search_offers")}
              prefix={<FiSearch className="text-slate-400 mr-2" />}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-11 rounded-xl border-slate-200 hover:border-indigo-400 focus:border-indigo-400 shadow-sm"
            />
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-[auto_auto_auto] sm:gap-3">
            <Select
              allowClear
              placeholder={t("offers_market.commodity")}
              onChange={(v) => { setEnergyType(v); setPage(1); }}
              style={{ height: "44px" }}
              className="w-full sm:w-36 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200"
            >
              <Option value="electricity">{t("offers_market.electricity")}</Option>
              <Option value="gas">{t("offers_market.gas")}</Option>
              <Option value="dual">{t("offers_market.dual")}</Option>
            </Select>
            <Select
              allowClear
              placeholder={t("common.status")}
              onChange={(v) => { setOfferStatus(v); setPage(1); }}
              style={{ height: "44px" }}
              className="w-full sm:w-32 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200"
            >
              <Option value="active">{t("offers_market.active")}</Option>
              <Option value="expiring">{t("offers_market.expiring")}</Option>
              <Option value="draft">{t("offers_market.draft")}</Option>
              <Option value="expired">{t("offers_market.expired")}</Option>
              <Option value="archived">{t("offers_market.archived")}</Option>
            </Select>
            {/* Direct Debit / Postal Order also match offers accepting both;
                Both narrows to offers that accept both. */}
            <Select
              allowClear
              placeholder={t("offers_market.payment_method")}
              onChange={(v) => { setPaymentMethod(v); setPage(1); }}
              style={{ height: "44px" }}
              className="w-full sm:w-44 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200"
            >
              <Option value="direct_debit">{t("offers_market.direct_debit")}</Option>
              <Option value="postal_order">{t("offers_market.postal_order")}</Option>
              <Option value="both">{t("offers_market.both")}</Option>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Spin size="large" />
          </div>
        ) : offers.length === 0 ? (
          <div className="py-24">
            <Empty description={t("offers_market.no_offers_found")} />
          </div>
        ) : (
          <Table<IOffer>
            rowKey="id"
            columns={columns}
            dataSource={offers}
            scroll={{ x: 1120 }}
            onRow={(record) => ({
              onClick: () => handleViewDetails(record),
              className: "cursor-pointer",
            })}
            pagination={{
              current: page,
              pageSize: meta?.limit || 20,
              total: meta?.total || 0,
              onChange: setPage,
              showSizeChanger: false,
              className: "p-4 mt-0 border-t border-slate-100",
            }}
            className="[&_.ant-table-thead_th]:bg-slate-50/50 [&_.ant-table-thead_th]:text-slate-500 [&_.ant-table-thead_th]:text-[11px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:uppercase [&_.ant-table-thead_th]:tracking-widest [&_.ant-table-thead_th]:py-4 [&_.ant-table-row]:hover:bg-slate-50/30 [&_.ant-table-cell]:py-4"
          />
        )}
      </div>

      {/* Create modal */}
      <CreateOfferModal open={createOfferOpen} onClose={() => setCreateOfferOpen(false)} mode="add" />

      {/* Edit modal */}
      <CreateOfferModal
        open={editOfferOpen}
        onClose={() => {
          setEditOfferOpen(false);
          setSelectedOffer(null);
        }}
        mode="edit"
        offerId={selectedOffer?.id}
        initialValues={selectedOffer ? getEditInitialValues(selectedOffer) : undefined}
        isImmutable={selectedOffer?.offerStatus !== "draft" && !!selectedOffer?.hasAcceptedCases}
      />

    </div>
  );
};

export default OffersMarket;
