import { Button, Form, Input } from "antd";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { FiChevronLeft } from "react-icons/fi";
import { useState, useEffect, useCallback } from "react";
import {
  useVerifyOtpMutation,
  useResendOtpMutation,
} from "../../redux/features/Auth/authApi";
import { successAlert, errorAlert } from "../../lib/helpers/alert";

type LocationState = {
  email?: string;
  verificationToken?: string;
  type?: string;
};

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || !state) return;
    try {
      const payload: { email?: string; verificationToken?: string; type: string } = {
        type: state.type || "email_verification",
      };
      if (state.verificationToken) {
        payload.verificationToken = state.verificationToken;
      } else if (state.email) {
        payload.email = state.email;
      }
      await resendOtp(payload).unwrap();
      successAlert({ message: "OTP has been resent to your email." });
      setCooldown(60);
    } catch (err) {
      errorAlert({ error: err as { data?: { message?: string | string[] } } });
    }
  }, [cooldown, state, resendOtp]);

  if (!state?.email && !state?.verificationToken) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  const onFinish = async (values: { otp: string }) => {
    try {
      const payload: {
        email?: string;
        verificationToken?: string;
        code: string;
        type: string;
      } = {
        code: values.otp,
        type: state?.type || "email_verification",
      };

      if (state?.verificationToken) {
        payload.verificationToken = state.verificationToken;
      } else if (state?.email) {
        payload.email = state.email;
      }

      const result = await verifyOtp(payload).unwrap();

      if (state?.type === "password_reset") {
        navigate("/auth/reset-password", {
          state: { resetToken: result.resetToken },
        });
      } else {
        successAlert({ message: "Email verified successfully!" });
        navigate("/auth/sign-in");
      }
    } catch (err) {
      errorAlert({ error: err as { data?: { message?: string | string[] } } });
    }
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

      {state?.email && (
        <p className="text-gray-500 mb-6 text-sm">
          Enter the 6-digit code sent to <strong>{state.email}</strong>
        </p>
      )}

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
          className="mb-6"
        >
          <Input.OTP length={6} size="large" />
        </Form.Item>

        <div className="mb-6 text-center">
          <Button
            type="link"
            disabled={cooldown > 0 || isResending}
            loading={isResending}
            onClick={handleResend}
            className="text-[#4f46e5] hover:text-[#4338ca] font-medium text-sm p-0"
          >
            {cooldown > 0
              ? `Resend OTP in ${cooldown}s`
              : "Resend OTP"}
          </Button>
        </div>

        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
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
