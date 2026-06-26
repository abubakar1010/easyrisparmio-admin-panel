import { Card, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiRefreshCw, FiSliders } from "react-icons/fi";

type Row = {
  key: string;
  consumption: string;
  acquisitionPerPod: string;
  acquisitionPerMwh: string;
  recurrentBase12: string;
  recurrentPrime12: string;
  recurrentGreen12: string;
  recurrentBase13: string;
  recurrentPrime13: string;
  recurrentGreen13: string;
};

const data: Row[] = [
  { key: "1", consumption: "0 - 5 MWh", acquisitionPerPod: "EUR 45.00", acquisitionPerMwh: "-", recurrentBase12: "EUR 1.25", recurrentPrime12: "EUR 0.50", recurrentGreen12: "EUR 0.15", recurrentBase13: "EUR 1.00", recurrentPrime13: "EUR 0.40", recurrentGreen13: "EUR 0.10" },
  { key: "2", consumption: "5 - 15 MWh", acquisitionPerPod: "EUR 85.00", acquisitionPerMwh: "EUR 2.00", recurrentBase12: "EUR 2.10", recurrentPrime12: "EUR 0.75", recurrentGreen12: "EUR 0.25", recurrentBase13: "EUR 1.80", recurrentPrime13: "EUR 0.60", recurrentGreen13: "EUR 0.20" },
  { key: "3", consumption: "15 - 50 MWh", acquisitionPerPod: "EUR 120.00", acquisitionPerMwh: "EUR 4.50", recurrentBase12: "EUR 4.50", recurrentPrime12: "EUR 1.20", recurrentGreen12: "EUR 0.45", recurrentBase13: "EUR 4.00", recurrentPrime13: "EUR 1.00", recurrentGreen13: "EUR 0.35" },
  { key: "4", consumption: "50 - 100 MWh", acquisitionPerPod: "EUR 210.00", acquisitionPerMwh: "EUR 8.00", recurrentBase12: "EUR 8.50", recurrentPrime12: "EUR 2.50", recurrentGreen12: "EUR 0.85", recurrentBase13: "EUR 7.20", recurrentPrime13: "EUR 2.00", recurrentGreen13: "EUR 0.70" },
];

const columns: ColumnsType<Row> = [
  { title: "Annual Consumption", dataIndex: "consumption", key: "consumption", width: 170 },
  { title: "EUR/POD", dataIndex: "acquisitionPerPod", key: "acquisitionPerPod", width: 110 },
  { title: "EUR/MWh", dataIndex: "acquisitionPerMwh", key: "acquisitionPerMwh", width: 110 },
  { title: "Base", dataIndex: "recurrentBase12", key: "recurrentBase12", width: 95 },
  { title: "Opz. Prime", dataIndex: "recurrentPrime12", key: "recurrentPrime12", width: 95 },
  { title: "Energia Verde", dataIndex: "recurrentGreen12", key: "recurrentGreen12", width: 110 },
  { title: "Base", dataIndex: "recurrentBase13", key: "recurrentBase13", width: 95 },
  { title: "Opz. Prime", dataIndex: "recurrentPrime13", key: "recurrentPrime13", width: 95 },
  { title: "Energia Verde", dataIndex: "recurrentGreen13", key: "recurrentGreen13", width: 110 },
];

export const ProvisionStructureTable = () => {
  return (
    <Card
      className="rounded-2xl border-slate-200/70 shadow-sm [&_.ant-card-body]:p-0"
      title={<span className="font-semibold text-slate-700">Provision Structure</span>}
      extra={
        <div className="flex items-center gap-3 text-slate-500">
          <FiSliders className="h-4 w-4" />
          <FiRefreshCw className="h-4 w-4" />
        </div>
      }
    >
      <Table<Row>
        rowKey="key"
        columns={columns}
        dataSource={data}
        pagination={false}
        scroll={{ x: 1100 }}
        className="[&_.ant-table-thead_th]:bg-slate-50 [&_.ant-table-thead_th]:text-xs [&_.ant-table-thead_th]:font-semibold [&_.ant-table-thead_th]:text-slate-600 [&_.ant-table-cell]:py-3 [&_.ant-table-cell]:text-sm"
      />
    </Card>
  );
};
