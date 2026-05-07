import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import PageHeading from "../../../components/ui/PageHeading";
import { useAppSelector } from "../../../redux/hooks";

const TermsConditions = () => {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  // const { data, isLoading, isError } = useGetSettingQuery("terms");
  return (
    <div className="min-h-[85vh] flex flex-col justify-between">
      <div className="space-y-4">
        <PageHeading title={"Terms & Condition"} />
        {/* <LoaderWraperComp
          isLoading={isLoading}
          isError={isError}
          className={"min-h-[50vh]"}
        > */}
        <div
          className="no-tailwind"
          dangerouslySetInnerHTML={{ __html: "write here" }}
          style={{
            background: "white",
            minHeight: "50vh",
            padding: "20px",
            borderRadius: 5,
          }}
        ></div>
        {/* </LoaderWraperComp> */}
      </div>
      {user?.role === "admin" && (
        <div className="flex justify-end pt-10">
          <Button
            onClick={() => navigate("edit")}
            type="primary"
            htmlType="submit"
            className="w-[400px] h-[56px]  placeholder:text-[#999999] text-[18px] font-medium"
          >
            {"Edit"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TermsConditions;
