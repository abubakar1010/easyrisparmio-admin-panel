import { Card, Input, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiCheckCircle, FiClock, FiCreditCard, FiEye, FiSearch, FiXCircle } from "react-icons/fi";
import { LuDollarSign, LuMail } from "react-icons/lu";

type PaymentStatus = "Completed" | "Pending" | "Failed";
type PaymentMethod = "Card" | "Bank Transfer" | "Postal Order";

type PaymentRow = {
  key: string;
  transaction: string;
  id: string;
  user: string;
  service: string;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  date: string;
};

const rows: PaymentRow[] = [
  {
    key: "1",
    transaction: "TXN001234",
    id: "ID: 1",
    user: "John Doe",
    service: "Electricity",
    amount: "$450.00",
    method: "Card",
    status: "Completed",
    date: "2026-04-05",
  },
  {
    key: "2",
    transaction: "TXN001235",
    id: "ID: 2",
    user: "Jane Smith",
    service: "Gas",
    amount: "$320.50",
    method: "Bank Transfer",
    status: "Pending",
    date: "2026-04-04",
  },
  {
    key: "3",
    transaction: "TXN001236",
    id: "ID: 3",
    user: "Mike Johnson",
    service: "Water",
    amount: "$180.00",
    method: "Postal Order",
    status: "Completed",
    date: "2026-04-03",
  },
  {
    key: "4",
    transaction: "TXN001237",
    id: "ID: 4",
    user: "Sarah Williams",
    service: "Internet",
    amount: "$560.75",
    method: "Card",
    status: "Failed",
    date: "2026-04-02",
  },
  {
    key: "5",
    transaction: "TXN001238",
    id: "ID: 5",
    user: "Tom Brown",
    service: "Electricity",
    amount: "$290.00",
    method: "Card",
    status: "Pending",
    date: "2026-04-01",
  },
];

const statusStyles: Record<PaymentStatus, string> = {
  Completed: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-700",
  Failed: "bg-rose-100 text-rose-600",
};

const Payments = () => {
  const columns: ColumnsType<PaymentRow> = [
    {
      title: "TRANSACTION",
      key: "transaction",
      render: (_, record) => (
        <div>
          <p className="font-medium text-slate-700">{record.transaction}</p>
          <p className="text-xs text-slate-400">{record.id}</p>
        </div>
      ),
      width: 150,
    },
    { title: "USER", dataIndex: "user", key: "user", width: 150 },
    { title: "SERVICE", dataIndex: "service", key: "service", width: 120 },
    { title: "AMOUNT", dataIndex: "amount", key: "amount", width: 120 },
    {
      title: "METHOD",
      dataIndex: "method",
      key: "method",
      render: (value: PaymentMethod) => (
        <span className="inline-flex items-center gap-2 text-slate-600">
          {value === "Card" ? (
            <FiCreditCard className="h-3.5 w-3.5" />
          ) : value === "Bank Transfer" ? (
            <LuDollarSign className="h-3.5 w-3.5" />
          ) : (
            <LuMail className="h-3.5 w-3.5" />
          )}
          {value}
        </span>
      ),
      width: 150,
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (value: PaymentStatus) => (
        <Tag className={`rounded-full border-0 px-2.5 py-0 text-xs font-medium ${statusStyles[value]}`}>{value}</Tag>
      ),
      width: 120,
    },
    { title: "DATE", dataIndex: "date", key: "date", width: 130 },
    {
      title: "ACTIONS",
      key: "actions",
      render: (_, record) => (
        <div className="flex items-center gap-4">
          <button type="button" className="text-blue-500 hover:text-blue-600">
            <FiEye className="h-3.5 w-3.5" />
          </button>
          {record.status === "Completed" ? (
            <button type="button" className="text-orange-500 hover:text-orange-600">
              Refund
            </button>
          ) : record.status === "Pending" ? (
            <>
              <button type="button" className="text-emerald-500 hover:text-emerald-600">
                <FiCheckCircle className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="text-rose-500 hover:text-rose-600">
                <FiXCircle className="h-3.5 w-3.5" />
              </button>
            </>
          ) : null}
        </div>
      ),
      width: 140,
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      <div className="mb-4 border-b border-cborder/45 pb-4">
        <h2 className="text-xl font-semibold text-brand">Payments & Transactions</h2>
        <p className="text-sm text-owngray">Manage all payments and financial transactions</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Total Revenue",
            value: "$630.00",
            icon: <LuDollarSign className="h-6 w-6 text-emerald-600" />,
            iconBg: "bg-emerald-100",
          },
          {
            title: "Pending",
            value: "2",
            icon: <FiClock className="h-5 w-5 text-amber-600" />,
            iconBg: "bg-amber-100",
          },
          {
            title: "Completed",
            value: "2",
            icon: <FiCheckCircle className="h-5 w-5 text-emerald-600" />,
            iconBg: "bg-emerald-100",
          },
          {
            title: "Failed",
            value: "1",
            icon: <FiXCircle className="h-5 w-5 text-rose-600" />,
            iconBg: "bg-rose-100",
          },
        ].map((item) => (
          <Card key={item.title} className="rounded-2xl border-slate-200 shadow-sm [&_.ant-card-body]:p-4">
            <div className="flex gap-3">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${item.iconBg}`}>
                {item.icon}
              </span>
              <div>
                <p className="text-4xl font-semibold leading-none text-slate-800">{item.value}</p>
                <p className="text-base text-slate-500">{item.title}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Input
          className="h-11 max-w-[500px] rounded-xl border-slate-200 text-base"
          prefix={<FiSearch className="mr-2 text-slate-400" />}
          placeholder="Search by user or transaction ID..."
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Table<PaymentRow>
          rowKey="key"
          columns={columns}
          dataSource={rows}
          pagination={false}
          scroll={{ x: 1050 }}
          className="[&_.ant-table-thead_th]:bg-slate-50 [&_.ant-table-thead_th]:text-[11px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:tracking-widest [&_.ant-table-thead_th]:text-slate-500 [&_.ant-table-cell]:py-4"
        />
      </div>
    </div>
  );
};

export default Payments;
