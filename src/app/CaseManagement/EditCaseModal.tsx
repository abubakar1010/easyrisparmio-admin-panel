import { useEffect, useMemo, useState } from "react";
import {
  App,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Checkbox,
  Alert,
  Spin,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import type { ICase, IUpdateCase } from "../../redux/features/Cases/caseApi";
import { useUpdateCaseMutation } from "../../redux/features/Cases/caseApi";
import type { IBill } from "../../redux/features/Bills/billApi";
import { useUpdateBillAdminMutation } from "../../redux/features/Bills/billApi";
import { useGetOffersAdminQuery } from "../../redux/features/Offers/offerApi";
import { useGetSuppliersQuery } from "../../redux/features/Suppliers/supplierApi";
import { useGetAgentsQuery, useUpdateClientMutation } from "../../redux/features/Users/clientApi";
import type { IUpdateClient } from "../ClientManagement/types";
import {
  normalizeTaxId,
  codiceFiscaleMessage,
  partitaIvaMessage,
  taxIdMessage,
  isValidCodiceFiscale,
  isValidPartitaIva,
} from "../../utils/italianTaxId";
import { baseApi } from "../../redux/api/baseApi";
import { useAppDispatch } from "../../redux/hooks";
import BillFields from "./BillFields";
import { billInitialValues, diffBillValues } from "./billFieldValues";

interface EditCaseModalProps {
  caseData: ICase | null;
  /** The full bill the case was opened from — the case's own copy is a subset. */
  bill: IBill | null;
  open: boolean;
  onClose: () => void;
}

const CAP_PATTERN = /^\d{5}$/;
const DATE_FORMAT = "YYYY-MM-DD";

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
  "assignedAgentId",
  "fromSupplierId",
  "paymentMethod",
  "invoiceDelivery",
] as const;

/** The fields that are numbers, and diff numerically rather than as text. */
const NUMBER_KEYS = ["estimatedAnnualValue", "slaDaysTotal"] as const;

/**
 * The date fields, and what the server stores each as.
 *
 * `activationDate` and `expiryDate` are `date` columns and travel as plain
 * `YYYY-MM-DD`. `contractSentAt` and `slaDeadline` are instants: the case only
 * ever shows them by day, so a day picked here is anchored to the edge of that
 * day the field means — the moment the contract went out, and the last moment
 * the case is still inside its SLA.
 */
const DATE_KEYS = [
  { key: "activationDate", as: "day" },
  { key: "expiryDate", as: "day" },
  { key: "contractSentAt", as: "startOfDay" },
  { key: "slaDeadline", as: "endOfDay" },
] as const;

/** A picked day, in the shape the column behind it is stored in. */
const serializeDate = (value: Dayjs | null, as: (typeof DATE_KEYS)[number]["as"]) => {
  if (!value) return null;
  if (as === "day") return value.format(DATE_FORMAT);
  return (as === "endOfDay" ? value.endOf("day") : value.startOf("day")).toISOString();
};

/**
 * The customer's own record, which lives on their account rather than on the
 * case. Edited here anyway: the name and tax code the switch is submitted under
 * are these, and an admin who has just spotted a wrong Codice Fiscale on the
 * case should not have to leave for Client Management to fix it.
 */
const CUSTOMER_KEYS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "codiceFiscale",
  "partitaIva",
] as const;

/** The three the account cannot exist without — the server refuses them blank. */
const CUSTOMER_REQUIRED = new Set<string>(["firstName", "lastName", "email"]);

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

/** The message an RTK Query rejection carries, or a fallback. */
const errorMessage = (err: unknown, fallback: string): string => {
  const e = err as { data?: { message?: string | string[] } };
  const msg = e?.data?.message;
  return (Array.isArray(msg) ? msg[0] : msg) || fallback;
};

