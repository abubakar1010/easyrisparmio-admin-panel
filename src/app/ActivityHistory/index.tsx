import { useState } from "react";
import { Input, Select, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiSearch } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import {
  useGetActivityLogsQuery,
  type IActivityLog,
} from "../../redux/features/ActivityLog/activityLogApi";
import { debounce } from "../../utils/debounce";

const entityTypeColors: Record<string, string> = {
  user: "blue",
  bill: "orange",
  contract: "green",
  case: "purple",
  offer: "cyan",
  supplier: "magenta",
  document: "geekblue",
};

const ENTITY_TYPE_OPTIONS = [
  { label: "All", value: "" },
  { label: "User", value: "user" },
  { label: "Bill", value: "bill" },
  { label: "Contract", value: "contract" },
  { label: "Case", value: "case" },
  { label: "Offer", value: "offer" },
  { label: "Supplier", value: "supplier" },
];

const ActivityHistory = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("");

  const { data, isLoading } = useGetActivityLogsQuery({
    page,
    limit: 20,
    search: search || undefined,
    entityType: entityType || undefined,
  });

  const logs = data?.data || [];
  const meta = data?.meta;

  const handleSearch = debounce((value: string) => {
    setSearch(value);
    setPage(1);
  }, 400);

  const columns: ColumnsType<IActivityLog> = [
    {
      title: t("activity_history.action"),
      dataIndex: "action",
      key: "action",
      render: (action: string) => (
        <span className="font-semibold text-gray-800">{action}</span>
      ),
    },
    {
      title: t("activity_history.entity_type"),
      dataIndex: "entityType",
      key: "entityType",
      width: 130,
      render: (type: string) => (
        <Tag color={entityTypeColors[type] || "default"}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Tag>
      ),
    },
    {
      title: t("activity_history.entity_id"),
      dataIndex: "entityId",
      key: "entityId",
      width: 160,
      render: (id: string | null) =>
        id ? (
          <span className="font-mono text-xs text-gray-500">
            {id.substring(0, 8)}...
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
    {
      title: t("activity_history.admin"),
      key: "user",
      width: 180,
      render: (_: unknown, record: IActivityLog) =>
        record.user
          ? `${record.user.firstName} ${record.user.lastName}`
          : "—",
    },
    {
      title: t("activity_history.time"),
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date: string) => {
        const d = new Date(date);
        return (
          <span className="text-sm text-gray-500">
            {d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          {t("activity_history.title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t("activity_history.description")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          prefix={<FiSearch className="text-gray-400" />}
          placeholder={t("activity_history.search_placeholder")}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
          className="w-72"
        />
        <Select
          value={entityType}
          onChange={(value) => {
            setEntityType(value);
            setPage(1);
          }}
          options={ENTITY_TYPE_OPTIONS}
          className="w-40"
          placeholder={t("activity_history.filter_entity_type")}
        />
      </div>

      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: meta?.page || 1,
          pageSize: meta?.limit || 20,
          total: meta?.total || 0,
          showSizeChanger: false,
          onChange: (p) => setPage(p),
        }}
        locale={{
          emptyText: t("activity_history.no_data"),
        }}
      />
    </div>
  );
};

export default ActivityHistory;
