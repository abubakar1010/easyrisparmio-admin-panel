import { useMemo, useState } from "react";
import { Avatar, Button, Input, Segmented, Select, Space, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { HiOutlineUserPlus } from "react-icons/hi2";
import { FiSearch, FiEye, FiEdit3, FiZap, FiLock, FiKey } from "react-icons/fi";
import { ClientDetailsModal } from "./components/ClientDetailsModal";
import { ClientFormModal } from "./components/ClientFormModal";
import type { ClientRow, CustomerStatus, CustomerType } from "./types";
import { statusClass } from "./types";

const clients: ClientRow[] = [
  { id: 1, name: "Mario Rossi", email: "mario.rossi@email.com", phone: "+39 340 123 4567", type: "Private", supplies: 2, status: "Active", operator: "Anna Bianchi" },
  { id: 2, name: "Tech Solutions SRL", email: "info@techsolutions.it", phone: "+39 02 1234567", type: "Business", supplies: 5, status: "Active", operator: "Marco Verdi" },
  { id: 3, name: "Laura Ferrari", email: "laura.ferrari@email.com", phone: "+39 345 678 9012", type: "Private", supplies: 1, status: "Pending", operator: "Anna Bianchi" },
  { id: 4, name: "Green Energy Corp", email: "contact@greenenergy.com", phone: "+39 06 9876543", type: "Business", supplies: 8, status: "Active", operator: "Marco Verdi" },
  { id: 5, name: "Giuseppe Conte", email: "giuseppe.conte@email.com", phone: "+39 333 456 7890", type: "Private", supplies: 0, status: "Blocked", operator: "Sofia Romano" },
  { id: 6, name: "Innovative Systems", email: "admin@innosys.it", phone: "+39 011 234567", type: "Business", supplies: 3, status: "Active", operator: "Sofia Romano" },
  { id: 7, name: "Francesca Russo", email: "francesca.russo@email.com", phone: "+39 348 901 2345", type: "Private", supplies: 1, status: "Active", operator: "Anna Bianchi" },
  { id: 8, name: "Smart Industries", email: "info@smartind.com", phone: "+39 02 8765432", type: "Business", supplies: 4, status: "Pending", operator: "Marco Verdi" },
];

const ClientManagement = () => {
  const [segment, setSegment] = useState<"All" | CustomerType>("All");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [addOpen, setAddOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);

  const filtered = useMemo(() => {
    return clients.filter((item) => {
      const bySegment = segment === "All" ? true : item.type === segment;
      const byType = typeFilter ? item.type === typeFilter : true;
      const byStatus = statusFilter ? item.status === statusFilter : true;
      const bySearch = search
        ? `${item.name} ${item.email} ${item.phone}`.toLowerCase().includes(search.toLowerCase())
        : true;
      return bySegment && byType && byStatus && bySearch;
    });
  }, [segment, search, typeFilter, statusFilter]);

  const openDetails = (client: ClientRow) => {
    setSelectedClient(client);
    setDetailsOpen(true);
  };

  const openEdit = (client: ClientRow) => {
    setSelectedClient(client);
    setEditOpen(true);
  };

  const columns: ColumnsType<ClientRow> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 220,
      render: (_, record) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="bg-indigo-100 text-indigo-600">{record.name.charAt(0)}</Avatar>
          <span className="font-medium text-brand">{record.name}</span>
        </div>
      ),
    },
    { title: "Email", dataIndex: "email", key: "email", width: 210, ellipsis: true },
    { title: "Phone", dataIndex: "phone", key: "phone", width: 160 },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 110,
      render: (value: CustomerType) => <span className="text-gray-700">{value}</span>,
      align: "center",
    },
    {
      title: "Supplies",
      dataIndex: "supplies",
      key: "supplies",
      width: 100,
      render: (value: number) => (
        <span className="inline-flex items-center gap-1.5 font-medium text-brand">
          <FiZap className="h-3.5 w-3.5 text-primary" />
          {value}
        </span>
      ),
      align: "center",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (value: CustomerStatus) => (
        <Tag color={statusClass[value]} className="rounded-full px-2.5 py-0.5 text-xs font-semibold">
          {value}
        </Tag>
      ),
      align: "center",
    },
    { title: "Operator", dataIndex: "operator", key: "operator", width: 140 },
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
          <Tooltip title="Block / unblock">
            <Button type="text" size="small" icon={<FiLock className="h-4 w-4" />} />
          </Tooltip>
          <Tooltip title="Reset password">
            <Button type="text" size="small" icon={<FiKey className="h-4 w-4" />} />
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
          <Segmented<"All" | CustomerType> value={segment} onChange={setSegment} options={["All", "Private", "Business"]} />
          <Select allowClear placeholder="Type" value={typeFilter} onChange={(v) => setTypeFilter(v)} className="min-w-[130px]" options={[{ value: "Private", label: "Private" }, { value: "Business", label: "Business" }]} />
          <Select allowClear placeholder="Status" value={statusFilter} onChange={(v) => setStatusFilter(v)} className="min-w-[130px]" options={[{ value: "Active", label: "Active" }, { value: "Pending", label: "Pending" }, { value: "Blocked", label: "Blocked" }]} />
        </div>
        <Input allowClear value={search} onChange={(e) => setSearch(e.target.value)} prefix={<FiSearch className="text-owngray" />} placeholder="Search customers..." className="w-full xl:w-[280px]!" />
      </div>

      <div className="shadow-sm rounded-xl overflow-hidden pb-4 bg-white border border-cborder/45">
        <Table<ClientRow> rowKey="id" columns={columns} dataSource={filtered} size="middle" pagination={false} scroll={{ x: 980 }} />
        <p className="mt-3 px-4 text-xs text-gray-500">Showing {filtered.length} of {clients.length} customers</p>
      </div>

      <ClientFormModal open={addOpen} onClose={() => setAddOpen(false)} mode="add" />
      <ClientDetailsModal open={detailsOpen} onClose={() => setDetailsOpen(false)} client={selectedClient} />
      <ClientFormModal open={editOpen} onClose={() => setEditOpen(false)} mode="edit" client={selectedClient} />
    </div>
  );
};

export default ClientManagement;