/**
 * Corrects everything the Case Overview shows, in one form.
 *
 * The tab spans three records — the case, the bill it was opened from, and the
 * customer's account — and an admin reading a card has no reason to know which
 * of the three owns the field they are looking at. So the form edits all three
 * and saves each with its own request, in order, reporting exactly which ones
 * landed if one is refused. The bill fields are the shared definition the Bill
 * Data tab renders, so the two can never mean different things.
 *
 * Two fields are deliberately absent. The workflow status moves through the
 * pipeline controls, which run the transition rules the switch depends on. The
 * case number is generated from a per-day sequence behind a unique index, so
 * retyping one could only collide with the case already holding it — it is
 * shown at the top of the form as a read-only heading instead.
 *
 * Residence and shipping each carry a "same as supply" flag. While it is ticked
 * the block is a copy of the supply address and the server keeps it that way,
 * so those fields are shown filled from supply and locked rather than left
 * editable and silently overwritten on save.
 */
export default function EditCaseModal({ caseData, bill, open, onClose }: EditCaseModalProps) {
  const { message } = App.useApp();
  const dispatch = useAppDispatch();
  const [form] = Form.useForm();
  const [updateCase, { isLoading: savingCase }] = useUpdateCaseMutation();
  const [updateBill, { isLoading: savingBill }] = useUpdateBillAdminMutation();
  const [updateClient, { isLoading: savingCustomer }] = useUpdateClientMutation();

  const [residentialSame, setResidentialSame] = useState(true);
  const [shippingSame, setShippingSame] = useState(true);
  // Tri-state on purpose: null means the case predates the question, and
  // saving it as `false` would assert a third-party mandate nobody asked about.
  const [ibanSame, setIbanSame] = useState<boolean | null>(null);

  // Only fetched while the modal is open — both lists are long and nobody
  // reading the case needs them.
  const { data: offerPage, isFetching: offersLoading } = useGetOffersAdminQuery(
    { limit: 200, isActive: true },
    { skip: !open },
  );
  const { data: supplierPage, isFetching: suppliersLoading } = useGetSuppliersQuery(
    { limit: 200 },
    { skip: !open },
  );
  const { data: agents, isFetching: agentsLoading } = useGetAgentsQuery(undefined, {
    skip: !open,
  });

  const paymentMethod = Form.useWatch("paymentMethod", form);
  const invoiceDelivery = Form.useWatch("invoiceDelivery", form);
  const activationDate = Form.useWatch("activationDate", form) as Dayjs | null;
  const expiryDate = Form.useWatch("expiryDate", form) as Dayjs | null;
  const billType = Form.useWatch(["bill", "billType"], form) as string | undefined;
  const isDirectDebit = paymentMethod === "rid_bancario";

  /**
   * Whose account this case belongs to, and therefore which of the two tax IDs
   * its direct debit mandate is filed under: a company's Partita IVA or a
   * private customer's Codice Fiscale.
   */
  const isBusinessCase = caseData?.user?.role === "business";
  const holderTaxLabel =
    ibanSame === false
      ? "Holder Tax Code / VAT"
      : isBusinessCase
        ? "Holder Partita IVA"
        : "Holder Codice Fiscale";
  const isPaper = invoiceDelivery === "paper";
  // Read off the form rather than the record, so switching the utility swaps
  // the consumption field without waiting for a save.
  const isElectricity = (billType ?? bill?.billType) === "electricity";
  const isBusiness = caseData?.user?.role === "business" || !!caseData?.user?.businessProfile;

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

  /** Same reasoning as the offers: a supplier since retired must still show. */
  const supplierOptions = useMemo(() => {
    const options = (supplierPage?.data || []).map((supplier) => ({
      value: supplier.id,
      label: supplier.name,
    }));
    const current = caseData?.fromSupplier;
    if (current && !options.some((o) => o.value === current.id)) {
      options.unshift({ value: current.id, label: `${current.name} (current)` });
    }
    return options;
  }, [supplierPage, caseData]);

  /**
   * The roster only carries admins who can still log in, so a case handed to
   * someone since suspended keeps them listed — otherwise the select would read
   * as unassigned and the next save would quietly drop the handler.
   */
  const agentOptions = useMemo(() => {
    const options = (agents || []).map((agent) => ({
      value: agent.id,
      label: `${agent.firstName} ${agent.lastName}`.trim() || agent.email,
    }));
    const current = caseData?.assignedAgent;
    if (current && !options.some((o) => o.value === current.id)) {
      options.unshift({
        value: current.id,
        label: `${`${current.firstName} ${current.lastName}`.trim() || current.email} (inactive)`,
      });
    }
    return options;
  }, [agents, caseData]);

  /**
   * The customer's account, as the form holds it. The VAT number lives on the
   * business profile rather than the user row, so it is lifted up beside the
   * rest — the form has no reason to expose where each column sits.
   */
  const customerInitialValues = useMemo(() => {
    const user = caseData?.user;
    if (!user) return {};
    return {
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      email: user.email ?? null,
      phone: user.phone ?? null,
      codiceFiscale: user.codiceFiscale ?? null,
      partitaIva: user.businessProfile?.partitaIva ?? null,
    } as Record<string, string | null>;
  }, [caseData]);

  const initialValues = useMemo(() => {
    if (!caseData) return {};
    const record = caseData as unknown as Record<string, unknown>;
    return {
      ...Object.fromEntries(ADDRESS_KEYS.map((key) => [key, (record[key] as string) ?? null])),
      ...Object.fromEntries(TEXT_KEYS.map((key) => [key, (record[key] as string) ?? null])),
      ...Object.fromEntries(SELECT_KEYS.map((key) => [key, (record[key] as string) ?? null])),
      // Postgres hands `decimal` columns over as strings, so the figure has to
      // be coerced before it reaches an InputNumber that would otherwise treat
      // "1140.00" as text and report every save as a change.
      ...Object.fromEntries(
        NUMBER_KEYS.map((key) => [key, record[key] == null ? null : Number(record[key])]),
      ),
      ...Object.fromEntries(
        DATE_KEYS.map(({ key }) => [key, record[key] ? dayjs(record[key] as string) : null]),
      ),
      // The other two records the tab shows, each under its own key so the
      // bill's supply address and tax codes cannot collide with the case's own
      // fields of the same name.
      bill: billInitialValues(bill),
      customer: customerInitialValues,
    } as Record<string, unknown>;
  }, [caseData, bill, customerInitialValues]);

  useEffect(() => {
    if (!open || !caseData) return;
    form.setFieldsValue(initialValues);
    setResidentialSame(caseData.residentialSameAsSupply);
    setShippingSame(caseData.shippingSameAsSupply);
    setIbanSame(caseData.ibanSameAsContract ?? null);
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

  /** Only what the admin changed on the case itself. */
  const diffCase = (values: Record<string, unknown>) => {
    const changed: Record<string, unknown> = {};

    if (residentialSame !== caseData?.residentialSameAsSupply) {
      changed.residentialSameAsSupply = residentialSame;
    }
    if (shippingSame !== caseData?.shippingSameAsSupply) {
      changed.shippingSameAsSupply = shippingSame;
    }
    if (ibanSame !== (caseData?.ibanSameAsContract ?? null)) {
      changed.ibanSameAsContract = ibanSame;
    }

    for (const key of [...ADDRESS_KEYS, ...TEXT_KEYS, ...SELECT_KEYS]) {
      // Blank means "clear this field", which the server reads as null. The
      // offer is the one field the case cannot be left without.
      let next = ((values[key] as string) ?? null) || null;
      // The server validates the tax ID before it normalises it, so a code
      // typed in the grouped form it is printed in would be refused for the
      // spaces alone. Send it as it will be stored.
      if (key === "ibanHolderTaxCode" && next) next = normalizeTaxId(next);
      const previous = ((initialValues as Record<string, unknown>)[key] as string) ?? null;
      if (next !== previous) changed[key] = next;
    }

    for (const key of NUMBER_KEYS) {
      // A cleared InputNumber yields null, which is how a figure that was
      // entered against the wrong case is taken back off it.
      const raw = values[key];
      const next = raw == null || raw === "" ? null : Number(raw);
      const previous = (initialValues as Record<string, number | null>)[key] ?? null;
      if (next !== previous) changed[key] = next;
    }

    for (const { key, as } of DATE_KEYS) {
      const next = serializeDate((values[key] as Dayjs | null) ?? null, as);
      const previous = serializeDate(
        (initialValues as Record<string, Dayjs | null>)[key] ?? null,
        as,
      );
      if (next !== previous) changed[key] = next;
    }

    return changed;
  };

  /** Only what the admin changed on the customer's account. */
  const diffCustomer = (values: Record<string, unknown>) => {
    const changed: Record<string, unknown> = {};
    for (const key of CUSTOMER_KEYS) {
      // The VAT number belongs to a company; a private account has no profile
      // row to write it to, so the field is not shown and not sent.
      if (key === "partitaIva" && !isBusiness) continue;
      let next = ((values[key] as string) ?? null) || null;
      if ((key === "codiceFiscale" || key === "partitaIva") && next) {
        next = normalizeTaxId(next);
      }
      // The server refuses a blank name or email outright, so a field the form
      // marks required is never sent empty — it is simply left as it was.
      if (next === null && CUSTOMER_REQUIRED.has(key)) continue;
      const previous = customerInitialValues[key] ?? null;
      if (next !== previous) changed[key] = next;
    }
    return changed;
  };

  const handleSubmit = async () => {
    if (!caseData) return;
    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    const caseChanges = diffCase(values);
    const billChanges = bill
      ? diffBillValues((values.bill as Record<string, unknown>) ?? {},
          (initialValues as { bill: Record<string, unknown> }).bill)
      : {};
    const customerChanges = caseData.user
      ? diffCustomer((values.customer as Record<string, unknown>) ?? {})
      : {};

    // Three records, three requests, and no transaction spanning them — so they
    // run in order and the first refusal stops the rest, with the message
    // naming what did land. Silently reporting "updated" after a half-applied
    // save is the one outcome an admin cannot recover from.
    const saves: { label: string; run: () => Promise<unknown> }[] = [];
    if (Object.keys(caseChanges).length > 0) {
      saves.push({
        label: "case",
        run: () => updateCase({ id: caseData.id, data: caseChanges as IUpdateCase }).unwrap(),
      });
    }
    if (bill && Object.keys(billChanges).length > 0) {
      saves.push({
        label: "bill data",
        run: () => updateBill({ billId: bill.id, data: billChanges }).unwrap(),
      });
    }
    if (caseData.user && Object.keys(customerChanges).length > 0) {
      saves.push({
        label: "customer",
        // The account save invalidates `user`, which the case detail does not
        // subscribe to — it reads the customer through its own `case` entry.
        // Without this the corrected name sits in the database while the card
        // behind the modal still shows the old one.
        run: async () => {
          await updateClient({
            id: caseData.user!.id,
            data: customerChanges as IUpdateClient,
          }).unwrap();
          dispatch(baseApi.util.invalidateTags([{ type: "case", id: caseData.id }]));
        },
      });
    }

    if (saves.length === 0) {
      message.info("No changes detected");
      return;
    }

    const done: string[] = [];
    for (const save of saves) {
      try {
        await save.run();
        done.push(save.label);
      } catch (err) {
        const detail = errorMessage(err, `Failed to update ${save.label}`);
        message.error(
          done.length > 0
            ? `${detail} — the ${done.join(" and ")} ${done.length > 1 ? "were" : "was"} saved.`
            : detail,
        );
        return;
      }
    }

    message.success("Case updated");
    onClose();
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
      confirmLoading={savingCase || savingBill || savingCustomer}
      width={820}
      destroyOnClose
    >
      {/* The one identifier on the case that is not editable, kept in view so
          the admin can tell at a glance which case the form is open on. */}
      {caseData?.caseNumber && (
        <p className="mt-1 text-xs text-slate-400">
          Case <span className="font-semibold text-slate-600">{caseData.caseNumber}</span> — the case
          number is generated and cannot be changed.
        </p>
      )}

      <Form form={form} layout="vertical" className="mt-4 max-h-[65vh] overflow-y-auto pr-2">
        {/* ── Classification & handling ── */}
        {section(
          "Case",
          "How the case is classified, queued and staffed. The pipeline status is changed from the case header.",
          <>
            <div className="grid grid-cols-2 gap-x-4">
              <Form.Item name="caseType" label="Case Type">
                <Select options={CASE_TYPE_OPTIONS} placeholder="Select case type" />
              </Form.Item>
              <Form.Item name="priority" label="Priority">
                <Select options={PRIORITY_OPTIONS} placeholder="Select priority" />
              </Form.Item>
            </div>
            <Form.Item name="assignedAgentId" label="Assigned Agent">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                options={agentOptions}
                loading={agentsLoading}
                notFoundContent={agentsLoading ? <Spin size="small" /> : "No agents found"}
                placeholder="Unassigned"
              />
            </Form.Item>
          </>,
        )}

        {/* ── Customer ── */}
        {caseData?.user &&
          section(
            "Customer",
            "The account the switch is submitted under. These fields belong to the customer's record, so a correction here follows them onto every other case they have.",
            <>
              <div className="grid grid-cols-2 gap-x-4">
                <Form.Item
                  name={["customer", "firstName"]}
                  label="First Name"
                  rules={[{ required: true, message: "A first name is required" }]}
                >
                  <Input maxLength={100} placeholder="Mario" />
                </Form.Item>
                <Form.Item
                  name={["customer", "lastName"]}
                  label="Last Name"
                  rules={[{ required: true, message: "A last name is required" }]}
                >
                  <Input maxLength={100} placeholder="Rossi" />
                </Form.Item>
                <Form.Item
                  name={["customer", "email"]}
                  label="Email"
                  rules={[
                    { required: true, message: "An email address is required" },
                    { type: "email", message: "Enter a valid email address" },
                  ]}
                >
                  <Input maxLength={255} placeholder="mario.rossi@email.com" />
                </Form.Item>
                <Form.Item name={["customer", "phone"]} label="Phone">
                  <Input maxLength={20} placeholder="+393331234567" />
                </Form.Item>
              </div>
              <div className="grid grid-cols-2 gap-x-4">
                <Form.Item
                  name={["customer", "codiceFiscale"]}
                  label="Codice Fiscale"
                  // Checked against its own check character, not just its
                  // shape — the account is allowed to hold only a code the
                  // direct debit step will also accept.
                  rules={[
                    {
                      validator: (_, value: string) =>
                        !value || isValidCodiceFiscale(value)
                          ? Promise.resolve()
                          : Promise.reject(new Error("Enter a valid Codice Fiscale")),
                    },
                  ]}
                >
                  <Input maxLength={16} placeholder="RSSMRA85T10A562S" />
                </Form.Item>
                {isBusiness && (
                  <Form.Item
                    name={["customer", "partitaIva"]}
                    label="Partita IVA"
                    rules={[
                      {
                        validator: (_, value: string) =>
                          !value || isValidPartitaIva(value)
                            ? Promise.resolve()
                            : Promise.reject(new Error("Enter a valid 11-digit Partita IVA")),
                      },
                    ]}
                  >
                    <Input maxLength={11} placeholder="12345678903" />
                  </Form.Item>
                )}
              </div>
            </>,
          )}

        {/* ── Supply point & bill ── */}
        {bill &&
          section(
            "Supply Point & Bill Data",
            "Read off the uploaded bill, and what the switch is filed against — the POD or PDR here is the number sent to the new supplier. Corrections made here are the same ones the Bill Data tab makes.",
            <>
              <Form.Item
                name="fromSupplierId"
                label="Current Supplier (matched record)"
                extra="The supplier the customer is leaving. The bill's own printed name is below; this is the company record the switch is filed against."
              >
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={supplierOptions}
                  loading={suppliersLoading}
                  notFoundContent={suppliersLoading ? <Spin size="small" /> : "No suppliers found"}
                  placeholder="Not matched to a supplier record"
                />
              </Form.Item>
              <BillFields isElectricity={isElectricity} prefix={["bill"]} />
            </>,
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
              <Checkbox
                className="mb-4"
                checked={ibanSame === true}
                onChange={(e) => setIbanSame(e.target.checked)}
              >
                The account belongs to the contract holder
              </Checkbox>
              <div className="grid grid-cols-3 gap-x-4">
                <Form.Item name="ibanHolderFirstName" label="Holder First Name">
                  <Input maxLength={100} placeholder="Mario" />
                </Form.Item>
                <Form.Item name="ibanHolderLastName" label="Holder Last Name">
                  <Input maxLength={100} placeholder="Rossi" />
                </Form.Item>
                <Form.Item
                  name="ibanHolderTaxCode"
                  label={holderTaxLabel}
                  // The account's own identifier while the account is the
                  // holder, matching the app and the API: one account carries
                  // one tax ID — a private customer their Codice Fiscale, a
                  // company its Partita IVA — and the mandate is filed under
                  // that one. A code belonging to the other account kind is
                  // what the supplier bounces weeks later.
                  //
                  // Untick the box above and the holder is somebody else, who
                  // may be a person or a company: both forms are accepted
                  // there, exactly as the app does it.
                  rules={[
                    {
                      validator: (_, value: string) => {
                        // Naming the wrong part beats "invalid": the other of
                        // the two codes is the admin reaching for the wrong
                        // identifier, and one that fails only on its check
                        // character is nearly right — retyping is not the fix.
                        const problem = ibanSame === false
                          ? taxIdMessage(value)
                          : isBusinessCase
                            ? partitaIvaMessage(value)
                            : codiceFiscaleMessage(value);
                        return problem
                          ? Promise.reject(new Error(problem))
                          : Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input
                    maxLength={16}
                    placeholder={
                      ibanSame !== false && isBusinessCase
                        ? "12345678903"
                        : "RSSMRA85T10A562S"
                    }
                  />
                </Form.Item>
              </div>
              <p className="-mt-2 mb-2 text-xs text-slate-400">
                The app records the holder on every direct debit, including the customer's own
                account. Blank holder fields mean the case predates that.
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
        {section(
          "Supply Address (on the case)",
          "Where the energy is delivered, as the switch is filed. The address printed on the bill is edited above; this is the one the new supplier is given.",
          addressBlock("supply"),
        )}

        {/* ── Residence, or the registered office on a business case ── */}
        <div className="mb-5">
          <h4 className="text-sm font-semibold text-slate-700 mb-1">
            {isBusiness ? "Registered Office" : "Residential Address"}
          </h4>
          <p className="text-xs text-slate-400 mb-2">
            {isBusiness
              ? "The company's sede legale, as the contract is headed."
              : "Where the customer lives."}
          </p>
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

        {/* ── Contract dates ── */}
        {section(
          "Contract Dates",
          "Contract signing happens outside the app, so every date here is entered by hand. Both activation dates are required before a case can be put in activation, and the supply must expire after it goes live.",
          <div className="grid grid-cols-3 gap-x-4">
            <Form.Item name="contractSentAt" label="Contract Sent On">
              <DatePicker className="w-full!" format={DATE_FORMAT} allowClear />
            </Form.Item>
            <Form.Item name="activationDate" label="Activation Date">
              <DatePicker
                className="w-full!"
                format={DATE_FORMAT}
                allowClear
                // Clearing an expiry that no longer follows the new activation
                // date beats letting the server refuse the whole save for it.
                onChange={(d) => {
                  if (d && expiryDate && !expiryDate.isAfter(d, "day")) {
                    form.setFieldValue("expiryDate", null);
                  }
                }}
              />
            </Form.Item>
            <Form.Item name="expiryDate" label="Expiry Date">
              <DatePicker
                className="w-full!"
                format={DATE_FORMAT}
                allowClear
                disabledDate={(d) => !!activationDate && !d.isAfter(activationDate, "day")}
              />
            </Form.Item>
          </div>,
        )}

        {/* ── Commercial & SLA ── */}
        {section(
          "Commercial & SLA",
          "What the switch is booked at and how long it is allowed to take. Nothing derives these — they are the figures the board and the commission reconciliation report against.",
          <div className="grid grid-cols-3 gap-x-4">
            <Form.Item name="estimatedAnnualValue" label="Estimated Annual Value (€)">
              <InputNumber className="w-full!" min={0} precision={2} placeholder="1140.00" />
            </Form.Item>
            <Form.Item name="slaDaysTotal" label="SLA Days">
              <InputNumber className="w-full!" min={0} precision={0} placeholder="30" />
            </Form.Item>
            <Form.Item name="slaDeadline" label="SLA Deadline">
              <DatePicker className="w-full!" format={DATE_FORMAT} allowClear />
            </Form.Item>
          </div>,
        )}

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
