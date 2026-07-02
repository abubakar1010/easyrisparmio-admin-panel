import { Button, Card, Form, Input, Upload, Avatar, Typography, message } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { useState } from "react";
import { FiUser, FiLock, FiSave } from "react-icons/fi";
import { useNavigate } from "react-router";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { getRoleLabel } from "../../lib/helpers/getRoleLabel";
import type { TUserRole } from "../../types/common.type";
import { useUpdateProfileMutation } from "../../redux/features/Auth/authApi";
import { setUser } from "../../redux/features/Auth/authSlice";

const { Title, Text } = Typography;

const Settings = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [profileForm] = Form.useForm();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imageUrl, setImageUrl] = useState<string>("/statics/profile.jpg");
  const { user } = useAppSelector((state) => state.auth);

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] || ""}`
    : "AD";

  const uploadProps: UploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    accept: "image/png,image/jpeg,image/gif",
    beforeUpload: (file) => {
      setFileList([file]);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      return false;
    },
    showUploadList: false,
  };

  return (
    <div className="max-w-[1200px] mx-auto p-4 sm:p-6 space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="mb-8">
        <Title level={2} className="mb-1! text-[24px]! font-semibold text-slate-800">
          Profile & Admin Settings
        </Title>
        <Text className="text-slate-500 text-[15px]">
          Manage your profile and system settings
        </Text>
      </div>

      {/* Admin Profile Card */}
      <Card
        className="rounded-xl border-slate-200 shadow-sm overflow-hidden"
        title={
          <div className="flex items-center gap-2 py-1">
            <FiUser className="text-[#8b85f6] text-lg" />
            <span className="text-[16px] font-semibold text-slate-700">Admin Profile</span>
          </div>
        }
        styles={{ header: { borderBottom: '1px solid #f1f5f9', padding: '16px 24px' }, body: { padding: '24px' } }}
      >
        <div className="flex flex-col gap-8">
          {/* Profile Photo Section */}
          <div className="flex items-center gap-6">
            <Avatar
              size={80}
              src={user?.avatar || imageUrl}
              className="border-2 border-slate-100 shadow-sm shrink-0"
            >
              {initials}
            </Avatar>
            <div className="flex flex-col gap-2">
              <Upload {...uploadProps}>
                <Button
                  className="bg-[#8b85f6] hover:bg-[#7a74e5]! border-none text-white font-medium rounded-lg px-6 h-10"
                >
                  Change Photo
                </Button>
              </Upload>
              <Text className="text-[13px] text-slate-400">
                JPG, GIF or PNG. Max size of 2MB
              </Text>
            </div>
          </div>

          {/* Profile Form */}
          <Form
            form={profileForm}
            layout="vertical"
            initialValues={{
              firstName: user?.firstName || "",
              lastName: user?.lastName || "",
              email: user?.email || "",
              phone: user?.phone || "",
              role: getRoleLabel(user?.role as TUserRole) || "Administrator",
            }}
            onFinish={async (values) => {
              try {
                const updated = await updateProfile({
                  firstName: values.firstName,
                  lastName: values.lastName,
                  phone: values.phone || undefined,
                }).unwrap();
                dispatch(setUser({ user: updated }));
                message.success("Profile updated");
              } catch {
                message.error("Failed to update profile");
              }
            }}
            className="w-full"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <Form.Item
                name="firstName"
                label={<span className="text-[14px] font-medium text-slate-600">First Name</span>}
                rules={[{ required: true, message: "Please enter your first name" }]}
              >
                <Input placeholder="First Name" className="h-11 rounded-lg border-slate-200" />
              </Form.Item>

              <Form.Item
                name="lastName"
                label={<span className="text-[14px] font-medium text-slate-600">Last Name</span>}
                rules={[{ required: true, message: "Please enter your last name" }]}
              >
                <Input placeholder="Last Name" className="h-11 rounded-lg border-slate-200" />
              </Form.Item>

              <Form.Item
                name="email"
                label={<span className="text-[14px] font-medium text-slate-600">Email Address</span>}
                rules={[
                  { required: true, message: "Please enter your email" },
                  { type: "email", message: "Please enter a valid email" }
                ]}
              >
                <Input placeholder="admin@example.com" className="h-11 rounded-lg border-slate-200" disabled />
              </Form.Item>

              <Form.Item
                name="phone"
                label={<span className="text-[14px] font-medium text-slate-600">Phone Number</span>}
              >
                <Input placeholder="+1 234 567 8900" className="h-11 rounded-lg border-slate-200" />
              </Form.Item>

              <Form.Item
                name="role"
                label={<span className="text-[14px] font-medium text-slate-600">Role</span>}
              >
                <Input placeholder="Administrator" className="h-11 rounded-lg border-slate-200" disabled />
              </Form.Item>
            </div>

            <Form.Item className="mb-0 mt-2">
              <Button
                type="primary"
                htmlType="submit"
                loading={isSaving}
                icon={<FiSave className="text-lg" />}
                className="bg-[#8b85f6] hover:bg-[#7a74e5]! border-none h-11 px-6 rounded-lg font-semibold flex items-center gap-2"
              >
                Save Changes
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Card>

      {/* Change Password Card */}
      <Card
        className="rounded-xl border-slate-200 shadow-sm overflow-hidden"
        title={
          <div className="flex items-center gap-2 py-1">
            <FiLock className="text-[#8b85f6] text-lg" />
            <span className="text-[16px] font-semibold text-slate-700">Change Password</span>
          </div>
        }
        styles={{ header: { borderBottom: '1px solid #f1f5f9', padding: '16px 24px' }, body: { padding: '24px' } }}
      >
        <div className="max-w-[440px]">
          <p className="text-slate-500 text-sm mb-6">
            To change your password, use the password reset flow.
          </p>
          <Button
            type="primary"
            onClick={() => navigate("/auth/forgot-password")}
            className="bg-[#8b85f6] hover:bg-[#7a74e5]! border-none h-11 px-8 rounded-lg font-semibold"
          >
            Reset Password
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
