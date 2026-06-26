import { Modal } from "antd";
import type { ReactNode } from "react";
import { IoMdClose } from "react-icons/io";

type TDashboardModalProps = {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  onClose?: () => void;
  closeIcon?: boolean;
  children: ReactNode;
  maxWidth?: string;
};

const DashboardModal = ({
  isModalOpen,
  setIsModalOpen,
  onClose,
  closeIcon,
  children,
  maxWidth,
}: TDashboardModalProps) => {
  const handleCancel = () => {
    setIsModalOpen(false);
    if (onClose) onClose();
  };

  return (
    <Modal
      centered
      title={null}
      open={isModalOpen}
      onCancel={handleCancel}
      footer={null}
      closeIcon={false}
      width={"100%"}
      style={{
        maxWidth: maxWidth || "544px", // Apply dynamic maxWidth, default to 844px
      }}
    >
      {closeIcon !== false && (
        <button
          onClick={handleCancel}
          className="absolute top-4 right-8 text-red-500 shadow-inner bg-gray-100/30 rounded-full p-0.5"
        >
          <IoMdClose size={23} />
        </button>
      )}
      {children}
    </Modal>
  );
};

export default DashboardModal;
