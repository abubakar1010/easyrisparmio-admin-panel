import { Button, Form, Input, Popover, Upload } from "antd";
import type { UploadFile, UploadProps } from "antd";

import { useState } from "react";
import { IoCloudUploadOutline } from "react-icons/io5";
import { LuPencil } from "react-icons/lu";
import { PiDotsThreeOutlineVerticalBold } from "react-icons/pi";
import { useAppSelector } from "../../redux/hooks";
import { getRoleLabel } from "../../lib/helpers/getRoleLabel";
import type { TUserRole } from "../../types/common.type";
import ChangePassword from "../../components/ChangePassword";
import { cn } from "../../utils/cn";

const profileData = {
  name: "Enrique Khan",
  email: "enrique@gmail.com",
  phone: "+880 150597212",
};

const Settings = () => {
  const [form] = Form.useForm();
  const [editAble, setEditAble] = useState(false);
  const [openPopover, setOpenPopover] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imageUrl, setImageUrl] = useState<string>();
  const [passModalOpen, setPassModalOpen] = useState(false);
  const { user } = useAppSelector((state) => state.auth);

  const props: UploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    accept: "image/png,image/jpeg",
    beforeUpload: (file) => {
      setFileList([file]);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      return false;
    },
    showUploadList: false,
  };

  const content = (
    <div className="flex flex-col gap-2 py-1">
      <Button
        type="default"
        onClick={() => {
          setEditAble(true);
          setOpenPopover(false);
        }}
      >
        Edit Info
      </Button>
      <Button
        type="default"
        onClick={() => {
          setPassModalOpen(true);
          setOpenPopover(false);
        }}
      >
        Change Password
      </Button>
    </div>
  );
  return (
    <div className="min-h-[80vh] h-full w-full flex flex-col justify-center items-center ">
      <div className="w-fit bg-white min-h-[600px] xl:min-w-2xl flex flex-col justify-center items-center gap-8 rounded-lg px-6 py-10 drop-shadow-sm relative">
        <div className="absolute top-6 right-4">
          <Popover
            content={content}
            // title="Title"
            trigger="click"
            placement="bottomRight"
            onOpenChange={setOpenPopover}
            open={openPopover}
          >
            <button className="active:bg-slate-200 p-1.5 rounded-lg">
              <PiDotsThreeOutlineVerticalBold size={18} />
            </button>
          </Popover>
        </div>
        <Form
          form={form}
          name="basic"
          layout="vertical"
          className="w-full max-w-lg mx-auto"
          // onFinish={onFinish}
          autoComplete="off"
          initialValues={{
            name: profileData.name,
            email: profileData.email,
          }}
        >
          <div className="flex flex-col items-center justify-center mb-2">
            <div
              className={cn(
                "h-48 w-48 overflow-hidden rounded-full outline-2 outline-offset-1 outline-gray-300",
                {
                  "rounded-none": editAble,
                }
              )}
            >
              <img
                src={imageUrl || "/statics/demo.png"}
                alt=""
                className="w-full h-full object-center"
              />
            </div>
            {editAble && (
              <Upload {...props}>
                <Button
                  size="small"
                  type="link"
                  icon={<IoCloudUploadOutline />}
                  style={{ marginTop: 10 }}
                >
                  Select Image
                </Button>
              </Upload>
            )}
            <h4 className="text-2xl text-[#222222] mt-2">
              {getRoleLabel(user?.role as TUserRole)}
            </h4>
          </div>

          <Form.Item
            name="name"
            className="text-lg text-[#1F8D84] font-medium"
            label={"Name"}
          >
            <Input
              readOnly={!editAble}
              size="large"
              suffix={editAble ? <LuPencil size={15} /> : null}
            />
          </Form.Item>
          <Form.Item
            className="text-lg text-[#1F8D84] font-medium"
            label={"Email"}
            name="email"
          >
            <Input readOnly size="large" />
          </Form.Item>
          {!!editAble && (
            <div className="flex justify-center gap-3 px-3 pt-5 max-w-sm mx-auto">
              <Button
                onClick={() => {
                  setEditAble(false);
                  form.resetFields();
                }}
                className="w-full"
                style={{ height: 40 }}
              >
                Cancel
              </Button>
              <Button className="w-full" type="primary" style={{ height: 40 }}>
                Update
              </Button>
            </div>
          )}
        </Form>
        {/* <div className="w-full max-w-lg mx-auto pt-2 border-t">
        {settingsItem.map((setting, index) => (
          <div
            key={index}
            className="h-[64px] font-medium hover:bg-[#0804e528] py-4 mb-2 px-6 rounded-lg flex items-center justify-between cursor-pointer transition-all"
            onClick={() => navigate(setting.path)}
          >
            <h2 className="capitalize">{setting.title}</h2>
            <FaAngleRight size={16} />
          </div>
        ))}
      </div> */}
      </div>
      <ChangePassword
        isModalOpen={passModalOpen}
        setIsModalOpen={setPassModalOpen}
      />
    </div>
  );
};

export default Settings;
