import { getLocale } from "../../../utils/format";
import { Drawer, Empty, Input, Segmented, Spin, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiSearch } from "react-icons/fi";
import {
  useGetLegalAcceptancesQuery,
  type ILegalAcceptance,
  type IStaticPage,
} from "../../../redux/features/StaticPages/staticPagesApi";
import { debounce } from "../../../utils/debounce";
import { slugLabel } from "../constants";

interface LegalAcceptancesDrawerProps {
  page: IStaticPage | null;
  onClose: () => void;
}

/**
 * The consent ledger for one document. Defaults to the version currently
 * published — the question an admin actually has after an update is "who has
 * accepted the new terms", not "who ever accepted anything".
 */
const LegalAcceptancesDrawer = ({ page, onClose }: LegalAcceptancesDrawerProps) => {
  const { t } = useTranslation();
  const [scope, setScope] = useState<"current" | "all">("current");
  const [search, setSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    if (page) {
      setScope("current");
      setSearch("");
      setPageNumber(1);
    }
  }, [page]);

  const { data, isLoading, isFetching } = useGetLegalAcceptancesQuery(
    page
      ? {
          slug: page.slug,
          version: scope === "current" ? page.version : undefined,
          search: search || undefined,
          page: pageNumber,
          limit: 20,
        }
      : (undefined as never),
    { skip: !page },
  );

  const handleSearch = debounce((value: string) => {
    setSearch(value);
    setPageNumber(1);
  }, 400);

  const rows = data?.data || [];
  const meta = data?.meta;

  const columns: ColumnsType<ILegalAcceptance> = [
    {
      title: t("static_pages.user"),
      key: "user",
      render: (_: unknown, record: ILegalAcceptance) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-700">
            {[record.user?.firstName, record.user?.lastName].filter(Boolean).join(" ") ||
              "—"}
          </span>
          <span className="text-xs text-slate-400">{record.user?.email || "—"}</span>
        </div>
      ),
    },
    {
      title: t("static_pages.role"),
      key: "role",
      width: 110,
      render: (_: unknown, record: ILegalAcceptance) => (
        <Tag
          color={record.user?.role === "business" ? "orange" : "blue"}
          className="rounded-full border-0 px-3 py-0.5 text-xs font-semibold capitalize"
        >
          {record.user?.role || "—"}
        </Tag>
      ),
    },
    {
      title: t("static_pages.version_column"),
      dataIndex: "version",
      key: "version",
      width: 100,
      align: "center",
      render: (value: string) => (
        <Tag color="geekblue" className="rounded-full border-0 px-3 py-0.5 text-xs font-bold">
          v{value}
        </Tag>
      ),
    },
    {
      title: t("static_pages.how"),
      dataIndex: "source",
      key: "source",
      width: 160,
      render: (value: string) => (
        <span className="text-xs font-medium text-slate-500">
          {value === "registration" ? t("static_pages.sign_up") : value === "social_login" ? t("static_pages.social_login") : value === "business_upgrade" ? t("static_pages.business_upgrade") : value === "reacceptance" ? t("static_pages.reaccepted") : value}
        </span>
      ),
    },
    {
      title: t("static_pages.accepted"),
      dataIndex: "acceptedAt",
      key: "acceptedAt",
      width: 170,
      render: (value: string) => (
        <span className="text-xs text-slate-400">
          {value ? new Date(value).toLocaleString(getLocale()) : "—"}
        </span>
      ),
    },
  ];

  return (
    <Drawer
      open={!!page}
      onClose={onClose}
      width={860}
      destroyOnClose
      title={
        <div>
          <h3 className="text-lg font-bold text-slate-800 m-0">{t("static_pages.consent_log")}</h3>
          <p className="text-xs text-slate-400 font-medium m-0 mt-0.5">
            {page ? slugLabel(page.slug) : ""}
            {page ? ` · ${t("static_pages.currently_published_version", { version: page.version })}` : ""}
          </p>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Segmented
          value={scope}
          onChange={(value) => {
            setScope(value as "current" | "all");
            setPageNumber(1);
          }}
          options={[
            { label: page ? t("static_pages.current_only", { version: page.version }) : t("static_pages.current"), value: "current" },
            { label: t("static_pages.all_versions"), value: "all" },
          ]}
        />
        <Input
          allowClear
          className="h-10 flex-1 min-w-[220px] rounded-xl border-slate-100 bg-slate-50/30"
          prefix={<FiSearch className="mr-2 text-slate-300 h-4 w-4" />}
          placeholder={t("static_pages.search_acceptances")}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spin size="large" />
        </div>
      ) : rows.length === 0 ? (
        <div className="py-20">
          <Empty
            description={
              scope === "current"
                ? t("static_pages.nobody_accepted")
                : t("static_pages.no_acceptances")
            }
          />
        </div>
      ) : (
        <Table<ILegalAcceptance>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={isFetching && !isLoading}
          scroll={{ x: 700 }}
          pagination={{
            current: pageNumber,
            pageSize: meta?.limit || 20,
            total: meta?.total || 0,
            onChange: setPageNumber,
            showSizeChanger: false,
            showTotal: (total) => t(total === 1 ? "static_pages.acceptance_one" : "static_pages.acceptance_other", { count: total }),
          }}
          className="[&_.ant-table-thead_th]:bg-slate-50/50 [&_.ant-table-thead_th]:text-[11px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:text-slate-400 [&_.ant-table-thead_th]:tracking-widest"
        />
      )}
    </Drawer>
  );
};

export default LegalAcceptancesDrawer;
