import { useCallback, useState } from "react";
import { Avatar, Button, Input, Pagination, Segmented, Select, Space, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { HiOutlineUserPlus } from "react-icons/hi2";
import { FiSearch, FiEye, FiEdit3, FiZap, FiLock, FiKey, FiUnlock } from "react-icons/fi";
import { ClientDetailsModal } from "./components/ClientDetailsModal";
import { ClientFormModal } from "./components/ClientFormModal";
import type { CustomerStatus, CustomerType, IClient, IClientQuery } from "./types";
import { roleToType, statusClass, statusToDisplay, displayToStatus, typeToRole } from "./types";
import { useGetClientsQuery, useToggleClientStatusMutation, useResetClientPasswordMutation } from "../../redux/features/Users/clientApi";
import { sweetAlertConfirmation } from "../../lib/helpers/sweetAlertConfirmation";
import { successAlert, errorAlert } from "../../lib/helpers/alert";
import { debounce } from "../../utils/debounce";

const ClientManagement = () => {
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
      title: isBlocking ? "Block User" : "Unblock User",
      object: isBlocking ? "block this user" : "unblock this user",
      okay: isBlocking ? "Block" : "Unblock",
      conBtnColor: isBlocking ? "red" : "#7061ED",
      func: async () => {
        try {
          await toggleStatus(client.id).unwrap();
          successAlert({ message: `User ${isBlocking ? "blocked" : "unblocked"} successfully` });
        } catch (err) {
          errorAlert({ error: err as { data?: { message?: string } } });
        }
      },
    });
  };

  const handleResetPassword = (client: IClient) => {
    sweetAlertConfirmation({
      title: "Reset Password",
      object: `send a password reset email to ${client.email}`,
      okay: "Send Reset",
      conBtnColor: "#7061ED",
      func: async () => {
        try {
          await resetPassword(client.id).unwrap();
          successAlert({ message: "Password reset code sent to user email" });
        } catch (err) {
          errorAlert({ error: err as { data?: { message?: string } } });
        }
      },
    });
  };

  const columns: ColumnsType<IClient> = [
    {
      title: "Name",
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
    { title: "Email", dataIndex: "email", key: "email", width: 210, ellipsis: true },
    { title: "Phone", dataIndex: "phone", key: "phone", width: 160 },
    {
      title: "Type",
      key: "type",
      width: 110,
      render: (_, record) => <span className="text-gray-700">{roleToType[record.role] || record.role}</span>,
      align: "center",
    },
    {
      title: "Supplies",
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
      title: "Status",
      key: "status",
      width: 100,
      render: (_, record) => {
        const displayStatus = statusToDisplay[record.status] || record.status;
        return (
          <Tag color={statusClass[displayStatus as CustomerStatus] || "default"} className="rounded-full px-2.5 py-0.5 text-xs font-semibold">
            {displayStatus}
          </Tag>
        );
      },
      align: "center",
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title="View user">
            <Button type="text" size="small" icon={<FiEye className="h-4 w-4" />} onClick={() => openDetails(record)} />
          </Tooltip>
          <Tooltip title="Quick edit">
            <Button type="text" size="small" icon={<FiEdit3 className="h-4 w-4" />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Tooltip title={record.status === "suspended" ? "Unblock" : "Block"}>
            <Button
              type="text"
              size="small"
              icon={record.status === "suspended" ? <FiUnlock className="h-4 w-4" /> : <FiLock className="h-4 w-4" />}
              onClick={() => handleToggleStatus(record)}
            />
          </Tooltip>
          <Tooltip title="Reset password">
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
          <h2 className="text-xl font-semibold text-brand">Users Management</h2>
          <p className="text-sm text-owngray">Manage energy customers and their supplies</p>
        </div>
        <Button
          type="primary"
          className="inline-flex w-full items-center justify-center gap-2 sm:w-auto"
          icon={<HiOutlineUserPlus className="h-4 w-4" />}
          onClick={() => setAddOpen(true)}
        >
          Add new user
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented<"All" | CustomerType>
            value={segment}
            onChange={handleSegmentChange}
            options={["All", "Private", "Business"]}
          />
          <Select
            allowClear
            placeholder="Status"
            value={statusFilter}
            onChange={handleStatusFilter}
            className="min-w-[130px]"
            options={[
              { value: "Active", label: "Active" },
              { value: "Pending", label: "Pending" },
              { value: "Blocked", label: "Blocked" },
              { value: "Inactive", label: "Inactive" },
            ]}
          />
        </div>
        <Input
          allowClear
          value={search}
          onChange={handleSearchChange}
          prefix={<FiSearch className="text-owngray" />}
          placeholder="Search customers..."
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
            Showing {clients.length} of {meta?.total ?? 0} customers
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
