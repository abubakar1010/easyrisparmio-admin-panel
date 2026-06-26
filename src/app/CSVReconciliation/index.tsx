import { Button, Card, Table, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiAlertTriangle, FiUpload } from "react-icons/fi";

type ReconciliationRow = {
  key: string;
  csvPod: string;
  csvStatus: string;
  possibleMatch: string;
  action: string;
};

const unmatchedRows: ReconciliationRow[] = [
  {
    key: "1",
    csvPod: "IT001E199999991",
    csvStatus: "Paid",
    possibleMatch: "No match",
    action: "none",
  },
  {
    key: "2",
    csvPod: "IT001E188888872",
    csvStatus: "Paid",
    possibleMatch: "Similar to IT001E88888872 (Check)",
    action: "similar",
  },
];

const CSVReconciliation = () => {
  const columns: ColumnsType<ReconciliationRow> = [
    {
      title: "CSV POD",
      dataIndex: "csvPod",
      key: "csvPod",
      className: "text-slate-700",
    },
    {
      title: "CSV STATUS",
      dataIndex: "csvStatus",
      key: "csvStatus",
      className: "text-slate-600",
    },
    {
      title: "POSSIBLE MATCH",
      dataIndex: "possibleMatch",
      key: "possibleMatch",
      render: (value: string) => (
        <span className={value.includes("Similar") ? "text-blue-500" : "text-slate-400"}>{value}</span>
      ),
    },
    {
      title: "ACTION",
      key: "action",
      render: () => (
        <div className="flex items-center justify-end gap-4">
          <button type="button" className="text-emerald-500 hover:text-emerald-600">
            Match
          </button>
          <button type="button" className="text-rose-500 hover:text-rose-600">
            Ignore
          </button>
        </div>
      ),
      align: "right",
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-brand">CSV Reconciliation</h2>
        <p className="text-sm text-owngray">
          Supplier CSV import (POD + Status). Unmatched PODs go to error list.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-slate-200/70 shadow-sm [&_.ant-card-body]:p-4 sm:[&_.ant-card-body]:p-5">
          <Upload.Dragger
            showUploadList={false}
            className="rounded-xl bg-slate-50/40 p-7"
          >
            <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <FiUpload className="h-5 w-5" />
            </div>
            <p className="text-base font-semibold text-slate-700">Upload reconciliation CSV</p>
            <p className="mt-1 text-xs text-slate-400">Expected format: POD, Status (Paid/Unpaid)</p>
            <Button
              type="primary"
              className="mt-4 h-9 rounded-lg border-0 bg-emerald-500 px-5 font-medium hover:bg-emerald-600"
            >
              Select file
            </Button>
          </Upload.Dragger>
        </Card>

        <Card className="rounded-2xl border-slate-200/70 shadow-sm [&_.ant-card-body]:p-4 sm:[&_.ant-card-body]:p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-700">Last import — Eni Plenitude</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-400">Import date</span>
              <span className="text-slate-600">04/18/2026 09:15</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-400">Total rows</span>
              <span className="text-slate-600">247</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-400">Successful matches</span>
              <span className="font-medium text-emerald-500">235 (95%)</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-400">PODs not found</span>
              <span className="font-medium text-rose-500">12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total value</span>
              <span className="text-slate-700">EUR 14,180</span>
            </div>
          </div>
          <button type="button" className="mt-4 text-sm font-medium text-rose-500 hover:text-rose-600">
            View 12 errors →
          </button>
        </Card>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
          <h3 className="text-base font-semibold text-slate-700">PODs not found — manual review required</h3>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-rose-500">
            <FiAlertTriangle className="h-3.5 w-3.5" />
            2 errors
          </span>
        </div>
        <Table<ReconciliationRow>
          rowKey="key"
          columns={columns}
          dataSource={unmatchedRows}
          pagination={false}
          scroll={{ x: 820 }}
          className="[&_.ant-table-thead_th]:bg-slate-50 [&_.ant-table-thead_th]:text-[11px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:text-slate-500 [&_.ant-table-thead_th]:tracking-wider [&_.ant-table-cell]:py-3"
        />
      </div>
    </div>
  );
};

export default CSVReconciliation;
