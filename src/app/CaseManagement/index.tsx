import { Avatar, Button, Input, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiEye, FiFilter, FiSearch, FiUser } from "react-icons/fi";
import { LuClock3 } from "react-icons/lu";
import { useNavigate } from "react-router";

type CaseStatus = "Processing" | "Signature" | "Data Collected" | "Completed";
type UtilityType = "Electric" | "Gas" | "Internet";

type CaseRow = {
  id: string;
  customer: string;
  type: "Switch" | "Transfer" | "Takeover";
  utility: UtilityType;
  supplier: string;
  status: CaseStatus;
  sla: string;
  operator: string;
};

const caseStatusColor: Record<CaseStatus, string> = {
  Processing: "blue",
  Signature: "gold",
  "Data Collected": "default",
  Completed: "green",
};

const caseData: CaseRow[] = [
  {
    id: "#1234",
    customer: "Mario Rossi",
    type: "Switch",
    utility: "Electric",
    supplier: "Enel",
    status: "Processing",
    sla: "15d",
    operator: "Giuseppe Verdi",
  },
  {
    id: "#1235",
    customer: "Giulia Bianchi",
    type: "Transfer",
    utility: "Gas",
    supplier: "Eni",
    status: "Signature",
    sla: "8d",
    operator: "Maria Ferrari",
  },
  {
    id: "#1236",
    customer: "Luca Ferrari",
    type: "Switch",
    utility: "Internet",
    supplier: "Fastweb",
    status: "Data Collected",
    sla: "3d",
    operator: "Giuseppe Verdi",
  },
  {
    id: "#1237",
    customer: "Anna Verde",
    type: "Takeover",
    utility: "Electric",
    supplier: "A2A",
    status: "Completed",
    sla: "45d",
    operator: "Maria Ferrari",
  },
];

const CaseManagement = () => {
  const navigate = useNavigate();

  const columns: ColumnsType<CaseRow> = [
    { title: "CASE ID", dataIndex: "id", key: "id", width: 110, render: (value) => <span className="font-semibold text-brand">{value}</span> },
    {
      title: "CUSTOMER",
      dataIndex: "customer",
      key: "customer",
      width: 180,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Avatar size={22} className="bg-gray-100 text-owngray">
            <FiUser className="h-3 w-3" />
          </Avatar>
          <span className="text-sm text-brand">{value}</span>
        </div>
      ),
    },
    { title: "TYPE", dataIndex: "type", key: "type", width: 100 },
    {
      title: "UTILITY",
      dataIndex: "utility",
      key: "utility",
      width: 100,
      render: (value: UtilityType) => <Tag className="rounded border-0 bg-gray-100 text-xs text-brand">{value}</Tag>,
    },
    { title: "SUPPLIER", dataIndex: "supplier", key: "supplier", width: 100 },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (value: CaseStatus) => (
        <Tag color={caseStatusColor[value]} className="rounded-full! px-2.5! pb-0.5! text-xs font-semibold">
          {value}
        </Tag>
      ),
      align: "center",
    },
    {
      title: "SLA",
      dataIndex: "sla",
      key: "sla",
      width: 90,
      render: (value: string) => (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
          <LuClock3 className="h-3.5 w-3.5" />
          {value}
        </span>
      ),
    },
    { title: "OPERATOR", dataIndex: "operator", key: "operator", width: 150 },
    {
      title: "ACTIONS",
      key: "actions",
      width: 95,
      render: (_, record) => (
        <Tooltip title="Details">
          <Button
            type="link"
            size="small"
            icon={<FiEye className="h-3.5 w-3.5" />}
            onClick={() => navigate(`/case-management/${encodeURIComponent(record.id.replace("#", ""))}`)}
          >
            Details
          </Button>
        </Tooltip>
      ),
      align: "center",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h3 className="text-2xl font-semibold text-brand">Case Management</h3>
          <p className="text-sm text-owngray">Complete case workflow management</p>
        </div>
        <div className="rounded-2xl border border-cborder/60 bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Input
              allowClear
              placeholder="Search case by ID, customer, supplier..."
              prefix={<FiSearch className="text-owngray" />}
            />
            <Button icon={<FiFilter className="h-4 w-4" />}>Filters</Button>
          </div>
          <Table<CaseRow>
            rowKey="id"
            columns={columns}
            dataSource={caseData}
            pagination={false}
            size="middle"
            scroll={{ x: 1000 }}
          />
        </div>
      </section>
    </div>
  );
};

export default CaseManagement;
