import i18n from "../i18n";

/**
 * Contract duration of an offer: how long its conditions stay valid for the
 * customer after activation. It is NOT the offer's validity window
 * (validFrom / validUntil), which only says when the offer can be sold.
 *
 * The API stores it as whole months, with null meaning indefinite. Older
 * payloads (sent-offer snapshots taken before months existed) only carry
 * `contractDurationDays`, where 0 means indefinite.
 */
export const CONTRACT_DURATION_MONTH_OPTIONS = [12, 24, 36, 48, 60] as const;

/** Form value standing in for `null`, which antd Select treats as "nothing chosen". */
export const INDEFINITE_DURATION = "indefinite";

export type ContractDurationFormValue = number | typeof INDEFINITE_DURATION;

type DurationSource = {
  contractDurationMonths?: number | null;
  contractDurationDays?: number | null;
};

export const toContractDurationFormValue = (
  months: number | null | undefined,
): ContractDurationFormValue => (months == null ? INDEFINITE_DURATION : months);

export const fromContractDurationFormValue = (
  value: ContractDurationFormValue,
): number | null => (value === INDEFINITE_DURATION ? null : value);

export const formatMonths = (months: number | null) =>
  months == null
    ? i18n.t("offers_market.duration_indefinite")
    : i18n.t("offers_market.duration_in_months", { count: months });

/** Human label for an offer's contract duration, or "—" when the payload has none. */
export const formatContractDuration = (offer: DurationSource | null | undefined) => {
  if (!offer) return "—";
  if (offer.contractDurationMonths !== undefined) {
    return formatMonths(offer.contractDurationMonths);
  }
  const days = offer.contractDurationDays;
  if (days == null) return "—";
  if (days <= 0) return formatMonths(null);
  if (days >= 30) return formatMonths(Math.floor(days / 30));
  return i18n.t("offers_market.duration_in_days", { count: days });
};
