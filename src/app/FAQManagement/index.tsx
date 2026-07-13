import { Button, Empty, Input, Modal, Select, Spin, Switch, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiEdit3, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import { useMemo, useState } from "react";
import AddEditFAQModal from "./components/AddEditFAQModal";
import {
  useGetAdminFaqsQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
  type IFaq,
} from "../../redux/features/Support/supportApi";
import { debounce } from "../../utils/debounce";

const audienceLabel: Record<string, string> = {
  both: "Both",
  personal: "Personal",
  business: "Business",
};

const audienceColor: Record<string, string> = {
  both: "blue",
  personal: "green",
  business: "purple",
};

const FAQManagement = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>();
  const [audienceFilter, setAudienceFilter] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<IFaq | null>(null);

  const { data: faqsData, isLoading, isFetching } = useGetAdminFaqsQuery({
    page,
    limit: 20,
    search: search || undefined,
    category: categoryFilter,
    isActive: statusFilter,
    targetAudience: audienceFilter,
  });

  const [createFaq, { isLoading: isCreating }] = useCreateFaqMutation();
  const [updateFaq, { isLoading: isUpdating }] = useUpdateFaqMutation();
  const [deleteFaq] = useDeleteFaqMutation();

  const faqs = faqsData?.data || [];
  const meta = faqsData?.meta;

  const existingCategories = useMemo(() => {
    const cats = new Set(faqs.map((f) => f.category));
    return Array.from(cats).sort();
  }, [faqs]);

  const handleSearch = debounce((value: string) => {
    setSearch(value);
    setPage(1);
  }, 400);

  const handleAddFAQ = () => {
    setSelectedFAQ(null);
    setModalVisible(true);
  };

  const handleEditFAQ = (faq: IFaq) => {
    setSelectedFAQ(faq);
    setModalVisible(true);
  };

  const handleSaveFAQ = async (values: {
    category: string;
    question: string;
    answer: string;
    sortOrder: number;
    isActive: boolean;
    locale: string;
    targetAudience: string;
  }) => {
    try {
      if (selectedFAQ) {
        await updateFaq({ id: selectedFAQ.id, data: values }).unwrap();
        message.success("FAQ updated successfully");
      } else {
        await createFaq(values).unwrap();
        message.success("FAQ created successfully");
      }
      setModalVisible(false);
    } catch (err: any) {
      message.error(err?.data?.message?.[0] || "Failed to save FAQ");
    }
  };

  const handleToggleActive = async (faq: IFaq) => {
    try {
      await updateFaq({ id: faq.id, data: { isActive: !faq.isActive } }).unwrap();
      message.success(`FAQ ${faq.isActive ? "deactivated" : "activated"}`);
    } catch {
      message.error("Failed to update FAQ status");
    }
  };

  const handleDeleteFAQ = (faqId: string) => {
    Modal.confirm({
      title: "Delete this FAQ?",
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        try {
          await deleteFaq(faqId).unwrap();
          message.success("FAQ deleted");
        } catch {
          message.error("Failed to delete FAQ");
        }
      },
    });
  };

  const columns: ColumnsType<IFaq> = [
    {
      title: "#",
      key: "index",
      width: 60,
      render: (_: any, __: IFaq, index: number) => (
        <span className="text-slate-400 text-sm">{(page - 1) * 20 + index + 1}</span>
      ),
    },
    {
      title: "QUESTION",
      dataIndex: "question",
      key: "question",
      width: 280,
      render: (value: string) => (
        <span className="text-slate-700 font-medium text-sm truncate block max-w-[280px]">{value}</span>
      ),
    },
    {
      title: "CATEGORY",
      dataIndex: "category",
      key: "category",
      width: 150,
      render: (value: string) => (
        <Tag className="rounded-full border-0 bg-slate-50 px-3 py-0.5 text-xs text-slate-600 font-semibold capitalize">
          {value}
        </Tag>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (isActive: boolean, record: IFaq) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleActive(record)}
          size="small"
          className={isActive ? "bg-emerald-500!" : ""}
        />
      ),
      align: "center",
    },
    {
      title: "AUDIENCE",
      dataIndex: "targetAudience",
      key: "targetAudience",
      width: 120,
      render: (value: string) => (
        <Tag color={audienceColor[value] || "default"} className="rounded-full border-0 px-3 py-0.5 text-xs font-semibold capitalize">
          {audienceLabel[value] || value}
        </Tag>
      ),
      align: "center",
    },
    {
      title: "ORDER",
      dataIndex: "sortOrder",
      key: "sortOrder",
      width: 80,
      render: (value: number) => <span className="text-slate-500 text-sm">{value}</span>,
      align: "center",
    },
    {
      title: "UPDATED",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 130,
      render: (value: string) => (
        <span className="text-xs text-slate-400">
          {value ? new Date(value).toLocaleDateString("it-IT") : "—"}
        </span>
      ),
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 100,
      render: (_: any, record: IFaq) => (
        <div className="flex items-center gap-2">
          <Button
            type="text"
            size="small"
            icon={<FiEdit3 className="text-blue-500 h-4 w-4" />}
            onClick={() => handleEditFAQ(record)}
          />
          <Button
            type="text"
            size="small"
            icon={<FiTrash2 className="text-red-400 h-4 w-4" />}
            onClick={() => handleDeleteFAQ(record.id)}
          />
        </div>
      ),
      align: "center",
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 border-b border-cborder/45 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">FAQ Management</h2>
          <p className="text-sm text-slate-400 font-medium">Create, edit, and manage frequently asked questions</p>
        </div>
        <Button
          type="primary"
          icon={<FiPlus />}
          className="h-10 rounded-lg border-0 bg-[#8b85f6] px-5 font-semibold hover:bg-[#7a74e5]"
          onClick={handleAddFAQ}
        >
          Add FAQ
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <Input
              className="h-11 rounded-xl border-slate-100 bg-slate-50/30 text-[15px]"
              prefix={<FiSearch className="mr-2 text-slate-300 h-5 w-5" />}
              placeholder="Search FAQs by question..."
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Select
            allowClear
            placeholder="Category"
            onChange={(v) => { setCategoryFilter(v); setPage(1); }}
            className="w-44 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl"
          >
            {existingCategories.map((cat) => (
              <Select.Option key={cat} value={cat}>
                <span className="capitalize">{cat}</span>
              </Select.Option>
            ))}
          </Select>
          <Select
            allowClear
            placeholder="Status"
            onChange={(v) => { setStatusFilter(v === "active" ? true : v === "inactive" ? false : undefined); setPage(1); }}
            className="w-36 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl"
          >
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select>
          <Select
            allowClear
            placeholder="Audience"
            onChange={(v) => { setAudienceFilter(v); setPage(1); }}
            className="w-40 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl"
          >
            <Select.Option value="both">Both</Select.Option>
            <Select.Option value="personal">Personal</Select.Option>
            <Select.Option value="business">Business</Select.Option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Spin size="large" />
          </div>
        ) : faqs.length === 0 ? (
          <div className="py-24">
            <Empty description="No FAQs found" />
          </div>
        ) : (
          <Table<IFaq>
            rowKey="id"
            columns={columns}
            dataSource={faqs}
            loading={isFetching && !isLoading}
            scroll={{ x: 1000 }}
            pagination={{
              current: page,
              pageSize: meta?.limit || 20,
              total: meta?.total || 0,
              onChange: setPage,
              showSizeChanger: false,
              className: "p-4 mt-0 border-t border-slate-100",
            }}
            className="[&_.ant-table-thead_th]:bg-slate-50/50 [&_.ant-table-thead_th]:text-[11px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:text-slate-400 [&_.ant-table-thead_th]:tracking-widest [&_.ant-table-cell]:px-5 [&_.ant-table-cell]:py-4"
          />
        )}
      </div>

      <AddEditFAQModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSave={handleSaveFAQ}
        initialValues={selectedFAQ}
        isLoading={isCreating || isUpdating}
        existingCategories={existingCategories}
      />
    </div>
  );
};

export default FAQManagement;
