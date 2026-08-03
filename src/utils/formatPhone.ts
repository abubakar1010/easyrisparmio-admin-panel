import { parsePhoneNumberFromString } from "libphonenumber-js";

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const parsed = parsePhoneNumberFromString(phone);
  return parsed ? parsed.formatInternational() : phone;
}
