import { Button, Form, Input } from "antd";
import type {  FormProps, } from "antd";
import { useNavigate } from "react-router";
import DashboardModal from "./DashboardModal";
import CompHeading from "./ui/CompHeading";
type FieldType = {
  oldPassword: string;
  password: string;
  confirmPassword: string;
};
const ChangePassword = ({
  isModalOpen,
  setIsModalOpen,
}: {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  // const [mutation, { isLoading }] = useChangePasswordByOldPassMutation();
  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    try {
      console.log(values);
      // const response = await mutation(values).unwrap();
      form.resetFields();
      setIsModalOpen(false);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <DashboardModal setIsModalOpen={setIsModalOpen} isModalOpen={isModalOpen}>
      <div className="p-4">
        <CompHeading
          backPath={"/auth"}
          title={"Change Password"}
          hideIcon={true}
        />
        <p className=" drop-shadow text-[#464343] my-3">
          Your password must be 8-10 character long.
        </p>
        <Form
          name="normal_login"
          layout="vertical"
          initialValues={{
            remember: true,
          }}
          requiredMark={false}
          onFinish={onFinish}
        >
          <Form.Item
            label={<span className="font-medium text-base">Old Password</span>}
            name="oldPassword"
            rules={[
              {
                required: true,
                message: "Please input old password!",
              },
            ]}
            hasFeedback
          >
            <Input.Password size="large" placeholder="**********" />
          </Form.Item>
          <Form.Item
            label={<span className="font-medium text-base">New Password</span>}
            name="password"
            rules={[
              {
                required: true,
                message: "Please input new password!",
              },
            ]}
            hasFeedback
          >
            <Input.Password size="large" placeholder="**********" />
          </Form.Item>
          <Form.Item
            label={
              <span className="font-medium text-base">
                Confirm New Password
              </span>
            }
            name="confirmPassword"
            rules={[
              {
                required: true,
                message: "Please Re-Enter new password!",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("The new password that you entered do not match!")
                  );
                },
              }),
            ]}
            hasFeedback
          >
            <Input.Password size="large" placeholder="**********" />
          </Form.Item>
          <div className="text-end">
            <Button
              onClick={() => navigate(`/auth/forgot-password`)}
              size="small"
              type="link"
            >
              Forgot Password ?
            </Button>
          </div>
          <div className="w-full flex justify-center pt-4 ">
            <Button
              // loading={isLoading}
              type="primary"
              size="large"
              htmlType="submit"
              className="w-full px-2 "
            >
              Save Password
            </Button>
          </div>
        </Form>
      </div>
    </DashboardModal>
  );
};

export default ChangePassword;
