import dayjs, { type Dayjs } from "dayjs";
import type { IBill } from "../../redux/features/Bills/billApi";

/**
 * The bill fields an admin may correct, and how they are read and diffed.
 *
 * Declared once and rendered by two modals: the Bill Data tab, which edits the
 * bill on its own, and the Case Overview one, which edits it alongside the case
 * because the supply point — POD, PDR, meter, contract number — is read off the
 * bill and is exactly what the switch is filed against. An admin should not have
 * to work out which tab owns POD before they can fix a digit in it.
 *
 * Both modals therefore share one definition of the fields, one set of limits
 * and one diff, so a value the case form saves cannot mean something different
 * from the same value saved on the bill form. The form that renders them is in
 * `BillFields`; only the values live here, so editing one does not reload the
 * other on every hot refresh.
 */

const DATE_FORMAT = "YYYY-MM-DD";

/** Plain text, diffed by string comparison. */
export const BILL_TEXT_KEYS = [
  "podNumber",
  "pdrNumber",
  "contractNumber",
  "meterNumber",
  "customerName",
  "supplierName",
  "codiceFiscale",
  "partitaIva",
  "supplyStreet",
  "supplyStreetNumber",
  "supplyCity",
  "supplyPostalCode",
  "supplyProvince",
] as const;

/** Figures, diffed numerically — "12.00" and 12 are the same amount. */
export const BILL_NUMBER_KEYS = [
  "totalAmount",
  "costPerUnit",
  "fixedCharges",
  "taxes",
  "consumptionKwh",
  "consumptionSmc",
] as const;

/** Day-precision columns, diffed on the day rather than the object. */
export const BILL_DATE_KEYS = ["billingPeriodStart", "billingPeriodEnd"] as const;

/** Picked from a fixed list. */
export const BILL_SELECT_KEYS = ["billType"] as const;

export const BILL_KEYS = [
  ...BILL_SELECT_KEYS,
  ...BILL_TEXT_KEYS,
  ...BILL_NUMBER_KEYS,
  ...BILL_DATE_KEYS,
] as const;

/** The bill as the form holds it — dates as dayjs, figures as numbers. */
export function billInitialValues(bill: IBill | null): Record<string, unknown> {
  if (!bill) return {};
  const record = bill as unknown as Record<string, unknown>;
  return {
    ...Object.fromEntries(BILL_SELECT_KEYS.map((k) => [k, record[k] ?? null])),
    ...Object.fromEntries(BILL_TEXT_KEYS.map((k) => [k, (record[k] as string) ?? null])),
    // Postgres hands `decimal` columns over as strings, so a figure has to be
    // coerced before it reaches an InputNumber that would otherwise read
    // "128.40" as text and report every save as a change.
    ...Object.fromEntries(
      BILL_NUMBER_KEYS.map((k) => [k, record[k] == null ? null : Number(record[k])]),
    ),
    ...Object.fromEntries(
      BILL_DATE_KEYS.map((k) => [k, record[k] ? dayjs(record[k] as string) : null]),
    ),
  };
}

/**
 * Only what the admin actually changed, in the shape the API takes.
 *
 * Blank means "clear this field", which the server reads as null — an OCR pass
 * that invented a contract number has to be undoable, not just overwritable.
 */
export function diffBillValues(
  values: Record<string, unknown>,
  initial: Record<string, unknown>,
): Record<string, unknown> {
  const changed: Record<string, unknown> = {};

  for (const key of [...BILL_SELECT_KEYS, ...BILL_TEXT_KEYS]) {
    const next = ((values[key] as string) ?? null) || null;
    const previous = (initial[key] as string) ?? null;
    if (next !== previous) changed[key] = next;
  }

  for (const key of BILL_NUMBER_KEYS) {
    const raw = values[key];
    const next = raw == null || raw === "" ? null : Number(raw);
    const previous = (initial[key] as number | null) ?? null;
    if (next !== previous) changed[key] = next;
  }

  for (const key of BILL_DATE_KEYS) {
    const next = (values[key] as Dayjs | null)?.format(DATE_FORMAT) ?? null;
    const previous = (initial[key] as Dayjs | null)?.format(DATE_FORMAT) ?? null;
    if (next !== previous) changed[key] = next;
  }

  return changed;
}
