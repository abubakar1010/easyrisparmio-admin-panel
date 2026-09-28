import i18n from "../../i18n";
import Swal from "sweetalert2";

type SweetAlertConfirmationProps = {
  func: () => void;
  okay?: string;
  object?: string;
  title?: string;
  conBtnColor?: string;
};

export const sweetAlertConfirmation = ({
  func,
  okay,
  object,
  title,
  conBtnColor,
}: SweetAlertConfirmationProps) => {
  Swal.fire({
    title: title,
    text: i18n.t("audit.confirm_action", { action: object || i18n.t("audit.logout_action") }),
    showCancelButton: true,
    confirmButtonText: okay || i18n.t("common.confirm"),
    cancelButtonText: i18n.t("common.cancel"),
    showConfirmButton: true,
    confirmButtonColor: conBtnColor || "red",
    reverseButtons: true,
    customClass: {
      confirmButton: "text-white font-bold py-2 px-4 rounded-full w-40",
      cancelButton: "font-bold py-2 px-4 rounded-full w-40",
    },
  }).then((res) => {
    if (res.isConfirmed) {
      func();
    }
  });
};
