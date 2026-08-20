/** Slugs the backend treats as agreements requiring explicit user consent. */
export const LEGAL_SLUGS = [
  "privacy-policy",
  "terms-conditions",
  "business-terms-conditions",
];

export const slugLabel: Record<string, string> = {
  "privacy-policy": "Privacy Policy",
  "terms-conditions": "Terms & Conditions",
  "business-terms-conditions": "Business Terms & Conditions",
  "about-us": "About Us",
};

export const slugColor: Record<string, string> = {
  "privacy-policy": "blue",
  "terms-conditions": "green",
  "business-terms-conditions": "orange",
  "about-us": "purple",
};

export const slugOptions = Object.entries(slugLabel).map(([value, label]) => ({
  label,
  value,
}));

export const audienceLabel: Record<string, string> = {
  all: "All accounts",
  personal: "Personal",
  business: "Business",
};

export const acceptanceSourceLabel: Record<string, string> = {
  registration: "Sign-up",
  social_login: "Social login",
  business_upgrade: "Business upgrade",
  reacceptance: "Re-accepted in app",
};

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
