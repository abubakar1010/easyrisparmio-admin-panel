import { useState } from "react";
import { Button, Empty, Input, Modal, Select, Spin, Switch, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiEdit3, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import {
  useCreateNotificationTemplateMutation,
  useDeleteNotificationTemplateMutation,
  useGetNotificationTemplatesQuery,
  useUpdateNotificationTemplateMutation,
  type INotificationTemplate,
  type INotificationTemplatePayload,
} from "../../redux/features/Notifications/notificationTemplateApi";
import { debounce } from "../../utils/debounce";
import { CATEGORY_OPTIONS, categoryColor, categoryLabelKey } from "./constants";
import AddEditNotificationTemplateModal from "./components/AddEditNotificationTemplateModal";

const PAGE_SIZE = 20;

/**
 * Reusable messages an admin sends from a customer's profile.
 *
 * The variables column is derived by the server from the text, so it can never
 * disagree with what substitution will actually find.
 */
const NotificationTemplates = () => {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<INotificationTemplate | null>(null);

  const { data, isLoading, isFetching } = useGetNotificationTemplatesQuery({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    category: categoryFilter,
    isActive: activeFilter,
  });

  const [createTemplate, { isLoading: creating }] =
    useCreateNotificationTemplateMutation();
  const [updateTemplate] = useUpdateNotificationTemplateMutation();
  const [deleteTemplate] = useDeleteNotificationTemplateMutation();

  const templates = data?.data || [];
  const meta = data?.meta;

  const handleSearch = debounce((value: string) => {
    setSearch(value);
    setPage(1);
  }, 400);

  const handleSave = async (values: INotificationTemplatePayload) => {
    try {
      if (selected) {
        await updateTemplate({ id: selected.id, data: values }).unwrap();
        message.success(t("notification_templates.updated"));
      } else {
        await createTemplate(values).unwrap();
        message.success(t("notification_templates.created"));
      }
      setModalVisible(false);
      setSelected(null);
    } catch (err: any) {
      // The server rejects a duplicate name and an unknown {{variable}}; both
      // messages are written for the admin, so show them rather than a generic.
      message.error(
        err?.data?.message?.[0] || t("notification_templates.save_error"),
      );
    }
  };

  const confirmDelete = (template: INotificationTemplate) => {
    Modal.confirm({
      title: t("notification_templates.confirm_delete"),
      content: t("notification_templates.delete_warning"),
      okText: t("common.delete"),
      cancelText: t("common.cancel"),
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        try {
          await deleteTemplate(template.id).unwrap();
          message.success(t("notification_templates.deleted"));
        } catch (err: any) {
          message.error(
            err?.data?.message?.[0] || t("notification_templates.save_error"),
          );
        }
      },
    });
  };

  const columns: ColumnsType<INotificationTemplate> = [
    {
      title: "#",
      key: "index",
      width: 60,
      render: (_v, _r, index) => (page - 1) * PAGE_SIZE + index + 1,
    },
    {
      title: t("notification_templates.name").toUpperCase(),
      key: "name",
      render: (_v, record) => (
        <div>
          <p className="text-sm font-semibold text-slate-800">{record.name}</p>
          {record.description && (
            <p className="text-xs text-slate-400">{record.description}</p>
          )}
        </div>
      ),
    },
    {
      title: t("notification_templates.category").toUpperCase(),
      dataIndex: "category",
      key: "category",
      render: (category: INotificationTemplate["category"]) => (
        <Tag
          color={categoryColor[category]}
          className="rounded-full border-0 px-3 py-0.5 text-xs font-semibold"
        >
          {t(categoryLabelKey[category])}
        </Tag>
      ),
    },
    {
      title: t("notification_templates.template_title").toUpperCase(),
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: t("notification_templates.variables").toUpperCase(),
      key: "variables",
      render: (_v, record) =>
        record.variables?.length ? (
          <div className="flex flex-wrap gap-1">
            {record.variables.map((key) => (
              <span
                key={key}
                className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-500"
              >
                {`{{${key}}}`}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        ),
    },
    {
      title: t("notification_templates.active").toUpperCase(),
      key: "isActive",
      width: 90,
      render: (_v, record) => (
        <Switch
          size="small"
          checked={record.isActive}
          onChange={() =>
            updateTemplate({
              id: record.id,
              data: { isActive: !record.isActive },
            })
          }
        />
      ),
    },
    {
      title: t("notification_templates.updated_at").toUpperCase(),
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (value: string) => new Date(value).toLocaleDateString("it-IT"),
    },
    {
      title: t("common.actions").toUpperCase(),
      key: "actions",
      width: 100,
      render: (_v, record) => (
        <div className="flex items-center gap-1">
          <Button
            type="text"
            onClick={() => {
              setSelected(record);
              setModalVisible(true);
            }}
            icon={<FiEdit3 className="h-4 w-4 text-blue-500" />}
          />
          <Button
            type="text"
            onClick={() => confirmDelete(record)}
            icon={<FiTrash2 className="h-4 w-4 text-red-400" />}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {t("notification_templates.title")}
            </h1>
            <p className="text-sm text-slate-400">
              {t("notification_templates.subtitle")}
            </p>
          </div>
          <Button
            type="primary"
            icon={<FiPlus className="h-4 w-4" />}
            onClick={() => {
              setSelected(null);
              setModalVisible(true);
            }}
            className="h-11 rounded-xl border-0 bg-[#8b85f6] font-semibold hover:bg-[#7a74e5]"
          >
            {t("notification_templates.add")}
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Input
            allowClear
            prefix={<FiSearch className="h-4 w-4 text-slate-400" />}
            placeholder={t("common.search")}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-10 w-64 rounded-xl border-slate-200"
          />
          <Select
            allowClear
            placeholder={t("notification_templates.category")}
            value={categoryFilter}
            onChange={(value) => {
              setCategoryFilter(value);
              setPage(1);
            }}
            className="w-52 [&_.ant-select-selector]:!h-10 [&_.ant-select-selector]:!rounded-xl"
            options={CATEGORY_OPTIONS.map((option) => ({
              value: option.value,
              label: t(option.labelKey),
            }))}
          />
          <Select
            allowClear
            placeholder={t("notification_templates.active")}
            value={activeFilter}
            onChange={(value) => {
              setActiveFilter(value);
              setPage(1);
            }}
            className="w-44 [&_.ant-select-selector]:!h-10 [&_.ant-select-selector]:!rounded-xl"
            options={[
              { value: true, label: t("common.active") },
              { value: false, label: t("common.inactive") },
            ]}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spin size="large" />
          </div>
        ) : templates.length === 0 ? (
          <div className="py-16">
            <Empty description={t("notification_templates.no_templates")} />
          </div>
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={templates}
            loading={isFetching && !isLoading}
            className="[&_.ant-table-thead_th]:bg-slate-50/50"
            scroll={{ x: 900 }}
            pagination={{
              current: page,
              pageSize: meta?.limit || PAGE_SIZE,
              total: meta?.total || 0,
              onChange: setPage,
              showSizeChanger: false,
            }}
          />
        )}
      </div>

      <AddEditNotificationTemplateModal
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelected(null);
        }}
        onSave={handleSave}
        initialValues={selected}
        isLoading={creating}
      />
    </div>
  );
};

export default NotificationTemplates;
