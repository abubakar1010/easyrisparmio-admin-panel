import { Modal, Form, Input, Select, Button, message } from "antd";
import { FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useSendNotificationMutation } from "../../redux/features/Notifications/notificationApi";
import { useGetClientsQuery } from "../../redux/features/Users/clientApi";

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const notificationTypes = [
  "general",
  "bill_analyzed",
  "bill_verification",
  "offer_available",
  "case_update",
  "contract_status",
  "referral_status",
] as const;

const SendNotificationModal = ({ isOpen, onClose }: SendNotificationModalProps) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const [sendNotification, { isLoading }] = useSendNotificationMutation();
  const { data: clientsData, isLoading: isLoadingClients } = useGetClientsQuery({ limit: 100 });

  const clients = clientsData?.data || [];

  const handleFinish = async (values: {
    userIds: string[];
    title: string;
    body: string;
    type: string;
  }) => {
    try {
      await sendNotification({
        title: values.title,
        body: values.body,
        userIds: values.userIds,
        type: values.type,
      }).unwrap();
      message.success(t("notifications.sent_success"));
      form.resetFields();
      onClose();
    } catch {
      message.error(t("notifications.sent_error"));
    }
  };

  return (
    <Modal
      title={
        <div className="py-2">
          <h2 className="text-xl font-bold text-slate-800">{t("notifications.send_notification")}</h2>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnClose
      closeIcon={<FiX className="h-5 w-5 text-slate-400 transition-colors hover:text-slate-600" />}
      className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-slate-100 [&_.ant-modal-header]:pb-4"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="mt-6 space-y-1"
        requiredMark={false}
        initialValues={{ type: "general" }}
      >
        <Form.Item
          label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("notifications.recipient")}</span>}
          name="userIds"
          rules={[{ required: true, message: t("notifications.select_users") }]}
        >
          <Select
            mode="multiple"
            showSearch
            placeholder={t("notifications.select_users")}
            loading={isLoadingClients}
            filterOption={(input, option) => {
              const label = (option?.label as string) || "";
              return label.toLowerCase().includes(input.toLowerCase());
            }}
            options={clients.map((client) => ({
              value: client.id,
              label: `${client.firstName} ${client.lastName} (${client.email})`,
            }))}
            className="rounded-lg"
          />
        </Form.Item>

        <Form.Item
          label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("notifications.notification_title")}</span>}
          name="title"
          rules={[{ required: true, message: t("notifications.notification_title") }]}
        >
          <Input maxLength={255} className="h-10 rounded-lg border-slate-200" />
        </Form.Item>

        <Form.Item
          label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("notifications.notification_body")}</span>}
          name="body"
          rules={[{ required: true, message: t("notifications.notification_body") }]}
        >
          <Input.TextArea rows={4} className="rounded-lg border-slate-200" />
        </Form.Item>

        <Form.Item
          label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("notifications.notification_type")}</span>}
          name="type"
        >
          <Select className="rounded-lg">
            {notificationTypes.map((type) => (
              <Select.Option key={type} value={type}>
                {t(`notifications.type_${type}`)}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <div className="pt-4">
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={isLoading}
            className="h-12 rounded-xl border-0 bg-[#8b85f6] text-base font-bold shadow-lg shadow-indigo-100 hover:bg-[#7a74e5]"
          >
            {t("notifications.send")}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default SendNotificationModal;
