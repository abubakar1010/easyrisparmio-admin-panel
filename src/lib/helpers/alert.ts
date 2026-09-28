import Swal from "sweetalert2";
import i18n from "../../i18n";
import { getApiErrorMessage } from "../../utils/apiError";

export type TSuccessAlertProps = {
  message: string;
  timer?: number;
};

export type TErrorAlertProps = {
  /** The rejected request (RTK Query error) whose message is shown, translated. */
  error: unknown;
  /** Shown when the backend's message is not one the dashboard can translate. */
  fallback?: string;
};

export const successAlert = ({ message, timer }: TSuccessAlertProps): void => {
  Swal.fire({
    title: i18n.t("common.success"),
    text: message,
    showConfirmButton: true,
    timer: timer || undefined,
  });
};

/** Error alert for copy that is already translated. */
export const errorMessageAlert = (text: string): void => {
  Swal.fire({
    icon: "error",
    title: i18n.t("common.error"),
    text,
  });
};

/** Field-specific copy for the customer form, which reads better than the generic field message. */
const clientFieldMessage = (raw: string): string | null => {
  if (/pecEmail must be/i.test(raw)) return i18n.t("client_management.pec_invalid");
  if (/^partitaIva /i.test(raw)) return i18n.t("client_management.partita_iva_invalid");
  return null;
};

export const errorAlert = ({ error, fallback }: TErrorAlertProps): void => {
  const data = (error as { data?: { message?: unknown } } | undefined)?.data;
  const messages = Array.isArray(data?.message) ? data.message : [data?.message];
  const specific = messages
    .map((m) => (typeof m === "string" ? clientFieldMessage(m) : null))
    .find((m): m is string => m !== null);

  errorMessageAlert(specific ?? getApiErrorMessage(error, fallback));
};
