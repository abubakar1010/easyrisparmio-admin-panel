import { useEffect, useState } from "react";
import { Button, Form, Input, Modal } from "antd";
import { useTranslation } from "react-i18next";
import type { CustomerType, IClient, ICreateClient, IUpdateClient } from "../types";
import { typeToRole } from "../types";
import { useCreateClientMutation, useUpdateClientMutation } from "../../../redux/features/Users/clientApi";
import { successAlert, errorAlert } from "../../../lib/helpers/alert";
import { PhoneInput, phoneValidationRule } from "../../../components/ui/PhoneInput";
import {
  SDI_CODE_MESSAGE,
  isValidCodiceFiscale,
  isValidPartitaIva,
  isValidSdiCode,
  normalizeSdiCode,
  normalizeTaxId,
} from "../../../utils/italianTaxId";
import { passwordValidationRule } from "../../../utils/password";


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

  /**
   * The tax-ID rules are the server's own — see utils/italianTaxId. A shape-only
   * rule here would clear a code the save then refuses, and the admin would be
   * looking at a raw 400 naming a field the form had already accepted.
   *
   * Both are optional in their own right: whether the field is required is said
   * separately, by the `required` rule next to them.
   */
  const codiceFiscaleRule = {
    validator: (_: unknown, value: string) =>
      !value || isValidCodiceFiscale(value)
        ? Promise.resolve()
        : Promise.reject(new Error(t("client_management.fiscal_code_invalid"))),
  };

  const partitaIvaRule = {
    validator: (_: unknown, value: string) =>
      !value || isValidPartitaIva(value)
        ? Promise.resolve()
        : Promise.reject(new Error(t("client_management.partita_iva_invalid"))),
  };

  const sdiCodeRule = {
    validator: (_: unknown, value: string) =>
      !value || isValidSdiCode(value)
        ? Promise.resolve()
        : Promise.reject(new Error(SDI_CODE_MESSAGE)),
  };

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setCustomerType("Private");
      return;
    }

    if (isEdit && client) {
      setCustomerType(client.role === "business" ? "Business" : "Private");
      form.setFieldsValue({
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        fiscalCode: client.codiceFiscale,
        companyName: client.businessProfile?.companyName,
        partitaIva: client.businessProfile?.partitaIva,
        pecEmail: client.businessProfile?.pecEmail,
        sdiCode: client.businessProfile?.sdiCode,
      });
      return;
    }

    form.resetFields();
    setCustomerType("Private");
  }, [client, form, isEdit, open]);

  const handleSubmit = async (values: Record<string, string>) => {
    // Stored the way the server stores it: upper case, no separators. Sending
    // it as typed meant the same code saved as `rssmra…` and `RSSMRA…` was two
    // different values, and the table showed back something the admin had not
    // written.
    const fiscalCode = values.fiscalCode ? normalizeTaxId(values.fiscalCode) : undefined;
    const partitaIva = values.partitaIva
      ? normalizeTaxId(values.partitaIva).replace(/^IT/, "")
      : undefined;
    const sdiCode = values.sdiCode ? normalizeSdiCode(values.sdiCode) : undefined;

    try {
      if (isEdit && client) {
        const updateData: IUpdateClient = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone || undefined,
          codiceFiscale: fiscalCode,
          role: typeToRole[customerType],
        };
        if (customerType === "Business") {
          updateData.companyName = values.companyName;
          updateData.partitaIva = partitaIva;
          // Sent as null rather than dropped when the admin clears the field:
          // an omitted key leaves the old value in place, which is not what
          // emptying a box means.
          updateData.pecEmail = values.pecEmail || null;
          updateData.sdiCode = sdiCode ?? null;
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
          codiceFiscale: fiscalCode,
        };
        if (customerType === "Business") {
          createData.companyName = values.companyName;
          createData.partitaIva = partitaIva;
          createData.pecEmail = values.pecEmail || undefined;
          createData.sdiCode = sdiCode;
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
      {/*
        A box for an email next to a box for a password is exactly the shape a
        browser password manager reads as a sign-in form, and it was filling
        both with the admin's own saved credentials the moment the modal
        opened. Three things stop it: the form says it wants no autofill, the
        password fields declare themselves *new* passwords rather than a
        remembered one, and naming the form namespaces the ids so the email box
        is `add_client_form_email` instead of a bare `email` for the heuristic
        to latch onto. The name is per mode so the add and edit instances never
        render the same id while one is still animating shut.
      */}
      <Form
        form={form}
        name={isEdit ? "edit_client_form" : "add_client_form"}
        autoComplete="off"
        layout="vertical"
        onFinish={handleSubmit}
        className="pt-2"
      >
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
          {/* `whitespace` so a name of nothing but spaces is caught here: the
              server's own `IsNotEmpty` counts "   " as a name. */}
          <Form.Item name="firstName" label={`${t("client_management.first_name")} *`} className="mb-3" rules={[{ required: true, whitespace: true, message: t("client_management.first_name_required") }]}>
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item name="lastName" label={`${t("client_management.last_name")} *`} className="mb-3" rules={[{ required: true, whitespace: true, message: t("client_management.last_name_required") }]}>
            <Input maxLength={100} />
          </Form.Item>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Form.Item name="email" label={`${t("client_management.email_label")} *`} className="mb-3" rules={[{ required: true, type: "email", message: t("client_management.valid_email_required") }]}>
            <Input maxLength={255} autoComplete="off" />
          </Form.Item>
          <Form.Item name="phone" label={t("client_management.phone")} className="mb-3" rules={[phoneValidationRule(t("client_management.invalid_phone"))]}>
            <PhoneInput />
          </Form.Item>
        </div>

        {!isEdit && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Form.Item
              name="password"
              label={`${t("client_management.password_label")} *`}
              className="mb-3"
              rules={[
                { required: true, message: t("client_management.password_required") },
                passwordValidationRule(t("client_management.password_policy")),
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            {/* The admin types a password the customer has to be told. Without
                the second field a typo becomes an account nobody can sign into
                until it is reset — the same reason the reset dialog asks
                twice. */}
            <Form.Item
              name="confirmPassword"
              label={`${t("client_management.confirm_password")} *`}
              className="mb-3"
              dependencies={["password"]}
              rules={[
                { required: true, message: t("client_management.confirm_password_required") },
                ({ getFieldValue }) => ({
                  validator: (_: unknown, value: string) =>
                    !value || getFieldValue("password") === value
                      ? Promise.resolve()
                      : Promise.reject(new Error(t("client_management.passwords_do_not_match"))),
                }),
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
          </div>
        )}

        {customerType === "Business" && (
          <>
            <p className="mb-2 text-base font-semibold text-brand">{t("client_management.business_information")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Form.Item name="companyName" label={`${t("client_management.company_name")} *`} className="mb-3" rules={[{ required: true, whitespace: true, message: t("client_management.company_name_required") }]}>
                <Input maxLength={255} />
              </Form.Item>
              <Form.Item
                name="partitaIva"
                label={`${t("client_management.partita_iva")} *`}
                className="mb-3"
                rules={[{ required: true, message: t("client_management.partita_iva_required") }, partitaIvaRule]}
              >
                <Input maxLength={13} placeholder="12345678903" />
              </Form.Item>
            </div>
            {/* Where the company's invoices actually go. A business case with
                no explicit invoice address falls back to the PEC, so leaving
                this blank sends statutory invoices to whatever mailbox the
                account was registered with. */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Form.Item
                name="pecEmail"
                label={t("client_management.pec_email")}
                className="mb-3"
                rules={[{ type: "email", message: t("client_management.pec_email_invalid") }]}
              >
                <Input maxLength={255} placeholder="rossi@pec.it" />
              </Form.Item>
              <Form.Item
                name="sdiCode"
                label={t("client_management.sdi_code")}
                className="mb-3"
                rules={[sdiCodeRule]}
              >
                <Input maxLength={7} placeholder="ABC1234" />
              </Form.Item>
            </div>
          </>
        )}

        <p className="mb-2 text-base font-semibold text-brand">{t("client_management.tax_information")}</p>
        {/* The account holder's own code, not the company's — for a business
            account that is the person signing for it. The API stores it on the
            user row; the company's VAT lives in Partita IVA above.

            Required on a business account, because that is the one that cannot
            do without it: the switch request files a direct debit mandate
            against a person, and an account created without a code leaves the
            customer at a mandatory field nothing ever asked them to fill. */}
        <Form.Item
          name="fiscalCode"
          label={
            customerType === "Business"
              ? `${t("client_management.fiscal_code")} *`
              : t("client_management.fiscal_code")
          }
          className="mb-3"
          extra={customerType === "Business" ? t("client_management.fiscal_code_business_hint") : undefined}
          rules={[
            ...(customerType === "Business"
              ? [{ required: true, message: t("client_management.fiscal_code_required") }]
              : []),
            codiceFiscaleRule,
          ]}
        >
          <Input maxLength={16} placeholder="RSSMRA85T10A562S" />
        </Form.Item>

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
