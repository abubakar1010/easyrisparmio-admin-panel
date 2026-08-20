import { useEffect, useMemo, useState } from "react";
import { App, Modal, Form, Input, Select, Checkbox, Alert, Spin } from "antd";
import type { ICase, IUpdateCase } from "../../redux/features/Cases/caseApi";
import { useUpdateCaseMutation } from "../../redux/features/Cases/caseApi";
import { useGetOffersAdminQuery } from "../../redux/features/Offers/offerApi";

interface EditCaseModalProps {
  caseData: ICase | null;
  open: boolean;
  onClose: () => void;
}

const CAP_PATTERN = /^\d{5}$/;

/** The five fields, in the order they read on an Italian address. */
const ADDRESS_FIELDS = [
  { key: "Street", label: "Street", span: "col-span-4", max: 255, placeholder: "Via Roma" },
  { key: "StreetNumber", label: "No.", span: "col-span-2", max: 20, placeholder: "42" },
  { key: "City", label: "City", span: "col-span-2", max: 100, placeholder: "Milano" },
  { key: "PostalCode", label: "Postal Code (CAP)", span: "col-span-2", max: 5, placeholder: "20121" },
  { key: "Province", label: "Province", span: "col-span-2", max: 100, placeholder: "MI" },
] as const;

type Block = "supply" | "residential" | "shipping";

const ADDRESS_KEYS: string[] = (["supply", "residential", "shipping"] as Block[]).flatMap(
  (block) => ADDRESS_FIELDS.map((f) => `${block}${f.key}`),
);

/** The fields that are plain text and diff by string comparison. */
const TEXT_KEYS = [
  "notes",
  "internalNotes",
  "invoiceEmail",
  "iban",
  "ibanHolderFirstName",
  "ibanHolderLastName",
  "ibanHolderTaxCode",
] as const;

/** The fields that are picked from a fixed list. */
const SELECT_KEYS = [
  "caseType",
  "priority",
  "selectedOfferId",
  "paymentMethod",
  "invoiceDelivery",
] as const;

const CASE_TYPE_OPTIONS = [
  { value: "switch", label: "Switch" },
  { value: "transfer", label: "Transfer" },
  { value: "takeover", label: "Takeover" },
  { value: "new_activation", label: "New activation" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "rid_bancario", label: "Direct debit (SDD)" },
  { value: "postal_order", label: "Postal order" },
  { value: "credit_card", label: "Credit card" },
  { value: "bank_transfer", label: "Bank transfer" },
];

const INVOICE_DELIVERY_OPTIONS = [
  { value: "digital", label: "Digital (by email)" },
  { value: "paper", label: "Paper (by post)" },
];

/**
 * Corrects everything a case holds: how it is classified, the offer it is filed
 * against, how it is paid for, where the invoices go, and the three addresses.
 *
 * The workflow status is deliberately not here — it moves through the pipeline
 * controls, which run the transition rules the switch depends on.
 *
 * Residence and shipping each carry a "same as supply" flag. While it is ticked
 * the block is a copy of the supply address and the server keeps it that way,
 * so those fields are shown filled from supply and locked rather than left
 * editable and silently overwritten on save.
 */
