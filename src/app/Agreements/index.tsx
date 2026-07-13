import { Button, Input, Select, Spin, Empty, Switch, Table, Tag, Modal, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiEdit2, FiEye, FiPlus, FiSearch, FiTag, FiTrash2 } from "react-icons/fi";
import { LuCalendarDays } from "react-icons/lu";
import { useState } from "react";
import { useNavigate } from "react-router";
import dayjs from "dayjs";
import {
  useGetAgreementsAdminQuery,
  useToggleAgreementStatusMutation,
  useDeleteAgreementMutation,
  type IAgreement,
} from "../../redux/features/Agreements/agreementApi";
import { debounce } from "../../utils/debounce";
import AgreementFormModal from "./AgreementFormModal";

const { Option } = Select;

const Agreements = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>();
  const [audienceFilter, setAudienceFilter] = useState<string | undefined>();

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<IAgreement | null>(null);

  const { data, isLoading } = useGetAgreementsAdminQuery({
    page,
    limit: 20,
    search: search || undefined,
    isActive: statusFilter,
    targetAudience: audienceFilter,
  });
  const [toggleStatus] = useToggleAgreementStatusMutation();
  const [deleteAgreement] = useDeleteAgreementMutation();

  const agreements = data?.data || [];
  const meta = data?.meta;

  const handleSearch = debounce((value: string) => {
    setSearch(value);
    setPage(1);
  }, 400);

  const handleToggleStatus = async (agreement: IAgreement) => {
    try {
      await toggleStatus({ id: agreement.id, isActive: !agreement.isActive }).unwrap();
      message.success("Status updated");
    } catch {
      message.error("Failed to update status");
    }
  };

  const handleDelete = (agreement: IAgreement) => {
    Modal.confirm({
      title: "Delete agreement?",
      content: `"${agreement.partnerName}" will be removed.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        try {
          await deleteAgreement(agreement.id).unwrap();
          message.success("Agreement deleted");
        } catch {
          message.error("Failed to delete");
        }
      },
    });
  };

  const openEdit = (record: IAgreement) => {
    setEditingAgreement(record);
    setEditOpen(true);
  };

  const editInitialValues = editingAgreement
    ? {
        title: editingAgreement.title,
        partnerName: editingAgreement.partnerName,
        partnerLogoUrl: editingAgreement.partnerLogoUrl || undefined,
        termsUrl: editingAgreement.termsUrl || undefined,
        address: editingAgreement.address || undefined,
        discountDescription: editingAgreement.discountDescription || undefined,
        description: editingAgreement.description || undefined,
        validFrom: editingAgreement.validFrom ? dayjs(editingAgreement.validFrom) : undefined,
        validUntil: editingAgreement.validUntil ? dayjs(editingAgreement.validUntil) : undefined,
        targetAudience: editingAgreement.targetAudience,
        sortOrder: editingAgreement.sortOrder,
        isActive: editingAgreement.isActive,
      }
    : undefined;

  const columns: ColumnsType<IAgreement> = [
    {
      title: "PARTNER",
      key: "partner",
      width: 220,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          {record.partnerLogoUrl ? (
            <img src={record.partnerLogoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-lg font-bold text-slate-500">
              {record.partnerName[0]}
            </span>
          )}
          <span className="font-semibold text-slate-700">{record.partnerName}</span>
        </div>
      ),
    },
    {
      title: "TITLE",
      dataIndex: "title",
      key: "title",
      width: 200,
      render: (value: string) => <span className="text-sm text-slate-700">{value}</span>,
    },
    {
      title: "DISCOUNT",
      dataIndex: "discountDescription",
      key: "discount",
      render: (value: string) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
          <FiTag className="text-emerald-500" />
          {value || "—"}
        </span>
      ),
    },
    {
      title: "VALIDITY",
      key: "validity",
      width: 160,
      render: (_, record) => (
        <div className="text-sm text-slate-500">
          <p className="inline-flex items-center gap-1.5">
            <LuCalendarDays className="h-3.5 w-3.5" />
            {new Date(record.validFrom).toLocaleDateString("it-IT")}
          </p>
          {record.validUntil && <p>{new Date(record.validUntil).toLocaleDateString("it-IT")}</p>}
        </div>
      ),
    },
    {
      title: "AUDIENCE",
      dataIndex: "targetAudience",
      key: "targetAudience",
      width: 120,
      render: (value: string) => (
        <Tag className="rounded-full border-0 bg-slate-100 px-2.5 text-xs font-semibold capitalize text-slate-600">
          {value}
        </Tag>
      ),
    },
    {
      title: "STATUS",
      key: "status",
      width: 120,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Switch size="small" checked={record.isActive} onChange={() => handleToggleStatus(record)} />
          <span className={`text-sm font-medium ${record.isActive ? "text-emerald-600" : "text-slate-500"}`}>
            {record.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <div className="flex items-center gap-1">
          <Button type="text" size="small" icon={<FiEye className="text-indigo-500" />} onClick={() => navigate(`/agreements/${record.id}`)} />
          <Button type="text" size="small" icon={<FiEdit2 className="text-blue-500" />} onClick={() => openEdit(record)} />
          <Button type="text" size="small" icon={<FiTrash2 className="text-rose-400" />} onClick={() => handleDelete(record)} />
        </div>
      ),
      align: "center",
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      <div className="mb-4 flex flex-col gap-3 border-b border-cborder/45 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-brand">Agreements</h2>
          <p className="text-sm text-owngray">Management of partnerships and discounts for customers</p>
        </div>
        <Button
          type="primary"
          icon={<FiPlus />}
          className="h-10 rounded-lg border-0 bg-[#8b85f6] px-5 font-semibold hover:bg-[#7a74e5]"
          onClick={() => setAddOpen(true)}
        >
          Add Agreement
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-white p-4">
          <div className="min-w-[240px] flex-1">
            <Input
              placeholder="Search by partner, title..."
              prefix={<FiSearch className="mr-2 text-slate-400" />}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-11 rounded-xl border-slate-200"
            />
          </div>
          <Select
            allowClear
            placeholder="Status"
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            className="w-36 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl"
          >
            <Option value={true}>Active</Option>
            <Option value={false}>Inactive</Option>
          </Select>
          <Select
            allowClear
            placeholder="Audience"
            onChange={(v) => { setAudienceFilter(v); setPage(1); }}
            className="w-36 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl"
          >
            <Option value="personal">Personal</Option>
            <Option value="business">Business</Option>
            <Option value="both">Both</Option>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24"><Spin size="large" /></div>
        ) : agreements.length === 0 ? (
          <div className="py-24"><Empty description="No agreements found" /></div>
        ) : (
          <Table<IAgreement>
            rowKey="id"
            columns={columns}
            dataSource={agreements}
            pagination={{
              current: page,
              pageSize: meta?.limit || 20,
              total: meta?.total || 0,
              onChange: setPage,
              className: "p-4",
            }}
            scroll={{ x: 1200 }}
            className="[&_.ant-table-thead_th]:bg-slate-50 [&_.ant-table-thead_th]:text-[11px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:text-slate-500 [&_.ant-table-thead_th]:tracking-wider [&_.ant-table-cell]:py-3"
          />
        )}
      </div>

      {/* Create Modal */}
      <AgreementFormModal isOpen={addOpen} onClose={() => setAddOpen(false)} />

      {/* Edit Modal */}
      <AgreementFormModal
        isOpen={editOpen}
        onClose={() => { setEditOpen(false); setEditingAgreement(null); }}
        mode="edit"
        agreementId={editingAgreement?.id}
        initialValues={editInitialValues}
      />
    </div>
  );
};

export default Agreements;
