import i18n from "../i18n";
import { useTranslation } from "react-i18next";

import { Button, Result } from "antd";
import { useNavigate } from "react-router";

const NotFoundPage = () => {
  useTranslation();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex justify-center items-center">
      <Result
         status="warning"
        title="404"
        subTitle={i18n.t("page_not_found.description")}
        extra={
          <Button type="primary" onClick={() => navigate("/")}>
            {i18n.t("page_not_found.back_home")}
          </Button>
        }
      />
    </div>
  );
};

export default NotFoundPage;
