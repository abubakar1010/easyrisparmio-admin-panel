import { useEffect } from "react";
import { Avatar, Button, Divider, Modal, Spin, Tabs, Tag } from "antd";
import { FiEdit3, FiFileText, FiLock, FiMail, FiMapPin, FiPhone, FiUnlock } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import type { CustomerStatus, IClient } from "../types";
import { statusClass, statusToDisplay } from "../types";
import { useLazyGetClientByIdQuery, useToggleClientStatusMutation, useResetClientPasswordMutation } from "../../../redux/features/Users/clientApi";
import { sweetAlertConfirmation } from "../../../lib/helpers/sweetAlertConfirmation";
import { successAlert, errorAlert } from "../../../lib/helpers/alert";

type ClientDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  client: IClient | null;
};

const statusTranslationKeys: Record<string, string> = {
  Active: "client_management.status_active",
  Pending: "client_management.status_pending",
  Blocked: "client_management.status_blocked",
  Inactive: "client_management.status_inactive",
};

export function ClientDetailsModal({ open, onClose, client }: ClientDetailsModalProps) {
  const { t } = useTranslation();
  const [triggerGetClient, { data: clientDetail, isLoading, isFetching }] = useLazyGetClientByIdQuery();
  const [toggleStatus, { isLoading: toggling }] = useToggleClientStatusMutation();
  const [resetPassword, { isLoading: resetting }] = useResetClientPasswordMutation();

  useEffect(() => {
    if (open && client?.id) {
      triggerGetClient(client.id);
    }
  }, [open, client?.id, triggerGetClient]);

  const detail = clientDetail || client;
  const loading = isLoading || isFetching;

  const handleResetPassword = () => {
    if (!detail) return;
    sweetAlertConfirmation({
      title: t("client_management.reset_password"),
      object: `${t("client_management.send_password_reset")} ${detail.email}`,
      okay: t("client_management.send_reset"),
      conBtnColor: "#7061ED",
      func: async () => {
        try {
          await resetPassword(detail.id).unwrap();
          successAlert({ message: t("client_management.password_reset_sent") });
        } catch (err) {
          errorAlert({ error: err as { data?: { message?: string } } });
        }
      },
    });
  };

  const handleToggleStatus = () => {
    if (!detail) return;
    const isBlocking = detail.status === "active";
    sweetAlertConfirmation({
      title: isBlocking ? t("client_management.block_user") : t("client_management.unblock_user"),
      object: isBlocking ? t("client_management.block_confirm") : t("client_management.unblock_confirm"),
      okay: isBlocking ? t("client_management.block") : t("client_management.unblock"),
      conBtnColor: isBlocking ? "red" : "#7061ED",
      func: async () => {
        try {
          await toggleStatus(detail.id).unwrap();
          successAlert({
            message: isBlocking
              ? t("client_management.user_blocked_successfully")
              : t("client_management.user_unblocked_successfully"),
          });
        } catch (err) {
          errorAlert({ error: err as { data?: { message?: string } } });
        }
      },
    });
  };

  const displayStatus = detail ? statusToDisplay[detail.status] || detail.status : "";
  const primaryAddress = detail?.addresses?.[0];
  const preferences = detail?.preferences;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      centered
      destroyOnClose
      title={null}
    >
      {loading && !detail ? (
        <div className="flex items-center justify-center py-16">
          <Spin size="large" />
        </div>
      ) : detail ? (
        <div className="pt-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Avatar size={50} className="bg-indigo-500">
                {detail.firstName?.charAt(0) || detail.email.charAt(0)}
              </Avatar>
              <div>
                <h3 className="text-[30px] font-semibold leading-tight text-brand">
                  {detail.firstName} {detail.lastName}
                </h3>
                <p className="text-owngray">{detail.email}</p>
                <Tag
                  color={statusClass[displayStatus as CustomerStatus] || "default"}
                  className="mt-1 rounded-full"
                >
                  {t(statusTranslationKeys[displayStatus] || displayStatus)}
                </Tag>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-[15px] text-gray-700">
            {detail.phone && (
              <p className="flex items-center gap-2">
                <FiPhone /> {detail.phone}
              </p>
            )}
            <p className="flex items-center gap-2">
              <FiMail /> {detail.email}
            </p>
            {detail.codiceFiscale && (
              <p className="flex items-center gap-2">
                <FiFileText /> {t("client_management.codice_fiscale_label")}: {detail.codiceFiscale}
              </p>
            )}
            {primaryAddress && (
              <p className="flex items-center gap-2">
                <FiMapPin /> {primaryAddress.streetAddress}, {primaryAddress.city}
                {primaryAddress.postalCode ? ` ${primaryAddress.postalCode}` : ""}
              </p>
            )}
          </div>

          <Divider />

          <Tabs
            defaultActiveKey="anagrafica"
            items={[
              { key: "anagrafica", label: t("client_management.tab_personal_data") },
              { key: "forniture", label: `${t("client_management.tab_supplies")} (${detail.billCount ?? 0})` },
              { key: "bollette", label: t("client_management.tab_bills") },
              { key: "case", label: t("client_management.tab_cases") },
              { key: "gdpr", label: t("client_management.tab_gdpr") },
            ]}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-base font-semibold text-brand">{t("client_management.personal_data")}</p>
              <p className="text-sm text-owngray">{t("client_management.email_label")}</p>
              <p className="mb-2 text-[15px] font-semibold text-brand">{detail.email}</p>
              {detail.phone && (
                <>
                  <p className="text-sm text-owngray">{t("client_management.telephone")}</p>
                  <p className="mb-2 text-[15px] font-semibold text-brand">{detail.phone}</p>
                </>
              )}
              {detail.codiceFiscale && (
                <>
                  <p className="text-sm text-owngray">{t("client_management.codice_fiscale_label")}</p>
                  <p className="mb-2 text-[15px] font-semibold text-brand">{detail.codiceFiscale}</p>
                </>
              )}
            </div>
            <div>
              <p className="mb-2 text-base font-semibold text-brand">{t("client_management.other_info")}</p>
              <p className="text-sm text-owngray">{t("client_management.payment_method")}</p>
              <p className="mb-2 text-[15px] font-semibold text-brand">
                {preferences?.paymentMethod
                  ? t(`client_management.payment_${preferences.paymentMethod}`, { defaultValue: preferences.paymentMethod })
                  : "—"}
              </p>
              <p className="text-sm text-owngray">{t("client_management.invoice_type")}</p>
              <p className="mb-2 text-[15px] font-semibold text-brand">
                {preferences?.invoiceDelivery
                  ? t(`client_management.invoice_${preferences.invoiceDelivery}`, { defaultValue: preferences.invoiceDelivery })
                  : "—"}
              </p>
              <p className="text-sm text-owngray">{t("client_management.language_label")}</p>
              <p className="text-[15px] font-semibold text-brand">
                {preferences?.language
                  ? t(`client_management.lang_${preferences.language}`, { defaultValue: preferences.language })
                  : "—"}
              </p>
            </div>
          </div>

          <Divider />

          <div className="flex flex-col gap-2">
            <Button
              type="primary"
              icon={<FiEdit3 />}
              className="w-full pb-0.5!"
              size="large"
              loading={resetting}
              onClick={handleResetPassword}
            >
              {t("client_management.reset_password")}
            </Button>
            <Button
              danger={detail.status !== "suspended"}
              icon={detail.status === "suspended" ? <FiUnlock /> : <FiLock />}
              className="w-full pb-0.5!"
              size="large"
              loading={toggling}
              onClick={handleToggleStatus}
            >
              {detail.status === "suspended" ? t("client_management.unblock_user") : t("client_management.block_user")}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
