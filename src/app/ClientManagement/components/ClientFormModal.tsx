import { useEffect, useState } from "react";
import { Button, Form, Input, Modal } from "antd";
import type { CustomerType, IClient, ICreateClient, IUpdateClient } from "../types";
import { typeToRole } from "../types";
import { useCreateClientMutation, useUpdateClientMutation } from "../../../redux/features/Users/clientApi";
import { successAlert, errorAlert } from "../../../lib/helpers/alert";

type ClientFormModalProps = {
  open: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  client?: IClient | null;
};

export function ClientFormModal({ open, onClose, mode, client = null }: ClientFormModalProps) {
  const [customerType, setCustomerType] = useState<CustomerType>("Private");
  const [form] = Form.useForm();
  const isEdit = mode === "edit";

  const [createClient, { isLoading: creating }] = useCreateClientMutation();
  const [updateClient, { isLoading: updating }] = useUpdateClientMutation();

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setCustomerType("Private");
      return;
    }

    if (isEdit && client) {
      setCustomerType(client.role === "business" ? "Business" : "Private");
      const primaryAddress = client.addresses?.[0];
      form.setFieldsValue({
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        fiscalCode: client.codiceFiscale,
        streetAddress: primaryAddress?.streetAddress,
        city: primaryAddress?.city,
        postalCode: primaryAddress?.postalCode,
        companyName: client.businessProfile?.companyName,
        partitaIva: client.businessProfile?.partitaIva,
        pecEmail: client.businessProfile?.pecEmail,
      });
      return;
    }

    form.resetFields();
    setCustomerType("Private");
  }, [client, form, isEdit, open]);

  const handleSubmit = async (values: Record<string, string>) => {
    try {
      if (isEdit && client) {
        const updateData: IUpdateClient = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone || undefined,
          codiceFiscale: values.fiscalCode || undefined,
          role: typeToRole[customerType],
        };
        if (customerType === "Business") {
          updateData.companyName = values.companyName;
          updateData.partitaIva = values.partitaIva;
          updateData.pecEmail = values.pecEmail || undefined;
        }
        await updateClient({ id: client.id, data: updateData }).unwrap();
        successAlert({ message: "Client updated successfully" });
      } else {
        const createData: ICreateClient = {
          email: values.email,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone || undefined,
          role: typeToRole[customerType],
          codiceFiscale: values.fiscalCode || undefined,
        };
        if (customerType === "Business") {
          createData.companyName = values.companyName;
          createData.partitaIva = values.partitaIva;
          createData.pecEmail = values.pecEmail || undefined;
        }
        if (values.streetAddress && values.city && values.postalCode) {
          createData.address = {
            streetAddress: values.streetAddress,
            city: values.city,
            postalCode: values.postalCode,
          };
        }
        await createClient(createData).unwrap();
        successAlert({ message: "Client created successfully" });
      }
      onClose();
    } catch (err) {
      errorAlert({ error: err as { data?: { message?: string } } });
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={780}
      centered
      destroyOnClose
      title={isEdit ? "Edit customer" : "Add new customer"}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="pt-2">
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
        <div className="grid gap-3 sm:grid-cols-2">
          <Form.Item name="firstName" label="First Name *" className="mb-3" rules={[{ required: true, message: "First name is required" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name *" className="mb-3" rules={[{ required: true, message: "Last name is required" }]}>
            <Input />
          </Form.Item>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Form.Item name="email" label="Email *" className="mb-3" rules={[{ required: true, type: "email", message: "Valid email is required" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone" className="mb-3">
            <Input />
          </Form.Item>
        </div>

        {!isEdit && (
          <Form.Item
            name="password"
            label="Password *"
            className="mb-3"
            rules={[{ required: true, min: 8, message: "Password must be at least 8 characters" }]}
          >
            <Input.Password />
          </Form.Item>
        )}

        {customerType === "Business" && (
          <>
            <p className="mb-2 text-base font-semibold text-brand">Business Information</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Form.Item name="companyName" label="Company Name *" className="mb-3" rules={[{ required: true, message: "Company name is required" }]}>
                <Input />
              </Form.Item>
              <Form.Item name="partitaIva" label="Partita IVA *" className="mb-3" rules={[{ required: true, pattern: /^\d{11}$/, message: "Must be 11 digits" }]}>
                <Input />
              </Form.Item>
            </div>
            <Form.Item name="pecEmail" label="PEC Email" className="mb-3">
              <Input />
            </Form.Item>
          </>
        )}

        <p className="mb-2 text-base font-semibold text-brand">Tax Information</p>
        <Form.Item name="fiscalCode" label="Fiscal Code" className="mb-3">
          <Input />
        </Form.Item>

        <p className="mb-2 text-base font-semibold text-brand">Address</p>
        <Form.Item name="streetAddress" label="Street Address" className="mb-3">
          <Input />
        </Form.Item>
        <div className="grid gap-3 sm:grid-cols-2">
          <Form.Item name="city" label="City" className="mb-3">
            <Input />
          </Form.Item>
          <Form.Item name="postalCode" label="Postal Code" className="mb-4">
            <Input />
          </Form.Item>
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={creating || updating}>
            {isEdit ? "Save Changes" : "Create Customer"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
