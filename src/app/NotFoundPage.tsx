
import { Button, Result } from "antd";
import { useNavigate } from "react-router";

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex justify-center items-center">
      <Result
         status="warning"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <Button type="primary" onClick={() => navigate("/")}>
            Back Home
          </Button>
        }
      />
    </div>
  );
};

export default NotFoundPage;
