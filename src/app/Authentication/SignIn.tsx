import { Button, Checkbox, Input, Form } from "antd";
import { Link, useNavigate } from "react-router";
import { FiMail, FiLock } from "react-icons/fi";
import { BrandLightningMark } from "../../components/ui/BrandLightningMark";

const SignIn = () => {
  const navigate = useNavigate();

  const onFinish = (values: any) => {
    console.log("Received values of form: ", values);
    navigate("/");
  };

  return (
    <div className="max-w-md w-full mx-auto md:mx-0">
      <div className="text-center md:text-left mb-6 sm:mb-8">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 mb-2">
          <BrandLightningMark size="md" decorative className="scale-90 sm:scale-100" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Login</h2>
        </div>
        <p className="text-gray-500">Please enter your email and password to continue!</p>
      </div>

      <Form
        name="login_form"
        layout="vertical"
        initialValues={{ remember: true }}
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
        >
          <Input prefix={<FiMail className="text-gray-400 mr-2" />} placeholder="Enter your email" className="rounded-lg h-12" />
        </Form.Item>

        <Form.Item
          label={<span className="font-medium text-gray-700">Password</span>}
          name="password"
          rules={[{ required: true, message: "Please input your Password!" }]}
          className="mb-4"
        >
          <Input.Password prefix={<FiLock className="text-gray-400 mr-2" />} placeholder="Enter your password" className="rounded-lg h-12" />
        </Form.Item>

        <div className="flex items-center justify-between mb-8">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox className="text-gray-600">Remember me</Checkbox>
          </Form.Item>

          <Link to="/auth/forgot-password" className="text-[#6366f1] hover:text-[#4f46e5] font-medium text-sm transition-colors">
            Forgot password?
          </Link>
        </div>

        <Form.Item className="mb-0">
          <Button type="primary" htmlType="submit" shape="round" className="w-full bg-[#6366f1] hover:bg-[#4f46e5] h-12 text-base font-semibold shadow-md border-none">
            Log In
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default SignIn;
