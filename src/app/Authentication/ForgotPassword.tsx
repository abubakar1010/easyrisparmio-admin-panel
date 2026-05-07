import { Button, Input, Form } from "antd";
import { Link, useNavigate } from "react-router";
import { FiMail, FiChevronLeft } from "react-icons/fi";
import { BrandLightningMark } from "../../components/ui/BrandLightningMark";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const onFinish = (values: any) => {
    console.log("Received values of form: ", values);
    navigate("/auth/verify-email");
  };

  return (
    <div className="max-w-md w-full mx-auto md:mx-0">
      <div className="text-center md:text-left mb-6 sm:mb-8">
        <Link to="/auth/sign-in" className="inline-flex items-center text-gray-500 hover:text-gray-800 transition-colors mb-4 font-medium text-sm sm:text-base">
          <FiChevronLeft className="mr-2 text-xs" /> Back to Login
        </Link>
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 mb-2">
          <BrandLightningMark size="md" decorative className="scale-90 sm:scale-100" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Forgot Password</h2>
        </div>
        <p className="text-gray-500">Enter your email address to get a verification code for resetting your password.</p>
      </div>

      <Form
        name="forgot_password_form"
        layout="vertical"
        onFinish={onFinish}
        size="large"
      >
        <Form.Item
          label={<span className="font-medium text-gray-700">Email</span>}
          name="email"
          rules={[
            { required: true, message: "Please input your Email!" },
            { type: "email", message: "Please enter a valid email!" }
          ]}
          className="mb-8"
        >
          <Input prefix={<FiMail className="text-gray-400 mr-2" />} placeholder="Enter your email" className="rounded-lg h-12" />
        </Form.Item>

        <Form.Item className="mb-0">
          <Button type="primary" htmlType="submit" shape="round" className="w-full bg-[#6366f1] hover:bg-[#4f46e5] h-12 text-base font-semibold shadow-md border-none">
            Send OTP
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ForgotPassword;
