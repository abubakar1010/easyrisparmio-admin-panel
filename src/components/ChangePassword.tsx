import i18n from "../i18n";
import { useTranslation } from "react-i18next";
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
  useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  // const [mutation, { isLoading }] = useChangePasswordByOldPassMutation();
  const onFinish: FormProps<FieldType>["onFinish"] = async (_values) => {
    try {
      // const response = await mutation(values).unwrap();
      form.resetFields();
      setIsModalOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };
  return (
    <DashboardModal setIsModalOpen={setIsModalOpen} isModalOpen={isModalOpen}>
      <div className="p-4">
        <CompHeading
          backPath={"/auth"}
          title={i18n.t("settings.change_password")}
          hideIcon={true}
        />
        <p className=" drop-shadow text-[#464343] my-3">
          {i18n.t("auth.password_must_be_8_10_chars")}
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
            label={<span className="font-medium text-base">{i18n.t("auth.old_password")}</span>}
            name="oldPassword"
            rules={[
              {
                required: true,
                message: i18n.t("auth.please_input_old_password"),
              },
            ]}
            hasFeedback
          >
            <Input.Password autoComplete="current-password" size="large" placeholder="**********" />
          </Form.Item>
          <Form.Item
            label={<span className="font-medium text-base">{i18n.t("client_management.new_password")}</span>}
            name="password"
            rules={[
              {
                required: true,
                message: i18n.t("auth.please_input_new_password"),
              },
            ]}
            hasFeedback
          >
            <Input.Password autoComplete="new-password" size="large" placeholder="**********" />
          </Form.Item>
          <Form.Item
            label={
              <span className="font-medium text-base">
                {i18n.t("auth.confirm_new_password")}
              </span>
            }
            name="confirmPassword"
            rules={[
              {
                required: true,
                message: i18n.t("auth.please_re_enter_new_password"),
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error(i18n.t("auth.passwords_do_not_match"))
                  );
                },
              }),
            ]}
            hasFeedback
          >
            <Input.Password autoComplete="new-password" size="large" placeholder="**********" />
          </Form.Item>
          <div className="text-end">
            <Button
              onClick={() => navigate(`/auth/forgot-password`)}
              size="small"
              type="link"
            >
              {i18n.t("audit.forgot_password")}
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
              {i18n.t("audit.save_password")}
            </Button>
          </div>
        </Form>
      </div>
    </DashboardModal>
  );
};

export default ChangePassword;
