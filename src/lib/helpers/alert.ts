import Swal from "sweetalert2";

export type TSuccessAlertProps = {
  message: string;
  timer?: number;
};

export type TResponseError = {
  data?: { message?: string | string[] };
  message?: string;
  error?: string;
};
export type TErrorAlertProps = {
  error: TResponseError;
};

export const successAlert = ({ message, timer }: TSuccessAlertProps): void => {
  Swal.fire({
    title: "Success",
    text: message,
    showConfirmButton: true,
    timer: timer || undefined,
  });
};

export const errorAlert = ({ error }: TErrorAlertProps): void => {
  const msg = error?.data?.message;
  const text = Array.isArray(msg)
    ? msg.join(". ")
    : msg || error?.message || error?.error?.slice(10) || "Something went wrong. Please try again later.";

  Swal.fire({
    icon: "error",
    title: "Failed!!",
    text,
  });
};
