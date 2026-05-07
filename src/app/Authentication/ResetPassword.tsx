import { Button, Form, Input, Modal } from "antd";
import { Link, useNavigate } from "react-router";
import { FiLock, FiChevronLeft, FiCheckCircle } from "react-icons/fi";
import { BrandLightningMark } from "../../components/ui/BrandLightningMark";
import { useState } from "react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const onFinish = (values: any) => {
    setLoading(true);
    console.log("Received new password: ", values);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setIsModalVisible(true);
    }, 1000);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    navigate("/auth/sign-in");
  };

  return (
    <>
      <div className="max-w-md w-full mx-auto md:mx-0">
        <div className="text-center md:text-left mb-6 sm:mb-8">
          <Link to="/auth/verify-email" className="inline-flex items-center text-gray-500 hover:text-gray-800 transition-colors mb-4 font-medium text-sm sm:text-base">
            <FiChevronLeft className="mr-2 text-xs" /> Back
          </Link>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 mb-2">
            <BrandLightningMark size="md" decorative className="scale-90 sm:scale-100" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Reset Password</h2>
          </div>
          <p className="text-gray-500">Please enter your new password and confirm it.</p>
        </div>

        <Form
          name="reset_password_form"
          layout="vertical"
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            label={<span className="font-medium text-gray-700">New Password</span>}
            name="password"
            rules={[
              { required: true, message: "Please input your new password!" },
              { min: 6, message: "Password must be at least 6 characters long!" }
            ]}
            className="mb-6"
          >
            <Input.Password prefix={<FiLock className="text-gray-400 mr-2" />} placeholder="Enter new password" className="rounded-lg h-12" />
          </Form.Item>

          <Form.Item
            label={<span className="font-medium text-gray-700">Confirm Password</span>}
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The new password that you entered do not match!'));
                },
              }),
            ]}
            className="mb-8"
          >
            <Input.Password prefix={<FiLock className="text-gray-400 mr-2" />} placeholder="Confirm new password" className="rounded-lg h-12" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" loading={loading} shape="round" className="w-full bg-[#6366f1] hover:bg-[#4f46e5] h-12 text-base font-semibold shadow-md border-none">
              Reset Password
            </Button>
          </Form.Item>
        </Form>
      </div>

      <Modal
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        closable={false}
        centered
        width={400}
        styles={{
          mask: {
            backdropFilter: 'blur(4px)',
          },
          content: {
            borderRadius: '16px',
            padding: '32px 24px',
          }
        }}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
            <FiCheckCircle className="text-5xl text-[#6366f1]" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Password Updated</h3>
          <p className="text-gray-500 mb-8">Your password has been changed successfully. You can now login with your new password.</p>
          <Button
            type="primary"
            size="large"
            shape="round"
            className="w-full bg-[#6366f1] hover:bg-[#4f46e5] h-12 text-base font-semibold border-none"
            onClick={handleModalClose}
          >
            Sign In
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default ResetPassword;
