import { Button, Form, Input } from "antd";
import { Link, useNavigate } from "react-router";
import { FiChevronLeft } from "react-icons/fi";
import { BrandLightningMark } from "../../components/ui/BrandLightningMark";
import { useState } from "react";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = (values: any) => {
    setLoading(true);
    console.log("Received OTP: ", values);
    setTimeout(() => {
      setLoading(false);
      navigate("/auth/reset-password");
    }, 1000);
  };

  return (
    <div className="max-w-md w-full mx-auto md:mx-0">
      <div className="text-center md:text-left mb-6 sm:mb-8">
        <Link to="/auth/forgot-password" className="inline-flex items-center text-gray-500 hover:text-gray-800 transition-colors mb-4 font-medium text-sm sm:text-base">
          <FiChevronLeft className="mr-2 text-xs" /> Back
        </Link>
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 mb-2">
          <BrandLightningMark size="md" decorative className="scale-90 sm:scale-100" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Verify Email</h2>
        </div>
        <p className="text-gray-500">We have sent a 6-digit OTP to your email. Please enter it below to verify.</p>
      </div>

      <Form
        name="verify_email_form"
        layout="vertical"
        onFinish={onFinish}
        size="large"
      >
        <Form.Item
          name="otp"
          rules={[{ required: true, message: "Please input the OTP!" }]}
          className="mb-8 flex justify-center"
        >
          <div className="auth-otp-square-cells">
            <Input.OTP length={6} size="large" />
          </div>
        </Form.Item>

        <Form.Item className="mb-0">
          <Button type="primary" htmlType="submit" loading={loading} shape="round" className="w-full bg-[#6366f1] hover:bg-[#4f46e5] h-12 text-base font-semibold shadow-md border-none">
            Verify OTP
          </Button>
        </Form.Item>
      </Form>

      <div className="mt-6 text-center md:text-left text-sm text-gray-500">
        Didn't receive the code?{" "}
        <button
          type="button"
          className="text-[#6366f1] font-medium ml-1 cursor-pointer rounded-full border border-transparent px-4 py-2 text-sm transition-colors hover:bg-indigo-50 hover:border-indigo-100 hover:underline"
        >
          Resend
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;
