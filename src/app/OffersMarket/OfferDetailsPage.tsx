import { Button, Empty, Spin, Tag } from "antd";
import { FiArrowLeft, FiExternalLink } from "react-icons/fi";
import { LuDownload, LuLeaf, LuMail, LuPhone, LuUser, LuGlobe } from "react-icons/lu";
import { useNavigate, useParams } from "react-router";
import { server_origin } from "../../config";
import { useGetOfferByIdQuery } from "../../redux/features/Offers/offerApi";

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

const InfoRow = ({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) => (
  <div className="flex items-start gap-3">
    {icon && (
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        {icon}
      </div>
    )}
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-700">{value || "\u2014"}</p>
    </div>
  </div>
);

const formatDate = (date: string | null | undefined) =>
  date ? new Date(date).toLocaleDateString("it-IT") : "\u2014";

const formatCurrency = (val: number | null | undefined) =>
  val != null ? `\u20AC ${Number(val).toFixed(2)}` : "\u2014";

const formatPrice = (val: number | null | undefined) =>
  val != null ? `\u20AC ${Number(val).toFixed(6)}` : "\u2014";

const formatDuration = (days: number) => {
  if (days >= 30) {
    const months = Math.floor(days / 30);
    return `${months} month${months !== 1 ? "s" : ""}`;
  }
  return `${days} day${days !== 1 ? "s" : ""}`;
};

const OfferDetailsPage = () => {
  const navigate = useNavigate();
  const { offerId } = useParams();
  const { data: detail, isLoading } = useGetOfferByIdQuery(offerId!, { skip: !offerId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spin size="large" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Empty description="Offer not found" />
        <Button onClick={() => navigate("/offers-market")} icon={<FiArrowLeft />} className="rounded-lg">
          Back to Offers
        </Button>
      </div>
    );
  }

  const sc = statusColors[detail.offerStatus || "draft"];
  const supplier = detail.supplier;

  return (
    <div className="space-y-5 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button
        type="link"
        className="h-auto px-0 text-slate-500 hover:text-slate-800"
        icon={<FiArrowLeft />}
        onClick={() => navigate("/offers-market")}
      >
        Back to Offers
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 border border-indigo-100">
            <LuLeaf className="h-7 w-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800">{detail.name}</h1>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10px] font-bold capitalize ${sc.bg} ${sc.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                {detail.offerStatus}
              </span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              {detail.offerCode && <span className="font-medium text-slate-400">{detail.offerCode}</span>}
              {detail.offerCode && supplier?.name && <span className="text-slate-300">|</span>}
              {supplier?.name && (
                <button
                  type="button"
                  onClick={() => navigate(`/suppliers/${supplier.id}`)}
                  className="text-indigo-500 hover:text-indigo-600 hover:underline"
                >
                  {supplier.name}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Commodity",
            value: (
              <Tag className={`mt-0.5 border-0 rounded font-bold text-[10px] px-2 py-0 uppercase ${energyTagColor[detail.energyType] || ""}`}>
                {detail.energyType}
              </Tag>
            ),
          },
          { label: "Market Type", value: <span className="capitalize">{detail.marketType}</span> },
          { label: "Contract Duration", value: formatDuration(detail.contractDurationDays) },
          { label: "Target", value: <span className="capitalize">{detail.target}</span> },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-400">{c.label}</p>
            <p className="mt-1 text-lg font-bold text-slate-800">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Pricing */}
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">Pricing</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow label="Fixed Monthly Fee" value={formatCurrency(detail.fixedMonthlyFee)} />
            <InfoRow label="Activation Cost" value={formatCurrency(detail.activationCost)} />
            {detail.marketType === "variable" || detail.marketType === "indexed" ? (
              <InfoRow label="Spread" value={formatPrice(detail.spread)} />
            ) : (
              <>
                {(detail.energyType === "electricity" || detail.energyType === "dual") && (
                  <InfoRow label="Price / kWh" value={formatPrice(detail.pricePerKwh)} />
                )}
                {(detail.energyType === "gas" || detail.energyType === "dual") && (
                  <InfoRow label="Price / SMc" value={formatPrice(detail.pricePerSmc)} />
                )}
              </>
            )}
          </div>
        </div>

        {/* Contract & Validity */}
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">Contract & Validity</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow label="Valid From" value={formatDate(detail.validFrom)} />
            <InfoRow label="Valid Until" value={formatDate(detail.validUntil)} />
            <InfoRow label="Contract Duration" value={formatDuration(detail.contractDurationDays)} />
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
            <InfoRow label="Version" value={detail.version} />
          </div>
        </div>

        {/* Documents & Links */}
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">Documents & Links</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow
              label="Terms & Conditions"
              value={
                detail.termsUrl ? (
                  <a
                    href={
                      detail.termsUrl.startsWith("http")
                        ? detail.termsUrl
                        : `${server_origin}/${detail.termsUrl.replace(/^\//, "")}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-500 hover:text-indigo-600"
                  >
                    View & Download <LuDownload className="h-3 w-3" />
                  </a>
                ) : null
              }
            />
            <InfoRow
              label="Economic Conditions"
              value={
                detail.economicConditionsUrl ? (
                  <a
                    href={
                      detail.economicConditionsUrl.startsWith("http")
                        ? detail.economicConditionsUrl
                        : `${server_origin}/${detail.economicConditionsUrl.replace(/^\//, "")}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-500 hover:text-indigo-600"
                  >
                    View & Download <LuDownload className="h-3 w-3" />
                  </a>
                ) : null
              }
            />
          </div>
        </div>

        {/* Supplier Details */}
        {supplier && (
          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">Supplier Details</h3>
              <Button
                type="link"
                size="small"
                className="text-indigo-500 hover:text-indigo-600 p-0 h-auto"
                onClick={() => navigate(`/suppliers/${supplier.id}`)}
              >
                View Full Profile <FiExternalLink className="ml-1 inline h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-4">
              <InfoRow icon={<LuUser className="h-4 w-4" />} label="Supplier Name" value={supplier.name} />
              {supplier.legalName && (
                <InfoRow icon={<LuUser className="h-4 w-4" />} label="Legal Name" value={supplier.legalName} />
              )}
              {supplier.contactName && (
                <InfoRow icon={<LuUser className="h-4 w-4" />} label="Contact Person" value={supplier.contactName} />
              )}
              {supplier.contactEmail && (
                <InfoRow icon={<LuMail className="h-4 w-4" />} label="Email" value={supplier.contactEmail} />
              )}
              {supplier.contactPhone && (
                <InfoRow icon={<LuPhone className="h-4 w-4" />} label="Phone" value={supplier.contactPhone} />
              )}
              {supplier.website && (
                <InfoRow
                  icon={<LuGlobe className="h-4 w-4" />}
                  label="Website"
                  value={
                    <a href={supplier.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-500 hover:text-indigo-600">
                      {supplier.website.replace(/^https?:\/\//, "")} <FiExternalLink className="h-3 w-3" />
                    </a>
                  }
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Highlights */}
      {detail.highlights && detail.highlights.length > 0 && (
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-slate-800">Highlights</h3>
          <div className="flex flex-wrap gap-2">
            {detail.highlights.map((h, i) => (
              <Tag key={i} className="rounded-full border-slate-200 px-3 py-1 text-xs text-slate-600">
                {h}
              </Tag>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {detail.description && (
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-slate-800">Description</h3>
          <p className="text-sm leading-relaxed text-slate-600">{detail.description}</p>
        </div>
      )}

      {/* Timestamps */}
      <div className="flex flex-wrap gap-6 text-[11px] text-slate-400 px-1">
        <span>Created: {formatDate(detail.createdAt)}</span>
        <span>Updated: {formatDate(detail.updatedAt)}</span>
      </div>
    </div>
  );
};

export default OfferDetailsPage;
