import { Button, Card, InputNumber, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiClock, FiDollarSign, FiSettings, FiUpload, FiUsers } from "react-icons/fi";

type PendingReward = {
  key: string;
  referrer: string;
  referrerEmail: string;
  invitedFriend: string;
  invitedEmail: string;
  inviteDate: string;
  status: string;
};

type ApprovedReward = {
  key: string;
  referrer: string;
  referrerEmail: string;
  activatedFriend: string;
  activatedEmail: string;
  activationDate: string;
  reward: string;
  status: "Paid" | "To Be Paid";
};

const pendingRewards: PendingReward[] = [
  {
    key: "1",
    referrer: "Paolo Ferrari",
    referrerEmail: "p.ferrari@email.it",
    invitedFriend: "Sofia Blu",
    invitedEmail: "s.blu@email.it",
    inviteDate: "10/04/2026",
    status: "Pending Activation",
  },
];

const approvedRewards: ApprovedReward[] = [
  {
    key: "1",
    referrer: "Mario Rossi",
    referrerEmail: "mario.rossi@email.it",
    activatedFriend: "Luca Verdi",
    activatedEmail: "luca.v@email.it",
    activationDate: "01/03/2026",
    reward: "EUR10",
    status: "Paid",
  },
  {
    key: "2",
    referrer: "Giulia Bianchi",
    referrerEmail: "g.bianchi@email.it",
    activatedFriend: "Anna Neri",
    activatedEmail: "a.neri@email.it",
    activationDate: "05/04/2026",
    reward: "EUR10",
    status: "To Be Paid",
  },
];

