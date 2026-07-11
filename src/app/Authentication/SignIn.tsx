import { Button, Input, Form } from "antd";
import { Link, useNavigate } from "react-router";
import { FiMail, FiLock } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { usePostLoginMutation } from "../../redux/features/Auth/authApi";
import { useAppDispatch } from "../../redux/hooks";
import { setLogin } from "../../redux/features/Auth/authSlice";
import { errorAlert } from "../../lib/helpers/alert";

const SignIn = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = usePostLoginMutation();

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      const result = await login({
        email: values.email,
        password: values.password,
      }).unwrap();

      if (result.user.role !== "admin") {
        errorAlert({
          error: {
            data: { message: t("auth.dashboard_admin_only") },
          },
        });
        return;
      }

      dispatch(
        setLogin({
          user: result.user,
          token: result.accessToken,
          refreshToken: result.refreshToken,
        })
      );
      navigate("/");
    } catch (err: unknown) {
      const error = err as {
        status?: number;
        data?: {
          message?: string | string[];
          data?: { verificationToken?: string };
        };
      };

      if (error?.status === 403 && error?.data?.data?.verificationToken) {
        navigate("/auth/verify-email", {
          state: {
            email: values.email,
            verificationToken: error.data.data.verificationToken,
            type: "email_verification",
          },
        });
        return;
      }

      errorAlert({
        error: {
          data: {
            message:
              error?.status === 401
                ? t("auth.invalid_email_password")
                : t("auth.login_failed"),
          },
        },
      });
    }
  };

  return (
    <div className="max-w-md w-full mx-auto md:mx-0">
      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">{t("auth.login")}</h2>

      <Form
        name="login_form"
        layout="vertical"
        onFinish={onFinish}
        size="large"
        requiredMark={false}
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: t("auth.please_input_email") },
            { type: "email", message: t("auth.please_enter_valid_email") },
          ]}
          className="mb-5"
        >
          <Input
            prefix={<FiMail />}
            placeholder={t("auth.email")}
            className="auth-pill-input"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: t("auth.please_input_password") }]}
          className="mb-3"
        >
          <Input.Password
            prefix={<FiLock />}
            placeholder={t("auth.password")}
            className="auth-pill-input"
          />
        </Form.Item>

        <div className="mb-10">
          <Link
            to="/auth/forgot-password"
            className="text-[#4f46e5] hover:text-[#4338ca] font-medium text-sm transition-colors"
          >
            {t("auth.forget_password")}
          </Link>
        </div>

        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            className="auth-pill-button w-full border-none"
          >
            {t("auth.login")}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default SignIn;
