import { Button, Empty, Input, Modal, Select, Spin, Switch, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiEdit3, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import { useState } from "react";
import AddEditStaticPageModal from "./components/AddEditStaticPageModal";
import {
  useGetAdminStaticPagesQuery,
  useCreateStaticPageMutation,
  useUpdateStaticPageMutation,
  useDeleteStaticPageMutation,
  type IStaticPage,
} from "../../redux/features/StaticPages/staticPagesApi";
import { debounce } from "../../utils/debounce";

const slugLabel: Record<string, string> = {
  "privacy-policy": "Privacy Policy",
  "terms-conditions": "Terms & Conditions",
  "about-us": "About Us",
};

const slugColor: Record<string, string> = {
  "privacy-policy": "blue",
  "terms-conditions": "green",
  "about-us": "purple",
};

const StaticPages = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [slugFilter, setSlugFilter] = useState<string | undefined>();
  const [localeFilter, setLocaleFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPage, setSelectedPage] = useState<IStaticPage | null>(null);

  const { data: pagesData, isLoading, isFetching } = useGetAdminStaticPagesQuery({
    page,
    limit: 20,
    search: search || undefined,
    slug: slugFilter,
    locale: localeFilter,
    isActive: statusFilter,
  });

  const [createPage, { isLoading: isCreating }] = useCreateStaticPageMutation();
  const [updatePage, { isLoading: isUpdating }] = useUpdateStaticPageMutation();
  const [deletePage] = useDeleteStaticPageMutation();

  const pages = pagesData?.data || [];
  const meta = pagesData?.meta;

  const handleSearch = debounce((value: string) => {
    setSearch(value);
    setPage(1);
  }, 400);

  const handleAddPage = () => {
    setSelectedPage(null);
    setModalVisible(true);
  };

  const handleEditPage = (record: IStaticPage) => {
    setSelectedPage(record);
    setModalVisible(true);
  };

  const handleSavePage = async (values: {
    slug: string;
    title: string;
    content: string;
    locale: string;
    isActive: boolean;
  }) => {
    try {
      if (selectedPage) {
        await updatePage({ id: selectedPage.id, data: values }).unwrap();
        message.success("Page updated successfully");
      } else {
        await createPage(values).unwrap();
        message.success("Page created successfully");
      }
      setModalVisible(false);
    } catch (err: any) {
      message.error(err?.data?.message?.[0] || "Failed to save page");
    }
  };

  const handleToggleActive = async (record: IStaticPage) => {
    try {
      await updatePage({ id: record.id, data: { isActive: !record.isActive } }).unwrap();
      message.success(`Page ${record.isActive ? "deactivated" : "activated"}`);
    } catch {
      message.error("Failed to update page status");
    }
  };

  const handleDeletePage = (pageId: string) => {
    Modal.confirm({
      title: "Delete this page?",
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        try {
          await deletePage(pageId).unwrap();
          message.success("Page deleted");
        } catch {
          message.error("Failed to delete page");
        }
      },
    });
  };

  const columns: ColumnsType<IStaticPage> = [
    {
      title: "#",
      key: "index",
      width: 60,
      render: (_: any, __: IStaticPage, index: number) => (
        <span className="text-slate-400 text-sm">{(page - 1) * 20 + index + 1}</span>
      ),
    },
    {
      title: "TITLE",
      dataIndex: "title",
      key: "title",
      width: 250,
      render: (value: string) => (
        <span className="text-slate-700 font-medium text-sm truncate block max-w-[250px]">{value}</span>
      ),
    },
    {
      title: "PAGE TYPE",
      dataIndex: "slug",
      key: "slug",
      width: 180,
      render: (value: string) => (
        <Tag color={slugColor[value] || "default"} className="rounded-full border-0 px-3 py-0.5 text-xs font-semibold">
          {slugLabel[value] || value}
        </Tag>
      ),
    },
    {
      title: "LANGUAGE",
      dataIndex: "locale",
      key: "locale",
      width: 100,
      render: (value: string) => (
        <Tag className="rounded-full border-0 bg-slate-50 px-3 py-0.5 text-xs text-slate-600 font-semibold uppercase">
          {value}
        </Tag>
      ),
      align: "center",
    },
    {
      title: "STATUS",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (isActive: boolean, record: IStaticPage) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleActive(record)}
          size="small"
          className={isActive ? "bg-emerald-500!" : ""}
        />
      ),
      align: "center",
    },
    {
      title: "UPDATED",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 130,
      render: (value: string) => (
        <span className="text-xs text-slate-400">
          {value ? new Date(value).toLocaleDateString("it-IT") : "—"}
        </span>
      ),
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 100,
      render: (_: any, record: IStaticPage) => (
        <div className="flex items-center gap-2">
          <Button
            type="text"
            size="small"
            icon={<FiEdit3 className="text-blue-500 h-4 w-4" />}
            onClick={() => handleEditPage(record)}
          />
          <Button
            type="text"
            size="small"
            icon={<FiTrash2 className="text-red-400 h-4 w-4" />}
            onClick={() => handleDeletePage(record.id)}
          />
        </div>
      ),
      align: "center",
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 border-b border-cborder/45 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Static Pages</h2>
          <p className="text-sm text-slate-400 font-medium">Manage Privacy Policy, Terms & Conditions, and About Us content</p>
        </div>
        <Button
          type="primary"
          icon={<FiPlus />}
          className="h-10 rounded-lg border-0 bg-[#8b85f6] px-5 font-semibold hover:bg-[#7a74e5]"
          onClick={handleAddPage}
        >
          Add Page
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <Input
              className="h-11 rounded-xl border-slate-100 bg-slate-50/30 text-[15px]"
              prefix={<FiSearch className="mr-2 text-slate-300 h-5 w-5" />}
              placeholder="Search pages by title..."
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Select
            allowClear
            placeholder="Page Type"
            onChange={(v) => { setSlugFilter(v); setPage(1); }}
            className="w-48 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl"
          >
            <Select.Option value="privacy-policy">Privacy Policy</Select.Option>
            <Select.Option value="terms-conditions">Terms & Conditions</Select.Option>
            <Select.Option value="about-us">About Us</Select.Option>
          </Select>
          <Select
            allowClear
            placeholder="Language"
            onChange={(v) => { setLocaleFilter(v); setPage(1); }}
            className="w-36 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl"
          >
            <Select.Option value="it">Italian</Select.Option>
            <Select.Option value="en">English</Select.Option>
          </Select>
          <Select
            allowClear
            placeholder="Status"
            onChange={(v) => { setStatusFilter(v === "active" ? true : v === "inactive" ? false : undefined); setPage(1); }}
            className="w-36 [&_.ant-select-selector]:h-11 [&_.ant-select-selector]:rounded-xl"
          >
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Spin size="large" />
          </div>
        ) : pages.length === 0 ? (
          <div className="py-24">
            <Empty description="No static pages found" />
          </div>
        ) : (
          <Table<IStaticPage>
            rowKey="id"
            columns={columns}
            dataSource={pages}
            loading={isFetching && !isLoading}
            scroll={{ x: 900 }}
            pagination={{
              current: page,
              pageSize: meta?.limit || 20,
              total: meta?.total || 0,
              onChange: setPage,
              showSizeChanger: false,
              className: "p-4 mt-0 border-t border-slate-100",
            }}
            className="[&_.ant-table-thead_th]:bg-slate-50/50 [&_.ant-table-thead_th]:text-[11px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:text-slate-400 [&_.ant-table-thead_th]:tracking-widest [&_.ant-table-cell]:px-5 [&_.ant-table-cell]:py-4"
          />
        )}
      </div>

      <AddEditStaticPageModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSave={handleSavePage}
        initialValues={selectedPage}
        isLoading={isCreating || isUpdating}
      />
    </div>
  );
};

export default StaticPages;
