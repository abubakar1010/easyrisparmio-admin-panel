import { Button, Input, Select, Spin, Empty, Table, Tag, Switch, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiEdit3, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import { useState } from "react";
import {
  useGetAdminTopicsQuery,
  useCreateTopicMutation,
  useUpdateTopicMutation,
  useDeleteTopicMutation,
  type ISupportTopic,
} from "../../redux/features/Support/supportApi";
import { debounce } from "../../utils/debounce";
import AddEditTopicModal from "./components/AddEditTopicModal";

const SupportTopics = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<ISupportTopic | null>(null);

  const { data: topicsData, isLoading } = useGetAdminTopicsQuery({
    page,
    limit: 20,
    search: search || undefined,
    isActive: statusFilter,
  });

  const [createTopic, { isLoading: isCreating }] = useCreateTopicMutation();
  const [updateTopic] = useUpdateTopicMutation();
  const [deleteTopic] = useDeleteTopicMutation();

  const topics = topicsData?.data || [];
  const meta = topicsData?.meta;

  const handleSearch = debounce((value: string) => {
    setSearch(value);
    setPage(1);
  }, 400);

  const openCreateModal = () => {
    setSelectedTopic(null);
    setModalVisible(true);
  };

  const openEditModal = (topic: ISupportTopic) => {
    setSelectedTopic(topic);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedTopic(null);
  };

  const handleSave = async (values: {
    name: string;
    description?: string;
    sortOrder: number;
    icon?: string;
    isActive: boolean;
  }) => {
    try {
      if (selectedTopic) {
        await updateTopic({ id: selectedTopic.id, data: values }).unwrap();
        message.success("Topic updated successfully");
      } else {
        await createTopic(values).unwrap();
        message.success("Topic created successfully");
      }
      closeModal();
    } catch (err: any) {
      message.error(err?.data?.message?.[0] || "Failed to save topic");
    }
  };

  const handleToggleActive = async (topic: ISupportTopic) => {
    try {
      await updateTopic({
        id: topic.id,
        data: { isActive: !topic.isActive },
      }).unwrap();
      message.success(`Topic ${!topic.isActive ? "activated" : "deactivated"}`);
    } catch {
      message.error("Failed to update topic status");
    }
  };

  const handleDelete = async (topic: ISupportTopic) => {
    try {
      await deleteTopic(topic.id).unwrap();
      message.success("Topic deleted successfully");
    } catch (err: any) {
      message.error(
        err?.data?.message?.[0] || "Failed to delete topic"
      );
    }
  };

  const columns: ColumnsType<ISupportTopic> = [
    {
      title: "#",
      key: "index",
      width: 60,
      render: (_: any, __: ISupportTopic, index: number) => (
        <span className="font-bold text-slate-400">{(page - 1) * 20 + index + 1}</span>
      ),
    },
    {
      title: "NAME",
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (value: string) => (
        <span className="font-semibold text-slate-700">{value}</span>
      ),
    },
    {
      title: "DESCRIPTION",
      dataIndex: "description",
      key: "description",
      width: 250,
      render: (value: string | null) => (
        <span className="text-slate-500 truncate block max-w-[250px]">
          {value || "—"}
        </span>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (_: boolean, record: ISupportTopic) => (
        <Switch
          checked={record.isActive}
          onChange={() => handleToggleActive(record)}
          size="small"
        />
      ),
      align: "center",
    },
    {
      title: "TICKETS",
      dataIndex: "ticketCount",
      key: "ticketCount",
      width: 100,
      render: (value: number) => (
        <Tag className="rounded-full border-0 bg-slate-50 px-3 py-0.5 text-xs text-slate-600 font-semibold">
          {value ?? 0}
        </Tag>
      ),
      align: "center",
    },
    {
      title: "ORDER",
      dataIndex: "sortOrder",
      key: "sortOrder",
      width: 80,
      render: (value: number) => (
        <span className="text-slate-500">{value}</span>
      ),
      align: "center",
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 120,
      render: (_: any, record: ISupportTopic) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-[#8b85f6] hover:bg-[#8b85f6]/10 transition-colors"
            onClick={() => openEditModal(record)}
          >
            <FiEdit3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
            onClick={() => handleDelete(record)}
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 border-b border-cborder/45 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Support Topics</h2>
          <p className="text-sm text-slate-400 font-medium">Manage topics users can select when creating support requests</p>
        </div>
        <Button
          type="primary"
          icon={<FiPlus />}
          className="h-10 rounded-lg border-0 bg-[#8b85f6] px-5 font-semibold hover:bg-[#7a74e5]"
          onClick={openCreateModal}
        >
          Add Topic
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <Input
              className="h-11 rounded-xl border-slate-100 bg-slate-50/30 text-[15px]"
              prefix={<FiSearch className="mr-2 text-slate-300 h-5 w-5" />}
              placeholder="Search topics by name..."
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Select
            allowClear
            placeholder="Status"
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            className="w-40 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl"
          >
            <Select.Option value={true}>Active</Select.Option>
            <Select.Option value={false}>Inactive</Select.Option>
          </Select>
        </div>
      </div>

      {/* Topics Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Spin size="large" />
          </div>
        ) : topics.length === 0 ? (
          <div className="py-24">
            <Empty description="No topics found" />
          </div>
        ) : (
          <Table<ISupportTopic>
            rowKey="id"
            columns={columns}
            dataSource={topics}
            scroll={{ x: 800 }}
            pagination={{
              current: page,
              pageSize: meta?.limit || 20,
              total: meta?.total || 0,
              onChange: setPage,
              showSizeChanger: false,
              className: "p-4 mt-0 border-t border-slate-100",
            }}
            className="[&_.ant-table-thead_th]:bg-slate-50/50 [&_.ant-table-thead_th]:text-[11px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:text-slate-400 [&_.ant-table-thead_th]:tracking-widest [&_.ant-table-cell]:px-5 [&_.ant-table-cell]:py-5"
          />
        )}
      </div>

      {/* Add/Edit Modal */}
      <AddEditTopicModal
        visible={modalVisible}
        onCancel={closeModal}
        onSave={handleSave}
        initialValues={selectedTopic}
        isLoading={isCreating}
      />
    </div>
  );
};

export default SupportTopics;
