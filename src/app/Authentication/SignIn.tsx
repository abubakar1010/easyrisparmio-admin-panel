import { Button, Input, Form } from "antd";
import { Link, useNavigate } from "react-router";
import { FiMail, FiLock } from "react-icons/fi";

const SignIn = () => {
  const navigate = useNavigate();

  const onFinish = (values: any) => {
    console.log("Received values of form: ", values);
    navigate("/");
  };

  return (
    <div className="max-w-md w-full mx-auto md:mx-0">
      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">Login</h2>

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
            { required: true, message: "Please input your Email!" },
            { type: "email", message: "Please enter a valid email!" },
          ]}
          className="mb-5"
        >
          <Input
            prefix={<FiMail />}
            placeholder="Email"
            className="auth-pill-input"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: "Please input your Password!" }]}
          className="mb-3"
        >
          <Input.Password
            prefix={<FiLock />}
            placeholder="Password"
            className="auth-pill-input"
          />
        </Form.Item>

        <div className="mb-10">
          <Link
            to="/auth/forgot-password"
            className="text-[#4f46e5] hover:text-[#4338ca] font-medium text-sm transition-colors"
          >
            Forget password?
          </Link>
        </div>

        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            className="auth-pill-button w-full border-none"
          >
            Log in
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default SignIn;
