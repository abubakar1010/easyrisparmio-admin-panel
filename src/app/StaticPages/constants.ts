import i18n from "../../i18n";

/** Slugs the backend treats as agreements requiring explicit user consent. */
export const LEGAL_SLUGS = ["privacy-policy", "terms-conditions"];

const slugLabelKeys: Record<string, string> = {
  "privacy-policy": "audit.slug_privacy_policy",
  "terms-conditions": "audit.slug_terms_conditions",
  "about-us": "audit.slug_about_us",
};

/** The page's name in the admin's language; an unknown slug shows as itself. */
export const slugLabel = (slug: string): string =>
  slugLabelKeys[slug] ? i18n.t(slugLabelKeys[slug]) : slug;

export const slugColor: Record<string, string> = {
  "privacy-policy": "blue",
  "terms-conditions": "green",
  "about-us": "purple",
};

/** Evaluated per call so the labels follow the current language. */
export const slugOptions = () =>
  Object.keys(slugLabelKeys).map((value) => ({ label: slugLabel(value), value }));

/**
 * Suggests the next version when an admin publishes an update — the last
 * segment is bumped, so "2.1" becomes "2.2" and a bare "3" becomes "3.1".
 */
export function nextVersion(current: string): string {
  const parts = (current || "1.0").split(".").map((p) => Number.parseInt(p, 10) || 0);
  if (parts.length === 1) return `${parts[0]}.1`;
  parts[parts.length - 1] += 1;
  return parts.join(".");
}
