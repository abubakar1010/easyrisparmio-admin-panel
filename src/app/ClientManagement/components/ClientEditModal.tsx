import { useEffect, useState } from "react";
import { Button, Form, Input, Modal, Select } from "antd";
import type { ClientRow, CustomerType } from "../types";

type ClientEditModalProps = {
  open: boolean;
  onClose: () => void;
  client: ClientRow | null;
};

export function ClientEditModal({ open, onClose, client }: ClientEditModalProps) {
  const [customerType, setCustomerType] = useState<CustomerType>("Private");
  const [form] = Form.useForm();

  useEffect(() => {
    if (!client) return;
    setCustomerType(client.type);
    form.setFieldsValue({
      fullName: client.name,
      email: client.email,
      phone: client.phone,
      fiscalCode: "FRRLRA85M50H501Y",
      streetAddress: "Corso Italia 78",
      city: "Torino",
      postalCode: "10121",
      operator: client.operator,
    });
  }, [client, form]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={780}
      centered
      destroyOnClose
      title="Edit customer"
    >
      <Form form={form} layout="vertical" onFinish={onClose} className="pt-2">
        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold text-brand">Customer Type *</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setCustomerType("Private")}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                customerType === "Private"
                  ? "border-primary bg-primary/5 shadow-[0_0_0_1px_rgba(102,89,239,0.25)]"
                  : "border-cborder/60 bg-gray-50/60"
              }`}
            >
              <p className="font-semibold text-brand">Private</p>
              <p className="text-sm text-owngray">Individual customer</p>
            </button>
            <button
              type="button"
              onClick={() => setCustomerType("Business")}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                customerType === "Business"
                  ? "border-primary bg-primary/5 shadow-[0_0_0_1px_rgba(102,89,239,0.25)]"
                  : "border-cborder/60 bg-gray-50/60"
              }`}
            >
              <p className="font-semibold text-brand">Business</p>
              <p className="text-sm text-owngray">Company or organization</p>
            </button>
          </div>
        </div>

        <p className="mb-2 text-base font-semibold text-brand">Basic Information</p>
        <Form.Item name="fullName" label="Full Name *" className="mb-3" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <div className="grid gap-3 sm:grid-cols-2">
          <Form.Item name="email" label="Email *" className="mb-3" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone *" className="mb-3" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </div>

        <p className="mb-2 text-base font-semibold text-brand">Tax Information</p>
        <Form.Item
          name="fiscalCode"
          label="Fiscal Code *"
          className="mb-3"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <p className="mb-2 text-base font-semibold text-brand">Address</p>
        <Form.Item
          name="streetAddress"
          label="Street Address *"
          className="mb-3"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <div className="grid gap-3 sm:grid-cols-2">
          <Form.Item name="city" label="City *" className="mb-3" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="postalCode"
            label="Postal Code *"
            className="mb-3"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
        </div>

        <p className="mb-2 text-base font-semibold text-brand">Assignment</p>
        <Form.Item
          name="operator"
          label="Assigned Operator *"
          className="mb-4"
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { value: "Anna Bianchi", label: "Anna Bianchi" },
              { value: "Marco Verdi", label: "Marco Verdi" },
              { value: "Sofia Romano", label: "Sofia Romano" },
            ]}
          />
        </Form.Item>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit">
            Save Changes
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
