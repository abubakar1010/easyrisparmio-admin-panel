import { useEffect, useMemo, useState } from "react";
import { App, Modal, Form, Input, Checkbox, Alert } from "antd";
import type { ICase } from "../../redux/features/Cases/caseApi";
import { useUpdateCaseMutation } from "../../redux/features/Cases/caseApi";

interface EditCaseAddressesModalProps {
  caseData: ICase | null;
  open: boolean;
  onClose: () => void;
}

const CAP_PATTERN = /^\d{5}$/;

/** The five fields, in the order they read on an Italian address. */
const FIELDS = [
  { key: "Street", label: "Street", span: "col-span-4", max: 255, placeholder: "Via Roma" },
  { key: "StreetNumber", label: "No.", span: "col-span-2", max: 20, placeholder: "42" },
  { key: "City", label: "City", span: "col-span-2", max: 100, placeholder: "Milano" },
  { key: "PostalCode", label: "Postal Code (CAP)", span: "col-span-2", max: 5, placeholder: "20121" },
  { key: "Province", label: "Province", span: "col-span-2", max: 100, placeholder: "MI" },
] as const;

type Block = "supply" | "residential" | "shipping";

const ALL_KEYS: string[] = (["supply", "residential", "shipping"] as Block[]).flatMap((block) =>
  FIELDS.map((f) => `${block}${f.key}`),
);

/**
 * Corrects the three addresses a case is filed against.
 *
 * Residence and shipping each carry a "same as supply" flag. While it is
 * ticked the block is a copy of the supply address and the server keeps it
 * that way, so those fields are shown filled from supply and locked rather
 * than left editable and silently overwritten on save.
 */
export default function EditCaseAddressesModal({
  caseData,
  open,
  onClose,
}: EditCaseAddressesModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [updateCase, { isLoading }] = useUpdateCaseMutation();

  const [residentialSame, setResidentialSame] = useState(true);
  const [shippingSame, setShippingSame] = useState(true);

  const isPaper = caseData?.invoiceDelivery === "paper";

  const initialValues = useMemo(() => {
    if (!caseData) return {};
    return Object.fromEntries(
      ALL_KEYS.map((key) => [key, (caseData as unknown as Record<string, string | null>)[key] ?? null]),
    );
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
      Object.fromEntries(FIELDS.map((f) => [`${block}${f.key}`, values[`supply${f.key}`] ?? null])),
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

      for (const key of ALL_KEYS) {
        const next = (values[key] ?? null) || null;
        const previous = (initialValues as Record<string, unknown>)[key] ?? null;
        if (next !== previous) changed[key] = next;
      }

      if (Object.keys(changed).length === 0) {
        message.info("No changes detected");
        return;
      }

      await updateCase({ id: caseData.id, data: changed }).unwrap();
      message.success("Addresses updated");
      onClose();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string | string[] } };
      if (e?.data) {
        const msg = e.data.message;
        message.error((Array.isArray(msg) ? msg[0] : msg) || "Failed to update addresses");
      }
    }
  };

  const addressBlock = (block: Block, readOnly = false) => (
    <div className="grid grid-cols-6 gap-x-4">
      {FIELDS.map((f) => (
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

  return (
    <Modal
      title="Edit Case Addresses"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Save Changes"
      confirmLoading={isLoading}
      width={720}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4 max-h-[65vh] overflow-y-auto pr-2">
        {/* ── Supply ── */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-1">Supply Address</h4>
          <p className="text-xs text-slate-400 mb-3">Where the energy is delivered.</p>
          {addressBlock("supply")}
        </div>

        {/* ── Residence ── */}
        <div className="mb-4">
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
        <div>
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
      </Form>
    </Modal>
  );
}
