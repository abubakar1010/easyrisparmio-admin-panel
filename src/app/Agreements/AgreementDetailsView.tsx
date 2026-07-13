import { useState } from "react";
import { Button, Spin, Empty, Tag, Modal, Switch, message } from "antd";
import { FiArrowLeft, FiEdit2, FiExternalLink, FiTag, FiTrash2 } from "react-icons/fi";
import { LuCalendarDays, LuUsers, LuArrowUpDown } from "react-icons/lu";
import { useNavigate, useParams } from "react-router";
import dayjs from "dayjs";
import {
  useGetAgreementByIdQuery,
  useToggleAgreementStatusMutation,
  useDeleteAgreementMutation,
  type IAgreement,
} from "../../redux/features/Agreements/agreementApi";
import AgreementFormModal from "./AgreementFormModal";

const AgreementDetailsView = () => {
  const navigate = useNavigate();
  const { agreementId } = useParams();
  const { data: agreement, isLoading } = useGetAgreementByIdQuery(agreementId!, { skip: !agreementId });
  const [toggleStatus] = useToggleAgreementStatusMutation();
  const [deleteAgreement] = useDeleteAgreementMutation();

  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spin size="large" />
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Empty description="Agreement not found" />
        <Button onClick={() => navigate("/agreements")} icon={<FiArrowLeft />}>Back to Agreements</Button>
      </div>
    );
  }

  const handleToggleStatus = async () => {
    try {
      await toggleStatus({ id: agreement.id, isActive: !agreement.isActive }).unwrap();
      message.success("Status updated");
    } catch {
      message.error("Failed to update status");
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: "Delete agreement?",
      content: `"${agreement.partnerName}" will be permanently removed.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        try {
          await deleteAgreement(agreement.id).unwrap();
          message.success("Agreement deleted");
          navigate("/agreements");
        } catch {
          message.error("Failed to delete");
        }
      },
    });
  };

  const editInitialValues: Record<string, unknown> = {
    title: agreement.title,
    partnerName: agreement.partnerName,
    partnerLogoUrl: agreement.partnerLogoUrl || undefined,
    termsUrl: agreement.termsUrl || undefined,
    address: agreement.address || undefined,
    discountDescription: agreement.discountDescription || undefined,
    description: agreement.description || undefined,
    validFrom: agreement.validFrom ? dayjs(agreement.validFrom) : undefined,
    validUntil: agreement.validUntil ? dayjs(agreement.validUntil) : undefined,
    targetAudience: agreement.targetAudience,
    sortOrder: agreement.sortOrder,
    isActive: agreement.isActive,
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button
            type="link"
            className="mb-1 h-auto px-0 text-slate-500 hover:text-slate-800"
            icon={<FiArrowLeft />}
            onClick={() => navigate("/agreements")}
          >
            Back to Agreements
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">{agreement.title}</h1>
            <Tag className={`m-0 rounded-md border-0 px-2.5 py-0.5 text-xs font-semibold ${agreement.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
              {agreement.isActive ? "Active" : "Inactive"}
            </Tag>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Created: {new Date(agreement.createdAt).toLocaleDateString("it-IT")} &bull; Updated: {new Date(agreement.updatedAt).toLocaleDateString("it-IT")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="h-10 rounded-lg font-medium" icon={<FiEdit2 />} onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <Button danger className="h-10 rounded-lg font-medium" icon={<FiTrash2 />} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Partner Info Card */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Partner Information</h3>
            <div className="flex items-start gap-4">
              {agreement.partnerLogoUrl ? (
                <img src={agreement.partnerLogoUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-2xl font-bold text-slate-500">
                  {agreement.partnerName[0]}
                </span>
              )}
              <div className="flex-1">
                <h4 className="text-lg font-bold text-slate-800">{agreement.partnerName}</h4>
                {agreement.description && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{agreement.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Discount Card */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Discount Details</h3>
            {agreement.discountDescription ? (
              <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4">
                <FiTag className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <p className="text-sm font-medium text-emerald-800">{agreement.discountDescription}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No discount description provided.</p>
            )}

            {agreement.termsUrl && (
              <div className="mt-4">
                <a
                  href={agreement.termsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  <FiExternalLink className="h-4 w-4" />
                  View Terms & Conditions
                </a>
              </div>
            )}
          </div>

          {/* Validity Card */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Validity Period</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <LuCalendarDays className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Valid From</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-700">
                    {new Date(agreement.validFrom).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <LuCalendarDays className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Valid Until</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-700">
                    {agreement.validUntil
                      ? new Date(agreement.validUntil).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })
                      : "No end date"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Status Card */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Status</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${agreement.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                <span className={`text-sm font-semibold ${agreement.isActive ? "text-emerald-600" : "text-slate-500"}`}>
                  {agreement.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <Switch size="small" checked={agreement.isActive} onChange={handleToggleStatus} />
            </div>
          </div>

          {/* Details Card */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                  <LuUsers className="h-4 w-4 text-indigo-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Audience</p>
                  <p className="text-sm font-semibold capitalize text-slate-700">{agreement.targetAudience}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                  <LuArrowUpDown className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sort Order</p>
                  <p className="text-sm font-semibold text-slate-700">{agreement.sortOrder}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AgreementFormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        mode="edit"
        agreementId={agreement.id}
        initialValues={editInitialValues}
      />
    </div>
  );
};

export default AgreementDetailsView;
