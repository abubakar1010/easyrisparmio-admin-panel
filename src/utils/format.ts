/**
 * Decimal precision for every price and figure the dashboard renders.
 *
 * Precision belongs to the *kind* of value, not to the call site. Before this
 * module each table and drawer called `toFixed` with whatever number it liked,
 * so `costPerUnit` rendered with four decimals in the offer table and six in
 * the bill drawer — the same field, two different numbers on screen.
 *
 *   money      2 dp  — totals, fees, taxes, savings, rewards, activation costs
 *   unitPrice  3 dp  — €/kWh, €/Smc, spread
 *   percent    2 dp  — conversion rates and their deltas
 *   quantity   2 dp  — kWh / Smc consumption
 *
 * Counts (users, cases, switches) are deliberately absent: a count has no
 * fractional part to be precise about, so `formatCount` leaves them whole.
 */
export const DECIMALS = {
  money: 2,
  unitPrice: 3,
  percent: 2,
  quantity: 2,
} as const;

/** Shown wherever a value is missing, matching the em-dash already used across the tables. */
const DASH = "—";

type Options<F extends string | null> = { fallback?: F };

/**
 * Reads the fallback without collapsing an explicit `null` into the dash.
 * `opts.fallback ?? DASH` would defeat the `{ fallback: null }` callers that
 * rely on null to hide a row entirely.
 */
const fallbackOf = <F extends string | null>(opts: Options<F>): F =>
  ("fallback" in opts ? opts.fallback : DASH) as F;

/**
 * Coerces an API value to a finite number, or null when there is nothing to
 * show. Postgres `decimal` columns arrive over the wire as strings, so the
 * string branch is the common case rather than the defensive one.
 */
const toNumber = (val: unknown): number | null => {
  if (val == null || val === "") return null;
  const n = typeof val === "number" ? val : Number(val);
  return Number.isFinite(n) ? n : null;
};

/** A money amount with its symbol, e.g. `€ 128.40`. */
export function formatMoney<F extends string | null = string>(
  val: unknown,
  opts: Options<F> = {},
): string | F {
  const n = toNumber(val);
  if (n === null) return fallbackOf(opts);
  return `€ ${n.toFixed(DECIMALS.money)}`;
}

/**
 * An energy unit price, e.g. `€ 0.129/kWh`. Pass the unit to append it; the
 * offer tables that already carry the unit in the column header leave it off.
 */
export function formatUnitPrice<F extends string | null = string>(
  val: unknown,
  unit?: string,
  opts: Options<F> = {},
): string | F {
  const n = toNumber(val);
  if (n === null) return fallbackOf(opts);
  const price = `€ ${n.toFixed(DECIMALS.unitPrice)}`;
  return unit ? `${price}/${unit}` : price;
}

/** A percentage, e.g. `12.50%`. Expects a value already scaled to 0–100. */
export function formatPercent<F extends string | null = string>(
  val: unknown,
  opts: Options<F> = {},
): string | F {
  const n = toNumber(val);
  if (n === null) return fallbackOf(opts);
  return `${n.toFixed(DECIMALS.percent)}%`;
}

/**
 * A consumption figure with Italian thousands grouping, e.g. `2.800,00 kWh`.
 * Grouping matches how an Italian bill quotes the reading.
 */
export function formatQuantity<F extends string | null = string>(
  val: unknown,
  unit = "",
  opts: Options<F> = {},
): string | F {
  const n = toNumber(val);
  if (n === null) return fallbackOf(opts);
  const grouped = n.toLocaleString("it-IT", {
    minimumFractionDigits: DECIMALS.quantity,
    maximumFractionDigits: DECIMALS.quantity,
  });
  return `${grouped} ${unit}`.trim();
}

/**
 * A whole-number count with thousands grouping, e.g. `1,234`. Counts keep no
 * decimals — there is no such thing as 1,234.00 customers.
 */
export function formatCount<F extends string | null = string>(
  val: unknown,
  opts: Options<F> = {},
): string | F {
  const n = toNumber(val);
  if (n === null) return fallbackOf(opts);
  return Math.round(n).toLocaleString();
}

/**
 * A bare number at an explicit precision, for the few figures that are neither
 * money nor a rate — average processing time in days, for instance.
 */
export function formatDecimal<F extends string | null = string>(
  val: unknown,
  decimals: number = DECIMALS.money,
  opts: Options<F> = {},
): string | F {
  const n = toNumber(val);
  if (n === null) return fallbackOf(opts);
  return n.toFixed(decimals);
}
