import { Button, Form, Input, Modal } from "antd";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { FiLock, FiChevronLeft } from "react-icons/fi";
import { MdVerified } from "react-icons/md";
import { useState } from "react";
import { useResetPasswordMutation } from "../../redux/features/Auth/authApi";
import { errorAlert } from "../../lib/helpers/alert";

type LocationState = {
  resetToken?: string;
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [isModalVisible, setIsModalVisible] = useState(false);

  if (!state?.resetToken) {
    return <Navigate to="/auth/forgot-password" replace />;
  }

  const onFinish = async (values: { password: string }) => {
    try {
      await resetPassword({
        resetToken: state.resetToken!,
        newPassword: values.password,
      }).unwrap();
      setIsModalVisible(true);
    } catch (err) {
      errorAlert({ error: err as { data?: { message?: string | string[] } } });
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    navigate("/auth/sign-in");
  };

  return (
    <>
      <div className="max-w-md w-full mx-auto md:mx-0">
        <Link
          to="/auth/verify-email"
          className="inline-flex items-center gap-2 text-3xl sm:text-4xl font-bold text-gray-900 mb-8 hover:text-gray-700 transition-colors"
        >
          <FiChevronLeft className="text-2xl sm:text-3xl" />
          <span>Reset Password</span>
        </Link>

        <Form
          name="reset_password_form"
          layout="vertical"
          onFinish={onFinish}
          size="large"
          requiredMark={false}
        >
          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Please input your new password!" },
              { min: 8, message: "Password must be at least 8 characters long!" },
            ]}
            className="mb-5"
          >
            <Input.Password
              prefix={<FiLock />}
              placeholder="Set Your Password"
              className="auth-pill-input"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password!" },
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
            className="mb-10"
          >
            <Input.Password
              prefix={<FiLock />}
              placeholder="Re - Enter your  New Password"
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
        width={360}
        styles={{
          mask: { background: "rgba(0,0,0,0.35)" },
          content: { borderRadius: "16px", padding: "28px 24px" },
        }}
      >
        <div className="flex flex-col items-center text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Password Updated
          </h3>
          <p className="text-gray-500 mb-6">Your password has been changed successfully</p>

          <div className="relative my-2 mb-8 w-24 h-24 flex items-center justify-center">
            <span className="absolute top-2 -left-1 w-2 h-2 rounded-full bg-indigo-200" />
            <span className="absolute top-3 -right-2 w-2.5 h-2.5 rounded-full bg-indigo-300" />
            <span className="absolute -bottom-1 left-0 w-1.5 h-1.5 rounded-full bg-indigo-200" />
            <span className="absolute -bottom-2 right-2 w-2 h-2 rounded-full bg-indigo-200" />
            <MdVerified className="text-[#6366f1]" size={96} />
          </div>

          <Button
            type="primary"
            size="large"
            onClick={handleModalClose}
            className="w-full border-none font-semibold"
            style={{
              height: 48,
              borderRadius: 10,
              background: "#6366f1",
            }}
          >
            Back To Login
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default ResetPassword;
