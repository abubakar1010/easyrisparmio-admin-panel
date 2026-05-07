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
    text: `Are you sure you want to ${object || "logout"}?`,
    showCancelButton: true,
    confirmButtonText: okay || "Confirm",
    cancelButtonText: "Cancel",
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
