import { Button, Card, InputNumber, Spin, Empty, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiClock, FiDollarSign, FiSettings, FiUpload, FiUsers } from "react-icons/fi";
import {
  useGetReferralsQuery,
  useGetReferralStatsQuery,
  useUpdateReferralStatusMutation,
  type IReferral,
} from "../../redux/features/Referrals/referralApi";

const statusColor: Record<string, string> = {
  pending: "bg-slate-500",
  registered: "bg-blue-500",
  qualified: "bg-amber-500",
  rewarded: "bg-emerald-500",
  expired: "bg-red-400",
};

const Referrals = () => {
  const { data: stats } = useGetReferralStatsQuery();
  const { data, isLoading } = useGetReferralsQuery({ limit: 50 });
  const [updateStatus] = useUpdateReferralStatusMutation();

  const referrals = data?.data || [];
  const pending = referrals.filter((r) => r.status !== "rewarded" && r.status !== "expired");
  const approved = referrals.filter((r) => r.status === "rewarded" || r.status === "qualified");

  const handleMarkPaid = async (referral: IReferral) => {
    try {
      await updateStatus({ id: referral.id, status: "rewarded", rewardAmount: 10 }).unwrap();
      message.success("Marked as paid");
    } catch {
      message.error("Failed to update");
    }
  };

  const columns: ColumnsType<IReferral> = [
    {
      title: "REFERRER",
      key: "referrer",
      render: (_, record) => (
        <div>
          <p className="font-semibold text-slate-700">
            {record.referrer ? `${record.referrer.firstName} ${record.referrer.lastName}` : "—"}
          </p>
          <p className="text-xs text-slate-400">{record.referrer?.email}</p>
        </div>
      ),
    },
    {
      title: "INVITED",
      key: "invited",
      render: (_, record) => (
        <div>
          <p className="font-semibold text-slate-700">
            {record.referredUser ? `${record.referredUser.firstName} ${record.referredUser.lastName}` : record.referredEmail || "—"}
          </p>
          <p className="text-xs text-slate-400">{record.referredUser?.email || record.referredEmail}</p>
        </div>
      ),
    },
    {
      title: "DATE",
      key: "date",
      render: (_, record) => (
        <span className="inline-flex items-center gap-1 text-slate-500">
          <FiClock className="h-3.5 w-3.5" />
          {new Date(record.createdAt).toLocaleDateString("it-IT")}
        </span>
      ),
    },
    {
      title: "REWARD",
      key: "reward",
      render: (_, record) => (
        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
          <FiDollarSign className="h-3.5 w-3.5 text-amber-500" />
          {record.rewardAmount ? `EUR${record.rewardAmount}` : "—"}
        </span>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag className={`rounded-full border-0 px-2.5 py-0 text-[10px] font-semibold text-white capitalize ${statusColor[status] || "bg-slate-400"}`}>
          {status}
        </Tag>
      ),
    },
    {
      title: "ACTIONS",
      key: "actions",
      render: (_, record) =>
        record.status === "rewarded" ? null : (
          <button type="button" onClick={() => handleMarkPaid(record)} className="text-emerald-500 hover:text-emerald-600 text-sm font-medium">
            Mark as Paid
          </button>
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
          { title: "Total Referrals", value: String(stats?.totalReferrals || 0), icon: <FiUsers className="h-4 w-4" /> },
          { title: "Qualified", value: String(stats?.qualified || 0), icon: <FiUsers className="h-4 w-4" /> },
          { title: "Rewarded", value: String(stats?.rewarded || 0), icon: <FiUsers className="h-4 w-4" /> },
          { title: "Total Paid", value: stats?.totalRewardsPaid ? `EUR${stats.totalRewardsPaid}` : "EUR0", icon: <FiDollarSign className="h-4 w-4" /> },
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
              <InputNumber min={1} defaultValue={10} className="rounded-lg" size="large" />
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
          <h3 className="text-xl font-semibold text-slate-700">All Referrals</h3>
          <p className="mt-0.5 text-sm text-slate-400">Track referral invitations and rewards</p>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Spin size="large" /></div>
        ) : referrals.length === 0 ? (
          <div className="py-16"><Empty description="No referrals yet" /></div>
        ) : (
          <Table<IReferral>
            rowKey="id"
            columns={columns}
            dataSource={referrals}
            pagination={{ pageSize: 20, className: "p-4" }}
            scroll={{ x: 800 }}
            className="[&_.ant-table-thead_th]:bg-slate-50 [&_.ant-table-thead_th]:text-[11px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:text-slate-500 [&_.ant-table-thead_th]:tracking-wider [&_.ant-table-cell]:py-3"
          />
        )}
      </div>
    </div>
  );
};

export default Referrals;
