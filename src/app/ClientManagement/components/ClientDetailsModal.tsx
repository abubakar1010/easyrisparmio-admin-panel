import { useEffect } from "react";
import { Avatar, Button, Divider, Modal, Spin, Tabs, Tag } from "antd";
import { FiEdit3, FiFileText, FiLock, FiMail, FiMapPin, FiPhone, FiUnlock } from "react-icons/fi";
import type { CustomerStatus, IClient } from "../types";
import { statusClass, statusToDisplay, paymentMethodLabels, invoiceDeliveryLabels, languageLabels } from "../types";
import { useLazyGetClientByIdQuery, useToggleClientStatusMutation, useResetClientPasswordMutation } from "../../../redux/features/Users/clientApi";
import { sweetAlertConfirmation } from "../../../lib/helpers/sweetAlertConfirmation";
import { successAlert, errorAlert } from "../../../lib/helpers/alert";

type ClientDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  client: IClient | null;
};

export function ClientDetailsModal({ open, onClose, client }: ClientDetailsModalProps) {
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
      title: "Reset Password",
      object: `send a password reset email to ${detail.email}`,
      okay: "Send Reset",
      conBtnColor: "#7061ED",
      func: async () => {
        try {
          await resetPassword(detail.id).unwrap();
          successAlert({ message: "Password reset code sent to user email" });
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
      title: isBlocking ? "Block User" : "Unblock User",
      object: isBlocking ? "block this user" : "unblock this user",
      okay: isBlocking ? "Block" : "Unblock",
      conBtnColor: isBlocking ? "red" : "#7061ED",
      func: async () => {
        try {
          await toggleStatus(detail.id).unwrap();
          successAlert({ message: `User ${isBlocking ? "blocked" : "unblocked"} successfully` });
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
                  {displayStatus}
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
                <FiFileText /> Codice fiscale: {detail.codiceFiscale}
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
              { key: "anagrafica", label: "Anagrafica" },
              { key: "forniture", label: `Forniture (${detail.billCount ?? 0})` },
              { key: "bollette", label: "Bollette" },
              { key: "case", label: "Case" },
              { key: "gdpr", label: "Connessi GDPR" },
            ]}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-base font-semibold text-brand">Dati anagrafici</p>
              <p className="text-sm text-owngray">Email</p>
              <p className="mb-2 text-[15px] font-semibold text-brand">{detail.email}</p>
              {detail.phone && (
                <>
                  <p className="text-sm text-owngray">Telefono</p>
                  <p className="mb-2 text-[15px] font-semibold text-brand">{detail.phone}</p>
                </>
              )}
              {detail.codiceFiscale && (
                <>
                  <p className="text-sm text-owngray">Codice Fiscale</p>
                  <p className="mb-2 text-[15px] font-semibold text-brand">{detail.codiceFiscale}</p>
                </>
              )}
            </div>
            <div>
              <p className="mb-2 text-base font-semibold text-brand">Altre informazioni</p>
              <p className="text-sm text-owngray">Metodo di pagamento</p>
              <p className="mb-2 text-[15px] font-semibold text-brand">
                {preferences?.paymentMethod
                  ? paymentMethodLabels[preferences.paymentMethod] || preferences.paymentMethod
                  : "—"}
              </p>
              <p className="text-sm text-owngray">Tipo fattura</p>
              <p className="mb-2 text-[15px] font-semibold text-brand">
                {preferences?.invoiceDelivery
                  ? invoiceDeliveryLabels[preferences.invoiceDelivery] || preferences.invoiceDelivery
                  : "—"}
              </p>
              <p className="text-sm text-owngray">Lingua</p>
              <p className="text-[15px] font-semibold text-brand">
                {preferences?.language
                  ? languageLabels[preferences.language] || preferences.language
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
              Reset password
            </Button>
            <Button
              danger={detail.status !== "suspended"}
              icon={detail.status === "suspended" ? <FiUnlock /> : <FiLock />}
              className="w-full pb-0.5!"
              size="large"
              loading={toggling}
              onClick={handleToggleStatus}
            >
              {detail.status === "suspended" ? "Sblocca utente" : "Blocca utente"}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
