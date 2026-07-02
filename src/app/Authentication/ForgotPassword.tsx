import { Button, Input, Form } from "antd";
import { Link, useNavigate } from "react-router";
import { FiMail, FiChevronLeft } from "react-icons/fi";
import { useForgotPasswordMutation } from "../../redux/features/Auth/authApi";
import { successAlert, errorAlert } from "../../lib/helpers/alert";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const onFinish = async (values: { email: string }) => {
    try {
      const result = await forgotPassword({ email: values.email }).unwrap();
      successAlert({ message: result.message });
      navigate("/auth/verify-email", {
        state: { email: values.email, type: "password_reset" },
      });
    } catch (err) {
      errorAlert({ error: err as { data?: { message?: string | string[] } } });
    }
  };

  return (
    <div className="max-w-md w-full mx-auto md:mx-0">
      <Link
        to="/auth/sign-in"
        className="inline-flex items-center gap-2 text-3xl sm:text-4xl font-bold text-gray-900 mb-8 hover:text-gray-700 transition-colors"
      >
        <FiChevronLeft className="text-2xl sm:text-3xl" />
        <span>Forget Password</span>
      </Link>

      <Form
        name="forgot_password_form"
        layout="vertical"
        onFinish={onFinish}
        size="large"
        requiredMark={false}
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: "Please input your Email!" },
            { type: "email", message: "Please enter a valid email!" },
          ]}
          className="mb-10"
        >
          <Input
            prefix={<FiMail />}
            placeholder="Email"
            className="auth-pill-input"
          />
        </Form.Item>

        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            className="auth-pill-button w-full border-none"
          >
            Send OTP
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ForgotPassword;