export default function EditCaseModal({ caseData, open, onClose }: EditCaseModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [updateCase, { isLoading }] = useUpdateCaseMutation();

  const [residentialSame, setResidentialSame] = useState(true);
  const [shippingSame, setShippingSame] = useState(true);

  // Only fetched while the modal is open — the offer list is long and nobody
  // reading the case needs it.
  const { data: offerPage, isFetching: offersLoading } = useGetOffersAdminQuery(
    { limit: 200, isActive: true },
    { skip: !open },
  );

  const paymentMethod = Form.useWatch("paymentMethod", form);
  const invoiceDelivery = Form.useWatch("invoiceDelivery", form);
  const isDirectDebit = paymentMethod === "rid_bancario";
  const isPaper = invoiceDelivery === "paper";

  /**
   * The offer the case is on may have been archived or deactivated since the
   * customer accepted it, so it is added to the list explicitly — otherwise the
   * select would show a blank where the current offer should be.
   */
  const offerOptions = useMemo(() => {
    const options = (offerPage?.data || []).map((offer) => ({
      value: offer.id,
      label: offer.supplier?.name ? `${offer.name} — ${offer.supplier.name}` : offer.name,
    }));
    const current = caseData?.selectedOffer;
    if (current && !options.some((o) => o.value === current.id)) {
      options.unshift({
        value: current.id,
        label: current.supplier?.name
          ? `${current.name} — ${current.supplier.name} (current)`
          : `${current.name} (current)`,
      });
    }
    return options;
  }, [offerPage, caseData]);

  const initialValues = useMemo(() => {
    if (!caseData) return {};
    const record = caseData as unknown as Record<string, unknown>;
    return {
      ...Object.fromEntries(ADDRESS_KEYS.map((key) => [key, (record[key] as string) ?? null])),
      ...Object.fromEntries(TEXT_KEYS.map((key) => [key, (record[key] as string) ?? null])),
      ...Object.fromEntries(SELECT_KEYS.map((key) => [key, (record[key] as string) ?? null])),
    } as Record<string, string | null>;
  }, [caseData]);

  useEffect(() => {
    if (!open || !caseData) return;
    form.setFieldsValue(initialValues);
    setResidentialSame(caseData.residentialSameAsSupply);
    setShippingSame(caseData.shippingSameAsSupply);
  }, [open, caseData, form, initialValues]);

  /** Mirrors the supply fields into a block the admin just declared identical. */
  const mirrorSupply = (block: Exclude<Block, "supply">) => {
    const values = form.getFieldsValue();
    form.setFieldsValue(
      Object.fromEntries(
        ADDRESS_FIELDS.map((f) => [`${block}${f.key}`, values[`supply${f.key}`] ?? null]),
      ),
    );
  };

  const handleSubmit = async () => {
    if (!caseData) return;
    try {
      const values = await form.validateFields();
      const changed: Record<string, unknown> = {};

      if (residentialSame !== caseData.residentialSameAsSupply) {
        changed.residentialSameAsSupply = residentialSame;
      }
      if (shippingSame !== caseData.shippingSameAsSupply) {
        changed.shippingSameAsSupply = shippingSame;
      }

      for (const key of [...ADDRESS_KEYS, ...TEXT_KEYS, ...SELECT_KEYS]) {
        // Blank means "clear this field", which the server reads as null. The
        // offer is the one field the case cannot be left without.
        const next = (values[key] ?? null) || null;
        const previous = initialValues[key] ?? null;
        if (next !== previous) changed[key] = next;
      }

      if (Object.keys(changed).length === 0) {
        message.info("No changes detected");
        return;
      }

      await updateCase({ id: caseData.id, data: changed as IUpdateCase }).unwrap();
      message.success("Case updated");
      onClose();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string | string[] } };
      if (e?.data) {
        const msg = e.data.message;
        message.error((Array.isArray(msg) ? msg[0] : msg) || "Failed to update case");
      }
    }
  };

  const addressBlock = (block: Block, readOnly = false) => (
    <div className="grid grid-cols-6 gap-x-4">
      {ADDRESS_FIELDS.map((f) => (
        <Form.Item
          key={f.key}
          name={`${block}${f.key}`}
          label={f.label}
          className={f.span}
          rules={
            f.key === "PostalCode"
              ? [{ pattern: CAP_PATTERN, message: "CAP must be 5 digits" }]
              : undefined
          }
        >
          <Input
            maxLength={f.max}
            placeholder={f.placeholder}
            readOnly={readOnly}
            className={readOnly ? "!bg-slate-50 !text-slate-500" : undefined}
            onChange={
              block === "supply"
                ? () => {
                    // Keep the locked copies in step as the supply address is
                    // retyped — the server does the same on save.
                    if (residentialSame) mirrorSupply("residential");
                    if (shippingSame) mirrorSupply("shipping");
                  }
                : undefined
            }
          />
        </Form.Item>
      ))}
    </div>
  );

  const section = (title: string, hint: string, body: React.ReactNode) => (
    <div className="mb-5">
      <h4 className="text-sm font-semibold text-slate-700 mb-1">{title}</h4>
      <p className="text-xs text-slate-400 mb-3">{hint}</p>
      {body}
    </div>
  );

  return (
    <Modal
      title="Edit Case Data"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Save Changes"
      confirmLoading={isLoading}
      width={820}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4 max-h-[65vh] overflow-y-auto pr-2">
        {/* ── Classification ── */}
        {section(
          "Case",
          "How the case is classified and queued. The pipeline status is changed from the case header.",
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="caseType" label="Case Type">
              <Select options={CASE_TYPE_OPTIONS} placeholder="Select case type" />
            </Form.Item>
            <Form.Item name="priority" label="Priority">
              <Select options={PRIORITY_OPTIONS} placeholder="Select priority" />
            </Form.Item>
          </div>,
        )}

        {/* ── Offer ── */}
        {section(
          "Offer",
          "The offer the switch is filed against. Changing it moves the destination supplier with it.",
          <Form.Item name="selectedOfferId" label="Selected Offer">
            <Select
              showSearch
              optionFilterProp="label"
              options={offerOptions}
              loading={offersLoading}
              notFoundContent={offersLoading ? <Spin size="small" /> : "No offers found"}
              placeholder="Select an offer"
            />
          </Form.Item>,
        )}

        {/* ── Payment ── */}
        {section(
          "Payment",
          "How the customer pays the new supplier. The offer may only accept one method.",
          <>
            <Form.Item name="paymentMethod" label="Payment Method">
              <Select allowClear options={PAYMENT_METHOD_OPTIONS} placeholder="Select payment method" />
            </Form.Item>
            {/* Kept mounted while hidden so switching method back does not wipe
                the account details the customer gave. */}
            <div className={isDirectDebit ? undefined : "hidden"}>
              <Form.Item name="iban" label="IBAN">
                <Input maxLength={34} placeholder="IT60X0542811101000000123456" />
              </Form.Item>
              <div className="grid grid-cols-3 gap-x-4">
                <Form.Item name="ibanHolderFirstName" label="Holder First Name">
                  <Input maxLength={100} placeholder="Mario" />
                </Form.Item>
                <Form.Item name="ibanHolderLastName" label="Holder Last Name">
                  <Input maxLength={100} placeholder="Rossi" />
                </Form.Item>
                <Form.Item name="ibanHolderTaxCode" label="Holder Codice Fiscale">
                  <Input maxLength={16} placeholder="RSSMRA80A01H501Z" />
                </Form.Item>
              </div>
              <p className="-mt-2 mb-2 text-xs text-slate-400">
                Leave the holder fields blank when the account belongs to the contract holder.
              </p>
            </div>
          </>,
        )}

        {/* ── Invoicing ── */}
        {section(
          "Invoicing",
          "Where the supplier sends the invoices.",
          <>
            <Form.Item name="invoiceDelivery" label="Invoice Delivery">
              <Select
                allowClear
                options={INVOICE_DELIVERY_OPTIONS}
                placeholder="Select invoice delivery"
              />
            </Form.Item>
            <div className={isPaper ? "hidden" : undefined}>
              <Form.Item
                name="invoiceEmail"
                label="Invoice Email"
                rules={[{ type: "email", message: "Enter a valid email address" }]}
              >
                <Input maxLength={255} placeholder="Defaults to the account email" />
              </Form.Item>
            </div>
          </>,
        )}

        {/* ── Supply address ── */}
        {section("Supply Address", "Where the energy is delivered.", addressBlock("supply"))}

        {/* ── Residence ── */}
        <div className="mb-5">
          <h4 className="text-sm font-semibold text-slate-700 mb-1">Residential Address</h4>
          <p className="text-xs text-slate-400 mb-2">Where the customer lives.</p>
          <Checkbox
            checked={residentialSame}
            onChange={(e) => {
              setResidentialSame(e.target.checked);
              if (e.target.checked) mirrorSupply("residential");
            }}
            className="mb-3"
          >
            Same as supply address
          </Checkbox>
          {addressBlock("residential", residentialSame)}
        </div>

        {/* ── Shipping ── */}
        <div className="mb-5">
          <h4 className="text-sm font-semibold text-slate-700 mb-1">Shipping Address</h4>
          <p className="text-xs text-slate-400 mb-2">Where paper invoices are posted.</p>
          {!isPaper && (
            <Alert
              type="info"
              showIcon
              className="mb-3"
              message="This case receives digital invoices, so no shipping address is used. Anything entered here is stored but not shown on the case."
            />
          )}
          <Checkbox
            checked={shippingSame}
            onChange={(e) => {
              setShippingSame(e.target.checked);
              if (e.target.checked) mirrorSupply("shipping");
            }}
            className="mb-3"
          >
            Ships to supply address
          </Checkbox>
          {addressBlock("shipping", shippingSame)}
        </div>

        {/* ── Notes ── */}
        {section(
          "Notes",
          "The first is shown to the customer on their case; the second never leaves the CRM.",
          <>
            <Form.Item name="notes" label="Customer-visible Notes">
              <Input.TextArea rows={3} placeholder="Your documents have been received and are under review." />
            </Form.Item>
            <Form.Item name="internalNotes" label="Internal Notes">
              <Input.TextArea rows={3} placeholder="Verified POD via supplier portal" />
            </Form.Item>
          </>,
        )}
      </Form>
    </Modal>
  );
}
