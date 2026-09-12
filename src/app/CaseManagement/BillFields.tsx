import { Form, Input, InputNumber, Select, DatePicker } from "antd";

/**
 * Every bill field an admin may correct, as one form.
 *
 * Rendered by two modals — the Bill Data tab, which edits the bill on its own,
 * and the Case Overview one, which edits it alongside the case because the
 * supply point (POD, PDR, meter, contract number) is what the switch is filed
 * against, and an admin fixing a digit in a POD should not have to work out
 * which tab owns it.
 *
 * The values behind these fields, and the diff that decides what to send, are
 * in `billFieldValues` — one definition of the fields for both modals, so the
 * same value cannot mean two different things depending on where it was typed.
 */

const DATE_FORMAT = "YYYY-MM-DD";
const CAP_PATTERN = /^\d{5}$/;

interface BillFieldsProps {
  /** True while the bill is electricity, which decides which unit is asked for. */
  isElectricity: boolean;
  /**
   * Where these fields sit in the form. Empty on the bill's own modal, and
   * `["bill"]` on the case one, where the bill's supply address and tax codes
   * would otherwise collide with the case's own fields of the same name.
   */
  prefix?: string[];
}

export default function BillFields({ isElectricity, prefix = [] }: BillFieldsProps) {
  const path = (key: string) => (prefix.length ? [...prefix, key] : key);

  const heading = (text: string) => (
    <h5 className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">{text}</h5>
  );

  return (
    <>
      {/* ── Supply point — the identifiers the switch is filed against ── */}
      <div className="mb-4">
        {heading("Supply Point")}
        <Form.Item name={path("billType")} label="Utility Type" rules={[{ required: true }]}>
          <Select
            options={[
              { label: "Electricity", value: "electricity" },
              { label: "Gas", value: "gas" },
            ]}
          />
        </Form.Item>
        <div className="grid grid-cols-2 gap-x-4">
          {/* POD identifies an electricity delivery point and PDR a gas one, so
              only one of the pair is ever filled — but both stay visible, since
              a bill filed under the wrong utility is corrected by moving the
              number from one to the other. */}
          <Form.Item name={path("podNumber")} label="POD Number (electricity)">
            <Input maxLength={50} placeholder="IT001E12345678" />
          </Form.Item>
          <Form.Item name={path("pdrNumber")} label="PDR Number (gas)">
            <Input maxLength={50} placeholder="12345678901234" />
          </Form.Item>
          <Form.Item name={path("meterNumber")} label="Meter Number">
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item name={path("contractNumber")} label="Contract Number">
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item
            name={path("supplierName")}
            label="Supplier (as printed on the bill)"
            className="col-span-2"
          >
            <Input maxLength={200} placeholder="Enel Energia" />
          </Form.Item>
        </div>
      </div>

      {/* ── Figures ── */}
      <div className="mb-4">
        {heading("Financial Breakdown")}
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item name={path("totalAmount")} label="Total Amount (€)">
            <InputNumber className="w-full!" min={0} precision={2} />
          </Form.Item>
          <Form.Item name={path("costPerUnit")} label="Cost per Unit (€)">
            <InputNumber className="w-full!" min={0} precision={6} step={0.001} />
          </Form.Item>
          <Form.Item name={path("fixedCharges")} label="Fixed Charges (€)">
            <InputNumber className="w-full!" min={0} precision={2} />
          </Form.Item>
          <Form.Item name={path("taxes")} label="Taxes (€)">
            <InputNumber className="w-full!" min={0} precision={2} />
          </Form.Item>
          <Form.Item name={path("consumptionKwh")} label="Consumption (kWh)" hidden={!isElectricity}>
            <InputNumber className="w-full!" min={0} precision={2} />
          </Form.Item>
          <Form.Item name={path("consumptionSmc")} label="Consumption (Smc)" hidden={isElectricity}>
            <InputNumber className="w-full!" min={0} precision={2} />
          </Form.Item>
          <Form.Item name={path("billingPeriodStart")} label="Period Start">
            <DatePicker className="w-full!" format={DATE_FORMAT} />
          </Form.Item>
          <Form.Item name={path("billingPeriodEnd")} label="Period End">
            <DatePicker className="w-full!" format={DATE_FORMAT} />
          </Form.Item>
        </div>
      </div>

      {/* ── Who the bill names ── */}
      <div className="mb-4">
        {heading("Account Holder On The Bill")}
        {/* The holder printed on the bill, which is not always the account that
            uploaded it — a switch is refused when the two disagree, so both are
            recorded rather than reconciled silently. */}
        <div className="grid grid-cols-3 gap-x-4">
          <Form.Item name={path("customerName")} label="Account Holder">
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item name={path("codiceFiscale")} label="Codice Fiscale">
            <Input maxLength={16} />
          </Form.Item>
          <Form.Item name={path("partitaIva")} label="Partita IVA">
            <Input maxLength={11} />
          </Form.Item>
        </div>
      </div>

      {/* ── Where the bill says the supply is ── */}
      <div>
        {heading("Supply Address On The Bill")}
        {/* The five fields the address is stored as. The single line the bill
            shows elsewhere is rendered from these by the server, so it is not
            edited here — editing both would let them disagree. */}
        <div className="grid grid-cols-6 gap-x-4">
          <Form.Item name={path("supplyStreet")} label="Street" className="col-span-4">
            <Input maxLength={255} placeholder="Via Roma" />
          </Form.Item>
          <Form.Item name={path("supplyStreetNumber")} label="No." className="col-span-2">
            <Input maxLength={20} placeholder="42" />
          </Form.Item>
          <Form.Item name={path("supplyCity")} label="City" className="col-span-2">
            <Input maxLength={100} placeholder="Milano" />
          </Form.Item>
          <Form.Item
            name={path("supplyPostalCode")}
            label="Postal Code (CAP)"
            className="col-span-2"
            rules={[{ pattern: CAP_PATTERN, message: "CAP must be 5 digits" }]}
          >
            <Input maxLength={5} placeholder="20121" />
          </Form.Item>
          <Form.Item name={path("supplyProvince")} label="Province" className="col-span-2">
            <Input maxLength={100} placeholder="MI" />
          </Form.Item>
        </div>
      </div>
    </>
  );
}
