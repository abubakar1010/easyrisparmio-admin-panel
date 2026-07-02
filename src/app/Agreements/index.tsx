import { Button, Card, DatePicker, Form, Input, Modal, Select, Spin, Empty, Switch, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiEdit2, FiEye, FiPlus, FiTag, FiTrash2, FiUpload } from "react-icons/fi";
import { LuCalendarDays } from "react-icons/lu";
import { useState } from "react";
import dayjs from "dayjs";
import {
  useGetAgreementsAdminQuery,
  useCreateAgreementMutation,
  useToggleAgreementStatusMutation,
  useDeleteAgreementMutation,
  type IAgreement,
} from "../../redux/features/Agreements/agreementApi";

const Agreements = () => {
  const [addPartnerOpen, setAddPartnerOpen] = useState(false);
  const [partnerForm] = Form.useForm();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetAgreementsAdminQuery({ page, limit: 20 });
  const [createAgreement, { isLoading: isCreating }] = useCreateAgreementMutation();
  const [toggleStatus] = useToggleAgreementStatusMutation();
  const [deleteAgreement] = useDeleteAgreementMutation();

  const agreements = data?.data || [];
  const meta = data?.meta;

  const closePartnerModal = () => {
    setAddPartnerOpen(false);
    partnerForm.resetFields();
  };

  const submitPartnerForm = async (values: Record<string, any>) => {
    try {
      await createAgreement({
        title: values.discount || values.partnerName,
        partnerName: values.partnerName,
        partnerLogoUrl: values.logo || undefined,
        discountDescription: values.discount,
        description: values.terms || undefined,
        validFrom: dayjs(values.validFrom).format("YYYY-MM-DD"),
        validUntil: values.validUntil ? dayjs(values.validUntil).format("YYYY-MM-DD") : undefined,
      }).unwrap();
      message.success("Agreement created");
      closePartnerModal();
    } catch (err: any) {
      message.error(err?.data?.message?.[0] || "Failed to create agreement");
    }
  };

  const handleToggleStatus = async (agreement: IAgreement) => {
    try {
      await toggleStatus({ id: agreement.id, isActive: !agreement.isActive }).unwrap();
      message.success(`Status updated`);
    } catch {
      message.error("Failed to update status");
    }
  };

  const handleDelete = (agreement: IAgreement) => {
    Modal.confirm({
      title: "Delete agreement?",
      content: `"${agreement.partnerName}" will be removed.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        try {
          await deleteAgreement(agreement.id).unwrap();
          message.success("Agreement deleted");
        } catch {
          message.error("Failed to delete");
        }
      },
    });
  };

  const columns: ColumnsType<IAgreement> = [
    {
      title: "PARTNER",
      key: "partner",
      width: 260,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          {record.partnerLogoUrl ? (
            <img src={record.partnerLogoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-lg font-bold text-slate-500">
              {record.partnerName[0]}
            </span>
          )}
          <span className="font-semibold text-slate-700">{record.partnerName}</span>
        </div>
      ),
    },
    {
      title: "DISCOUNT",
      dataIndex: "discountDescription",
      key: "discount",
      render: (value: string) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
          <FiTag className="text-emerald-500" />
          {value || "—"}
        </span>
      ),
    },
    {
      title: "VALIDITY",
      key: "validity",
      width: 160,
      render: (_, record) => (
        <div className="text-sm text-slate-500">
          <p className="inline-flex items-center gap-1.5">
            <LuCalendarDays className="h-3.5 w-3.5" />
            {new Date(record.validFrom).toLocaleDateString("it-IT")}
          </p>
          {record.validUntil && <p>{new Date(record.validUntil).toLocaleDateString("it-IT")}</p>}
        </div>
      ),
    },
    {
      title: "STATUS",
      key: "status",
      width: 120,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Switch size="small" checked={record.isActive} onChange={() => handleToggleStatus(record)} />
          <span className={`text-sm font-medium ${record.isActive ? "text-emerald-600" : "text-slate-500"}`}>
            {record.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 110,
      render: (_, record) => (
        <div className="flex items-center gap-1">
          <Button type="text" size="small" icon={<FiTrash2 className="text-rose-400" />} onClick={() => handleDelete(record)} />
        </div>
      ),
      align: "center",
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      <div className="mb-4 flex flex-col gap-3 border-b border-cborder/45 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-brand">Agreements</h2>
          <p className="text-sm text-owngray">Management of partnerships and discounts for customers</p>
        </div>
        <Button
          type="primary"
          icon={<FiPlus />}
          className="h-10 rounded-lg border-0 bg-[#8b85f6] px-5 font-semibold hover:bg-[#7a74e5]"
          onClick={() => setAddPartnerOpen(true)}
        >
          Add Partner
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-24"><Spin size="large" /></div>
        ) : agreements.length === 0 ? (
          <div className="py-24"><Empty description="No agreements found" /></div>
        ) : (
          <Table<IAgreement>
            rowKey="id"
            columns={columns}
            dataSource={agreements}
            pagination={{
              current: page,
              pageSize: meta?.limit || 20,
              total: meta?.total || 0,
              onChange: setPage,
              className: "p-4",
            }}
            scroll={{ x: 920 }}
            className="[&_.ant-table-thead_th]:bg-slate-50 [&_.ant-table-thead_th]:text-[11px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:text-slate-500 [&_.ant-table-thead_th]:tracking-wider [&_.ant-table-cell]:py-3"
          />
        )}
      </div>

      <Modal
        open={addPartnerOpen}
        onCancel={closePartnerModal}
        footer={null}
        centered
        destroyOnClose
        width={980}
        className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-4 sm:[&_.ant-modal-content]:p-6"
      >
        <h3 className="mb-4 text-2xl font-semibold text-slate-800">Add New Agreement</h3>
        <Form form={partnerForm} layout="vertical" onFinish={submitPartnerForm}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Form.Item name="partnerName" label="Partner Name" rules={[{ required: true, message: "Please enter partner name" }]}>
              <Input className="h-11 rounded-lg" placeholder="E.g.: Restaurant Da Mario" />
            </Form.Item>
            <Form.Item name="logo" label="Logo URL">
              <Input className="h-11 rounded-lg" placeholder="https://..." suffix={<FiUpload className="text-slate-500" />} />
            </Form.Item>
          </div>
          <Form.Item name="discount" label="Discount Offered" rules={[{ required: true, message: "Please enter discount" }]}>
            <Input className="h-11 rounded-lg" placeholder="E.g.: 15% off the entire menu" />
          </Form.Item>
          <Form.Item name="terms" label="Description">
            <Input.TextArea rows={4} className="rounded-lg" placeholder="Describe the conditions..." />
          </Form.Item>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Form.Item name="validFrom" label="Valid From" rules={[{ required: true, message: "Please select start date" }]}>
              <DatePicker className="h-11! w-full rounded-lg" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="validUntil" label="Valid Until">
              <DatePicker className="h-11! w-full rounded-lg" format="DD/MM/YYYY" />
            </Form.Item>
          </div>
          <Button htmlType="submit" type="primary" loading={isCreating}
            className="h-11 w-full rounded-xl border-0 bg-[#8b85f6] text-base font-semibold hover:bg-[#7a74e5]">
            Save Agreement
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default Agreements;
