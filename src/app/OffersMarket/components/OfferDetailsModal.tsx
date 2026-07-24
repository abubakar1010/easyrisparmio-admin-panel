import { Modal, Spin, Tag } from "antd";
import { useEffect } from "react";
import { FiExternalLink } from "react-icons/fi";
import { LuLeaf } from "react-icons/lu";
import {
  useLazyGetOfferByIdQuery,
  type IOffer,
} from "../../../redux/features/Offers/offerApi";

type OfferDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  offer: IOffer | null;
};

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  expiring: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  draft: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  expired: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400" },
  archived: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
};

const energyTagColor: Record<string, string> = {
  electricity: "bg-emerald-50 text-emerald-600",
  gas: "bg-blue-50 text-blue-600",
  dual: "bg-purple-50 text-purple-600",
};

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-0.5 text-sm font-medium text-slate-700">{value || "—"}</p>
  </div>
);

const formatDate = (date: string | null | undefined) =>
  date ? new Date(date).toLocaleDateString("it-IT") : "—";

const formatCurrency = (val: number | null | undefined) =>
  val != null ? `\u20AC ${Number(val).toFixed(2)}` : "—";

const formatPrice = (val: number | null | undefined) =>
  val != null ? `\u20AC ${Number(val).toFixed(6)}` : "—";

export const OfferDetailsModal = ({ open, onClose, offer }: OfferDetailsModalProps) => {
  const [triggerGetOffer, { data: offerDetail, isLoading, isFetching }] =
    useLazyGetOfferByIdQuery();

  useEffect(() => {
    if (open && offer?.id) {
      triggerGetOffer(offer.id);
    }
  }, [open, offer?.id, triggerGetOffer]);

  const detail = offerDetail || offer;
  const loading = (isLoading || isFetching) && !detail;

  if (!detail && !loading) return null;

  const sc = statusColors[detail?.offerStatus || "draft"];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      centered
      destroyOnClose
      title={null}
      className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-0"
    >
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spin size="large" />
        </div>
      ) : detail ? (
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-slate-800 truncate">{detail.name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {detail.offerCode && (
                  <span className="text-xs font-medium text-slate-400">{detail.offerCode}</span>
                )}
                <span className="text-xs text-slate-300">|</span>
                <span className="text-xs text-slate-400">
                  {detail.supplier?.name || "Unknown supplier"}
                </span>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold capitalize ${sc.bg} ${sc.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
              {detail.offerStatus}
            </span>
          </div>

          <hr className="my-4 border-slate-100" />

          {/* Type & Target */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Commodity
              </p>
              <Tag
                className={`mt-1 border-0 rounded font-bold text-[10px] px-2 py-0 uppercase ${
                  energyTagColor[detail.energyType] || ""
                }`}
              >
                {detail.energyType}
              </Tag>
            </div>
            <InfoRow label="Market Type" value={<span className="capitalize">{detail.marketType}</span>} />
            <InfoRow label="Target" value={<span className="capitalize">{detail.target}</span>} />
          </div>

          <hr className="my-4 border-slate-100" />

          {/* Pricing */}
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Pricing</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <InfoRow label="Fixed Monthly Fee" value={formatCurrency(detail.fixedMonthlyFee)} />
            <InfoRow label="Activation Cost" value={formatCurrency(detail.activationCost)} />
            {(detail.energyType === "electricity" || detail.energyType === "dual") && (
              <InfoRow label="Price / kWh" value={formatPrice(detail.pricePerKwh)} />
            )}
            {(detail.energyType === "gas" || detail.energyType === "dual") && (
              <InfoRow label="Price / SMc" value={formatPrice(detail.pricePerSmc)} />
            )}
          </div>

          <hr className="my-4 border-slate-100" />

          {/* Contract & Validity */}
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Contract & Validity
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <InfoRow
              label="Contract Duration"
              value={`${detail.contractDurationMonths} month${detail.contractDurationMonths !== 1 ? "s" : ""}`}
            />
            <InfoRow label="Valid From" value={formatDate(detail.validFrom)} />
            <InfoRow label="Valid Until" value={formatDate(detail.validUntil)} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <InfoRow
              label="Green Energy"
              value={
                detail.isGreenEnergy ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <LuLeaf className="h-3.5 w-3.5" /> Yes
                  </span>
                ) : (
                  "No"
                )
              }
            />
            <InfoRow
              label="Terms & Conditions"
              value={
                detail.termsUrl ? (
                  <a
                    href={detail.termsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-500 hover:text-indigo-600"
                  >
                    View <FiExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <InfoRow label="Version" value={detail.version} />
          </div>

          {/* Highlights */}
          {detail.highlights && detail.highlights.length > 0 && (
            <>
              <hr className="my-4 border-slate-100" />
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Highlights
              </p>
              <div className="flex flex-wrap gap-1.5">
                {detail.highlights.map((h, i) => (
                  <Tag key={i} className="rounded-full border-slate-200 text-xs text-slate-600">
                    {h}
                  </Tag>
                ))}
              </div>
            </>
          )}

          {/* Description */}
          {detail.description && (
            <>
              <hr className="my-4 border-slate-100" />
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Description
              </p>
              <p className="text-sm leading-relaxed text-slate-600">{detail.description}</p>
            </>
          )}

          {/* Timestamps */}
          <hr className="my-4 border-slate-100" />
          <div className="flex flex-wrap gap-6 text-[11px] text-slate-400">
            <span>Created: {formatDate(detail.createdAt)}</span>
            <span>Updated: {formatDate(detail.updatedAt)}</span>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
