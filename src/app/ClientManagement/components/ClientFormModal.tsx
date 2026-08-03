import { useEffect, useState } from "react";
import { Button, Form, Input, Modal, Select } from "antd";
import { useTranslation } from "react-i18next";
import type { CustomerType, IClient, ICreateClient, IUpdateClient } from "../types";
import { typeToRole } from "../types";
import { useCreateClientMutation, useUpdateClientMutation } from "../../../redux/features/Users/clientApi";
import { successAlert, errorAlert } from "../../../lib/helpers/alert";
import { PhoneInput, phoneValidationRule } from "../../../components/ui/PhoneInput";
import { PROVINCE_OPTIONS } from "../../../constants/italianProvinces";

type ClientFormModalProps = {
  open: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  client?: IClient | null;
};

export function ClientFormModal({ open, onClose, mode, client = null }: ClientFormModalProps) {
  const { t } = useTranslation();
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
        province: primaryAddress?.province,
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
        successAlert({ message: t("client_management.client_updated_successfully") });
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
            province: values.province || undefined,
            postalCode: values.postalCode,
          };
        }
        await createClient(createData).unwrap();
        successAlert({ message: t("client_management.client_created_successfully") });
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
      title={isEdit ? t("client_management.edit_customer") : t("client_management.add_new_customer")}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="pt-2">
        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold text-brand">{t("client_management.customer_type")} *</p>
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
              <p className="font-semibold text-brand">{t("client_management.private")}</p>
              <p className="text-sm text-owngray">{t("client_management.individual_customer")}</p>
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
              <p className="font-semibold text-brand">{t("client_management.business")}</p>
              <p className="text-sm text-owngray">{t("client_management.company_organization")}</p>
            </button>
          </div>
        </div>

        <p className="mb-2 text-base font-semibold text-brand">{t("client_management.basic_information")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Form.Item name="firstName" label={`${t("client_management.first_name")} *`} className="mb-3" rules={[{ required: true, message: t("client_management.first_name_required") }]}>
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label={`${t("client_management.last_name")} *`} className="mb-3" rules={[{ required: true, message: t("client_management.last_name_required") }]}>
            <Input />
          </Form.Item>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Form.Item name="email" label={`${t("client_management.email_label")} *`} className="mb-3" rules={[{ required: true, type: "email", message: t("client_management.valid_email_required") }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label={t("client_management.phone")} className="mb-3" rules={[phoneValidationRule(t("client_management.invalid_phone"))]}>
            <PhoneInput />
          </Form.Item>
        </div>

        {!isEdit && (
          <Form.Item
            name="password"
            label={`${t("client_management.password_label")} *`}
            className="mb-3"
            rules={[{ required: true, min: 8, message: t("client_management.password_required") }]}
          >
            <Input.Password />
          </Form.Item>
        )}

        {customerType === "Business" && (
          <>
            <p className="mb-2 text-base font-semibold text-brand">{t("client_management.business_information")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Form.Item name="companyName" label={`${t("client_management.company_name")} *`} className="mb-3" rules={[{ required: true, message: t("client_management.company_name_required") }]}>
                <Input />
              </Form.Item>
              <Form.Item name="partitaIva" label={`${t("client_management.partita_iva")} *`} className="mb-3" rules={[{ required: true, pattern: /^\d{11}$/, message: t("client_management.partita_iva_digits") }]}>
                <Input />
              </Form.Item>
            </div>
            <Form.Item name="pecEmail" label={t("client_management.pec_email")} className="mb-3">
              <Input />
            </Form.Item>
          </>
        )}

        <p className="mb-2 text-base font-semibold text-brand">{t("client_management.tax_information")}</p>
        <Form.Item name="fiscalCode" label={t("client_management.fiscal_code")} className="mb-3">
          <Input />
        </Form.Item>

        <p className="mb-2 text-base font-semibold text-brand">{t("home.address")}</p>
        <Form.Item name="streetAddress" label={t("client_management.street_address")} className="mb-3">
          <Input />
        </Form.Item>
        <div className="grid gap-3 sm:grid-cols-2">
          <Form.Item name="city" label={t("client_management.city")} className="mb-3">
            <Input />
          </Form.Item>
          <Form.Item name="province" label={t("client_management.province")} className="mb-3">
            <Select
              showSearch
              allowClear
              placeholder={t("client_management.province")}
              options={PROVINCE_OPTIONS}
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Form.Item name="postalCode" label={t("client_management.postal_code")} className="mb-4">
            <Input />
          </Form.Item>
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="primary" htmlType="submit" loading={creating || updating}>
            {isEdit ? t("common.save_changes") : t("client_management.create_customer")}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
