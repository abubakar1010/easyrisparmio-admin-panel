// import { Button } from "antd";
// import { useEffect, useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import PageHeading from "../../Components/PageHeading";
// import QuillEditor from "../../Components/QuillEditor";
// import {
//   useGetSettingQuery,
//   useUpdateSettingsMutation,
// } from "../../redux/features/settings/settingApi";
// import toast from "react-hot-toast";
// import { errorAlert } from "../../lib/helpers/alert";
// import LoaderWraperComp from "../../Components/LoaderWraperComp";
// import { useTranslation } from "react-i18next";

// const EditPrivacyPolicy = () => {
//   const editor = useRef(null);
//   const navigate = useNavigate();
//   const [t] = useTranslation("global");
//   const [content, setContent] = useState("");
//   const { data, isLoading, isError } = useGetSettingQuery("terms");
//   const [mutation, { isLoading: muLoading }] = useUpdateSettingsMutation();
//   const placeholder = "Enter your update terms & conditions...";
//   useEffect(() => {
//     if (data) {
//       setContent(data);
//     }
//   }, [data]);

//   const handleUpdate = async () => {
//     try {
//       await mutation({
//         body: {
//           description: content,
//         },
//         url: "terms/update",
//       }).unwrap();
//       toast.success("Successfully Updated!");
//       navigate(-1);
//     } catch (error) {
//       errorAlert({ error });
//     }
//   };
//   return (
//     <div className="min-h-[75vh] flex flex-col justify-between">
//       <div className="space-y-6">
//         <PageHeading
//           title={t("Edit") + " " + t("settings.terms")}
//           backPath={"/settings/terms-conditions"}
//         />
//         <LoaderWraperComp
//           isLoading={isLoading}
//           isError={isError}
//           className={"h-[50vh]"}
//         >
//           <QuillEditor
//             ref={editor}
//             theme="snow"
//             value={content}
//             onChange={(value) => setContent(value)}
//             placeholder={placeholder}
//             // style={{height: "50vh"}}
//           />
//         </LoaderWraperComp>
//       </div>
//       <div className="flex justify-end pt-10">
//         <Button
//           onClick={handleUpdate}
//           loading={muLoading}
//            type="primary"
//           htmlType="submit"
//           className="w-[400px] h-[56px]  placeholder:text-[#999999] text-[18px] font-medium"
//         >
//           {t("save")}
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default EditPrivacyPolicy;


const EditTermsConditions = () => {
  return (
    <div>EditTermsConditions</div>
  )
}

export default EditTermsConditions