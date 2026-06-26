import Swal from "sweetalert2";

export type TSuccessAlertProps = {
  message: string;
  timer?: number;
};

export type TResponseError = {
  data?: { message?: string };
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
  Swal.fire({
    icon: "error",
    title: "Failed!!",
    text:
      error?.data?.message ||
      error?.message ||
      error?.error?.slice(10) ||
      "Something went wrong. Please try again later.",
  });
};

// Swal.fire({
//     html: `
//         <div class="text-center pt-4 pb-2">
//           <p class="leading-7">
//             An invitation has sent to that persons E-mail. After accepting the invitation he/she will be on board.
//           </p>
//         </div>
//       `,
//     width: "600px",
//     showCancelButton: false,
//     confirmButtonText: "Okay",
//     showConfirmButton: true,
//     reverseButtons: true,
//     customClass: {
//       confirmButton: "text-white py-2 px-4 rounded-full w-40",
//       cancelButton: "py-2 px-4 rounded-full w-40",
//     },
//   }).then((res) => {
//     if (res.isConfirmed) {
//       console.log(values);
//     }
//   });
