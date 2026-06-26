import { Card, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiDownload, FiEye } from "react-icons/fi";

type VersionRow = {
  key: string;
  version: string;
  startValidity: string;
  endValidity: string;
  createdBy: string;
  date: string;
};

const rows: VersionRow[] = [
  {
    key: "1",
    version: "v2.4 (Latest)",
    startValidity: "01/01/2025",
    endValidity: "31/12/2025",
    createdBy: "Marco Rossi",
    date: "16/05/2025 14:32",
  },
  {
    key: "2",
    version: "v2.3",
    startValidity: "01/06/2024",
    endValidity: "31/12/2024",
    createdBy: "Marco Rossi",
    date: "22/05/2024 09:15",
  },
];

const columns: ColumnsType<VersionRow> = [
  { title: "Version", dataIndex: "version", key: "version" },
  { title: "Start Validity", dataIndex: "startValidity", key: "startValidity" },
  { title: "End Validity", dataIndex: "endValidity", key: "endValidity" },
  { title: "Created By", dataIndex: "createdBy", key: "createdBy" },
  { title: "Date", dataIndex: "date", key: "date" },
  {
    title: "Actions",
    key: "actions",
    render: () => (
      <div className="flex items-center gap-3">
        <button type="button" className="text-indigo-500 hover:text-indigo-600"><FiEye /></button>
        <button type="button" className="text-slate-500 hover:text-slate-700"><FiDownload /></button>
      </div>
    ),
  },
];

export const VersionHistoryTable = () => {
  return (
    <Card className="my-5! rounded-2xl border-slate-200/70 shadow-sm [&_.ant-card-body]:p-0" title={<span className="font-semibold text-slate-700">Price List Versioni History</span>}>
      <Table<VersionRow>
        rowKey="key"
        columns={columns}
        dataSource={rows}
        pagination={false}
        scroll={{ x: 900 }}
        className="[&_.ant-table-thead_th]:bg-slate-50 [&_.ant-table-thead_th]:text-xs [&_.ant-table-thead_th]:font-semibold [&_.ant-table-thead_th]:text-slate-600 [&_.ant-table-cell]:py-3 [&_.ant-table-cell]:text-sm"
      />
    </Card>
  );
};
