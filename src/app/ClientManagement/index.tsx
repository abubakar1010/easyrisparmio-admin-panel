import { useCallback, useState } from "react";
import { Avatar, Button, Input, Pagination, Segmented, Select, Space, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { HiOutlineUserPlus } from "react-icons/hi2";
import { FiSearch, FiEye, FiEdit3, FiZap, FiLock, FiKey, FiUnlock } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { ClientDetailsModal } from "./components/ClientDetailsModal";
import { ClientFormModal } from "./components/ClientFormModal";
import type { CustomerStatus, CustomerType, IClient, IClientQuery } from "./types";
import { roleToType, statusClass, statusToDisplay, displayToStatus, typeToRole } from "./types";
import { useGetClientsQuery, useToggleClientStatusMutation, useResetClientPasswordMutation } from "../../redux/features/Users/clientApi";
import { sweetAlertConfirmation } from "../../lib/helpers/sweetAlertConfirmation";
import { successAlert, errorAlert } from "../../lib/helpers/alert";
import { debounce } from "../../utils/debounce";

const statusTranslationKeys: Record<string, string> = {
  Active: "client_management.status_active",
  Pending: "client_management.status_pending",
  Blocked: "client_management.status_blocked",
  Inactive: "client_management.status_inactive",
};

const ClientManagement = () => {
  const { t } = useTranslation();
  const [queryParams, setQueryParams] = useState<IClientQuery>({ page: 1, limit: 20 });
  const [segment, setSegment] = useState<"All" | CustomerType>("All");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | undefined>();
  const [addOpen, setAddOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null);

  const { data, isLoading, isFetching } = useGetClientsQuery(queryParams);
  const [toggleStatus] = useToggleClientStatusMutation();
  const [resetPassword] = useResetClientPasswordMutation();

  const clients = data?.data || [];
  const meta = data?.meta;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setQueryParams((prev) => ({ ...prev, page: 1, search: value || undefined }));
    }, 500),
    [],
  );

  const handleSegmentChange = (value: "All" | CustomerType) => {
    setSegment(value);
    setQueryParams((prev) => ({
      ...prev,
      page: 1,
      role: value === "All" ? undefined : typeToRole[value],
    }));
  };

  const handleStatusFilter = (value: CustomerStatus | undefined) => {
    setStatusFilter(value);
    setQueryParams((prev) => ({
      ...prev,
      page: 1,
      status: value ? displayToStatus[value] : undefined,
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  const openDetails = (client: IClient) => {
    setSelectedClient(client);
    setDetailsOpen(true);
  };

  const openEdit = (client: IClient) => {
    setSelectedClient(client);
    setEditOpen(true);
  };

  const handleToggleStatus = (client: IClient) => {
    const isBlocking = client.status === "active";
    sweetAlertConfirmation({
      title: isBlocking ? t("client_management.block_user") : t("client_management.unblock_user"),
      object: isBlocking ? t("client_management.block_confirm") : t("client_management.unblock_confirm"),
      okay: isBlocking ? t("client_management.block") : t("client_management.unblock"),
      conBtnColor: isBlocking ? "red" : "#7061ED",
      func: async () => {
        try {
          await toggleStatus(client.id).unwrap();
          successAlert({
            message: isBlocking
              ? t("client_management.user_blocked_successfully")
              : t("client_management.user_unblocked_successfully"),
          });
        } catch (err) {
          errorAlert({ error: err as { data?: { message?: string } } });
        }
      },
    });
  };

  const handleResetPassword = (client: IClient) => {
    sweetAlertConfirmation({
      title: t("client_management.reset_password"),
      object: `${t("client_management.send_password_reset")} ${client.email}`,
      okay: t("client_management.send_reset"),
      conBtnColor: "#7061ED",
      func: async () => {
        try {
          await resetPassword(client.id).unwrap();
          successAlert({ message: t("client_management.password_reset_sent") });
        } catch (err) {
          errorAlert({ error: err as { data?: { message?: string } } });
        }
      },
    });
  };

  const columns: ColumnsType<IClient> = [
    {
      title: t("client_management.name"),
      key: "name",
      width: 220,
      render: (_, record) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="bg-indigo-100 text-indigo-600">
            {record.firstName?.charAt(0) || record.email.charAt(0)}
          </Avatar>
          <span className="font-medium text-brand">
            {record.firstName} {record.lastName}
          </span>
        </div>
      ),
    },
    { title: t("client_management.email_label"), dataIndex: "email", key: "email", width: 210, ellipsis: true },
    { title: t("client_management.phone"), dataIndex: "phone", key: "phone", width: 160 },
    {
      title: t("client_management.type"),
      key: "type",
      width: 110,
      render: (_, record) => {
        const typeKey = roleToType[record.role];
        return (
          <span className="text-gray-700">
            {typeKey ? t(`client_management.${typeKey.toLowerCase()}`) : record.role}
          </span>
        );
      },
      align: "center",
    },
    {
      title: t("client_management.supplies"),
      key: "supplies",
      width: 100,
      render: (_, record) => (
        <span className="inline-flex items-center gap-1.5 font-medium text-brand">
          <FiZap className="h-3.5 w-3.5 text-primary" />
          {record.billCount ?? 0}
        </span>
      ),
      align: "center",
    },
    {
      title: t("common.status"),
      key: "status",
      width: 100,
      render: (_, record) => {
        const displayStatus = statusToDisplay[record.status] || record.status;
        return (
          <Tag color={statusClass[displayStatus as CustomerStatus] || "default"} className="rounded-full px-2.5 py-0.5 text-xs font-semibold">
            {t(statusTranslationKeys[displayStatus] || displayStatus)}
          </Tag>
        );
      },
      align: "center",
    },
    {
      title: t("common.actions"),
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title={t("client_management.view_user")}>
            <Button type="text" size="small" icon={<FiEye className="h-4 w-4" />} onClick={() => openDetails(record)} />
          </Tooltip>
          <Tooltip title={t("client_management.quick_edit")}>
            <Button type="text" size="small" icon={<FiEdit3 className="h-4 w-4" />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Tooltip title={record.status === "suspended" ? t("client_management.unblock") : t("client_management.block")}>
            <Button
              type="text"
              size="small"
              icon={record.status === "suspended" ? <FiUnlock className="h-4 w-4" /> : <FiLock className="h-4 w-4" />}
              onClick={() => handleToggleStatus(record)}
            />
          </Tooltip>
          <Tooltip title={t("client_management.reset_password")}>
            <Button type="text" size="small" icon={<FiKey className="h-4 w-4" />} onClick={() => handleResetPassword(record)} />
          </Tooltip>
        </Space>
      ),
      align: "center",
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 border-b border-cborder/45 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-brand">{t("client_management.users_management")}</h2>
          <p className="text-sm text-owngray">{t("client_management.manage_customers_supplies")}</p>
        </div>
        <Button
          type="primary"
          className="inline-flex w-full items-center justify-center gap-2 sm:w-auto"
          icon={<HiOutlineUserPlus className="h-4 w-4" />}
          onClick={() => setAddOpen(true)}
        >
          {t("client_management.add_new_user")}
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented<"All" | CustomerType>
            value={segment}
            onChange={handleSegmentChange}
            options={[
              { value: "All", label: t("client_management.all") },
              { value: "Private", label: t("client_management.private") },
              { value: "Business", label: t("client_management.business") },
            ]}
          />
          <Select
            allowClear
            placeholder={t("common.status")}
            value={statusFilter}
            onChange={handleStatusFilter}
            className="min-w-[130px]"
            options={[
              { value: "Active", label: t("client_management.status_active") },
              { value: "Pending", label: t("client_management.status_pending") },
              { value: "Blocked", label: t("client_management.status_blocked") },
              { value: "Inactive", label: t("client_management.status_inactive") },
            ]}
          />
        </div>
        <Input
          allowClear
          value={search}
          onChange={handleSearchChange}
          prefix={<FiSearch className="text-owngray" />}
          placeholder={t("client_management.search_customers")}
          className="w-full xl:w-[280px]!"
        />
      </div>

      <div className="shadow-sm rounded-xl overflow-hidden pb-4 bg-white border border-cborder/45">
        <Table<IClient>
          rowKey="id"
          columns={columns}
          dataSource={clients}
          size="middle"
          pagination={false}
          scroll={{ x: 980 }}
          loading={isLoading || isFetching}
        />
        <div className="mt-3 flex items-center justify-between px-4">
          <p className="text-xs text-gray-500">
            {t("client_management.showing_of_customers", { count: clients.length, total: meta?.total ?? 0 })}
          </p>
          {meta && meta.totalPages > 1 && (
            <Pagination
              current={meta.page}
              pageSize={meta.limit}
              total={meta.total}
              size="small"
              showSizeChanger={false}
              onChange={(page) => setQueryParams((prev) => ({ ...prev, page }))}
            />
          )}
        </div>
      </div>

      <ClientFormModal open={addOpen} onClose={() => setAddOpen(false)} mode="add" />
      <ClientDetailsModal open={detailsOpen} onClose={() => setDetailsOpen(false)} client={selectedClient} />
      <ClientFormModal open={editOpen} onClose={() => setEditOpen(false)} mode="edit" client={selectedClient} />
    </div>
  );
};

export default ClientManagement;
