import { Button, Form, Input } from "antd";
import { Link, useNavigate } from "react-router";
import { FiChevronLeft } from "react-icons/fi";
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
      <Link
        to="/auth/forgot-password"
        className="inline-flex items-center gap-2 text-3xl sm:text-4xl font-bold text-gray-900 mb-8 hover:text-gray-700 transition-colors"
      >
        <FiChevronLeft className="text-2xl sm:text-3xl" />
        <span>Verify Email</span>
      </Link>

      <Form
        name="verify_email_form"
        layout="vertical"
        onFinish={onFinish}
        size="large"
        requiredMark={false}
      >
        <Form.Item
          name="otp"
          rules={[{ required: true, message: "Please input the OTP!" }]}
          className="mb-10"
        >
          <div className="auth-otp-square-cells">
            <Input.OTP length={6} size="large" />
          </div>
        </Form.Item>

        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="auth-pill-button w-full border-none"
          >
            Verify OTP
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default VerifyEmail;
