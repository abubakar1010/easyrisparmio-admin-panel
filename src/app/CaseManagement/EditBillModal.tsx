import { useEffect, useMemo } from "react";
import { App, Modal, Form } from "antd";
import type { IBill } from "../../redux/features/Bills/billApi";
import { useUpdateBillAdminMutation } from "../../redux/features/Bills/billApi";
import BillFields from "./BillFields";
import { billInitialValues, diffBillValues } from "./billFieldValues";

interface EditBillModalProps {
  bill: IBill | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Corrects what was read off the bill.
 *
 * The fields themselves live in `billFields`, because the Case Overview modal
 * edits the same ones: the supply point the switch is filed against is bill
 * data, and an admin fixing a digit in a POD should not have to work out which
 * tab owns it. One definition, so the two can never mean different things.
 */
export default function EditBillModal({ bill, open, onClose }: EditBillModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [updateBill, { isLoading }] = useUpdateBillAdminMutation();

  const isElectricity = bill?.billType === "electricity";

  const initialValues = useMemo(() => billInitialValues(bill), [bill]);

  useEffect(() => {
    if (open && bill) {
      form.setFieldsValue(initialValues);
    }
  }, [open, bill, form, initialValues]);

  const handleSubmit = async () => {
    if (!bill) return;
    try {
      const values = await form.validateFields();
      const changed = diffBillValues(values, initialValues);

      if (Object.keys(changed).length === 0) {
        message.info("No changes detected");
        return;
      }

      await updateBill({ billId: bill.id, data: changed }).unwrap();
      message.success("Bill data updated successfully");
      onClose();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string | string[] } };
      if (e?.data) {
        const msg = e.data.message;
        message.error((Array.isArray(msg) ? msg[0] : msg) || "Failed to update bill");
      }
    }
  };

  return (
    <Modal
      title="Edit Bill Data"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Save Changes"
      confirmLoading={isLoading}
      width={720}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4 max-h-[65vh] overflow-y-auto pr-2">
        <BillFields isElectricity={isElectricity} />
      </Form>
    </Modal>
  );
}
