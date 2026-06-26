import { Spin } from "antd";
import { useGetAdminDashboardQuery } from "../../redux/features/Dashboard/dashboardApi";
import { KpiStatCards } from "../../components/home/KpiStatCards";
import { KpiFinancialCards } from "../../components/home/KpiFinancialCards";
import { PriorityTasksCard } from "../../components/home/PriorityTasksCard";
import { ConversionFunnelCard } from "../../components/home/ConversionFunnelCard";
import { RevenueTrendCard } from "../../components/home/RevenueTrendCard";
import { ActiveAlertsCard } from "../../components/home/ActiveAlertsCard";
import { RecentActivityCard } from "../../components/home/RecentActivityCard";
import { HomeTopBar } from "../../components/home/HomeTopBar";

const Home = () => {
  const { data, isLoading } = useGetAdminDashboardQuery();

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <HomeTopBar />

      <section className="space-y-3 sm:space-y-4">
        <KpiStatCards data={data?.kpiStats} />
        <KpiFinancialCards data={data?.financialKpis} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3 lg:gap-5 xl:gap-6">
        <div className="lg:col-span-1">
          <PriorityTasksCard data={data?.priorityTasks} />
        </div>
        <div className="lg:col-span-1">
          <ConversionFunnelCard data={data?.conversionFunnel} />
        </div>
        <div className="lg:col-span-1">
          <RevenueTrendCard data={data?.revenueTrend} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-12 lg:gap-5 xl:gap-6">
        <div className="lg:col-span-8">
          <ActiveAlertsCard data={data?.activeAlerts} />
        </div>
        <div className="lg:col-span-4">
          <RecentActivityCard data={data?.recentActivity} />
        </div>
      </section>
    </div>
  );
};

export default Home;