const Referrals = () => {
  const pendingColumns: ColumnsType<PendingReward> = [
    {
      title: "REFERRER",
      key: "referrer",
      render: (_, record) => (
        <div>
          <p className="font-semibold text-slate-700">{record.referrer}</p>
          <p className="text-xs text-slate-400">{record.referrerEmail}</p>
        </div>
      ),
    },
    {
      title: "INVITED FRIEND",
      key: "invitedFriend",
      render: (_, record) => (
        <div>
          <p className="font-semibold text-slate-700">{record.invitedFriend}</p>
          <p className="text-xs text-slate-400">{record.invitedEmail}</p>
        </div>
      ),
    },
    {
      title: "INVITE DATE",
      dataIndex: "inviteDate",
      key: "inviteDate",
      render: (value: string) => (
        <span className="inline-flex items-center gap-1 text-slate-500">
          <FiClock className="h-3.5 w-3.5" />
          {value}
        </span>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (value: string) => (
        <Tag className="rounded-full border-0 bg-slate-500 px-2.5 py-0 text-[10px] font-semibold text-white">
          {value}
        </Tag>
      ),
    },
  ];

  const approvedColumns: ColumnsType<ApprovedReward> = [
    {
      title: "REFERRER",
      key: "referrer",
      render: (_, record) => (
        <div>
          <p className="font-semibold text-slate-700">{record.referrer}</p>
          <p className="text-xs text-slate-400">{record.referrerEmail}</p>
        </div>
      ),
    },
    {
      title: "ACTIVATED FRIEND",
      key: "activatedFriend",
      render: (_, record) => (
        <div>
          <p className="font-semibold text-slate-700">{record.activatedFriend}</p>
          <p className="text-xs text-slate-400">{record.activatedEmail}</p>
        </div>
      ),
    },
    {
      title: "ACTIVATION DATE",
      dataIndex: "activationDate",
      key: "activationDate",
      render: (value: string) => (
        <span className="inline-flex items-center gap-1 text-slate-500">
          <FiClock className="h-3.5 w-3.5 text-emerald-500" />
          {value}
        </span>
      ),
    },
    {
      title: "REWARD",
      dataIndex: "reward",
      key: "reward",
      render: (value: string) => (
        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
          <FiDollarSign className="h-3.5 w-3.5 text-amber-500" />
          {value}
        </span>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (value: ApprovedReward["status"]) =>
        value === "Paid" ? (
          <Tag className="rounded-full border-0 bg-emerald-500 px-2.5 py-0 text-[10px] font-semibold text-white">
            Paid
          </Tag>
        ) : (
          <Tag className="rounded-full border-0 bg-amber-500 px-2.5 py-0 text-[10px] font-semibold text-white">
            To Be Paid
          </Tag>
        ),
    },
    {
      title: "ACTIONS",
      key: "actions",
      render: (_, record) =>
        record.status === "Paid" ? null : (
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" className="text-blue-500 hover:text-blue-600">
              Generate Voucher
            </button>
            <button type="button" className="text-emerald-500 hover:text-emerald-600">
              Mark as Paid
            </button>
          </div>
        ),
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      <div className="mb-4 flex flex-col gap-3 border-b border-cborder/45 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-brand">Referrals and Rewards</h2>
          <p className="text-sm text-owngray">Invite a Friend Programme</p>
        </div>
        <Button icon={<FiUpload className="h-4 w-4" />} className="h-10 rounded-lg border-slate-200 px-4 font-medium">
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Total Invites", value: "3", icon: <FiUsers className="h-4 w-4" /> },
          { title: "Activations", value: "2", icon: <FiUsers className="h-4 w-4" /> },
          { title: "Issued Vouchers", value: "2", icon: <FiUsers className="h-4 w-4" /> },
          { title: "Total Paid", value: "EUR10", icon: <FiDollarSign className="h-4 w-4" /> },
        ].map((item) => (
          <Card key={item.title} className="rounded-2xl border-slate-200/70 shadow-sm [&_.ant-card-body]:p-4">
            <div className="mb-2 inline-flex items-center gap-2 text-slate-500">
              {item.icon}
              <span className="text-sm">{item.title}</span>
            </div>
            <p className="text-4xl font-semibold leading-none text-slate-700">{item.value}</p>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-slate-200/70 shadow-sm [&_.ant-card-body]:p-4 sm:[&_.ant-card-body]:p-5">
        <div className="mb-3 inline-flex items-center gap-2 text-lg font-semibold text-slate-700">
          <FiSettings className="h-4 w-4" />
          Reward Configuration
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-sm text-slate-500">Amazon Voucher Amount</p>
            <div className="flex items-center gap-2">
              <InputNumber min={1} defaultValue={10} className=" rounded-lg" size="large" />
              <span className="text-sm text-slate-400">EUR per completed activation</span>
            </div>
          </div>
          <Button type="primary" className="h-10 rounded-lg border-0 bg-emerald-500 px-6 font-semibold hover:bg-emerald-600">
            Save
          </Button>
        </div>
      </Card>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <h3 className="text-xl font-semibold text-slate-700">Pending Rewards (1)</h3>
          <p className="mt-0.5 text-sm text-slate-400">Invited friends who have not yet completed activation</p>
        </div>
        <Table<PendingReward>
          rowKey="key"
          columns={pendingColumns}
          dataSource={pendingRewards}
          pagination={false}
          scroll={{ x: 760 }}
          className="[&_.ant-table-thead_th]:bg-slate-50 [&_.ant-table-thead_th]:text-[11px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:text-slate-500 [&_.ant-table-thead_th]:tracking-wider [&_.ant-table-cell]:py-3"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <h3 className="text-xl font-semibold text-slate-700">Approved Rewards (1)</h3>
          <p className="mt-0.5 text-sm text-slate-400">
            Users who have completed activation and are eligible for the EUR10 voucher
          </p>
        </div>
        <Table<ApprovedReward>
          rowKey="key"
          columns={approvedColumns}
          dataSource={approvedRewards}
          pagination={false}
          scroll={{ x: 980 }}
          className="[&_.ant-table-thead_th]:bg-slate-50 [&_.ant-table-thead_th]:text-[11px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:text-slate-500 [&_.ant-table-thead_th]:tracking-wider [&_.ant-table-cell]:py-3"
        />
      </div>
    </div>
  );
};

export default Referrals;
