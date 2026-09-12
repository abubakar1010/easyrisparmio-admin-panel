// Backend enum values
export type UserRole = "personal" | "business";
export type UserStatus = "active" | "inactive" | "suspended" | "pending_verification";

// Display-friendly labels
export type CustomerType = "Private" | "Business";
export type CustomerStatus = "Active" | "Pending" | "Blocked" | "Inactive";

// Mapping helpers
export const roleToType: Record<UserRole, CustomerType> = {
  personal: "Private",
  business: "Business",
};

export const typeToRole: Record<CustomerType, UserRole> = {
  Private: "personal",
  Business: "business",
};

export const statusToDisplay: Record<UserStatus, CustomerStatus> = {
  active: "Active",
  pending_verification: "Pending",
  suspended: "Blocked",
  inactive: "Inactive",
};

export const displayToStatus: Record<CustomerStatus, UserStatus> = {
  Active: "active",
  Pending: "pending_verification",
  Blocked: "suspended",
  Inactive: "inactive",
};

export const statusClass: Record<CustomerStatus, string> = {
  Active: "green",
  Pending: "gold",
  Blocked: "red",
  Inactive: "default",
};

export interface IBusinessProfile {
  id: string;
  companyName: string;
  partitaIva: string;
  legalRepresentative: string | null;
  companyType: string | null;
  atecoCode: string | null;
  /** Position the account holder occupies in the company. */
  jobRole: string | null;
  /**
   * PEC — the company's certified email. A business case with no explicit
   * invoice address falls back to it rather than to the sign-in email, which on
   * a company account is very often somebody's personal mailbox.
   */
  pecEmail: string | null;
}

/**
 * What an address on an account is. A company has a registered office — a sede
 * legale — and no residence, so `legal` is not a variant of `residential`: it
 * is the only thing that tells a company's legal seat from someone's home.
 */
export type AddressType = "residential" | "supply" | "legal" | "billing";

/** How each type is named in the client drawer. */
export const addressTypeLabelKey: Record<AddressType, string> = {
  residential: "client_management.address_residential",
  supply: "client_management.address_supply",
  legal: "client_management.address_legal",
  billing: "client_management.address_billing",
};

/**
 * The type an account's own address is stored under — `legal`, the registered
 * office, on a business account and `residential` on a personal one. Mirrors
 * the API's `accountAddressTypeFor`.
 */
export const accountAddressTypeFor = (role: UserRole): AddressType =>
  role === "business" ? "legal" : "residential";

/**
 * What to call an address in the client drawer.
 *
 * The stored type decides it. The role is only the fallback for a row whose
 * type the UI does not recognise — a value added to the API's enum before this
 * build knew about it — and it exists because the previous fallback was a flat
 * "Residence", which on a company is not a vaguer label but a wrong one.
 */
export const addressLabelKeyFor = (
  type: AddressType | undefined,
  role: UserRole,
): string =>
  (type && addressTypeLabelKey[type]) ??
  addressTypeLabelKey[accountAddressTypeFor(role)];

export interface IUserAddress {
  id: string;
  addressType: AddressType;
  streetAddress: string;
  city: string;
  province: string | null;
  postalCode: string;
  country: string;
  isPrimary: boolean;
}

export interface IUserPreference {
  id: string;
  paymentMethod: string | null;
  invoiceDelivery: string | null;
  language: string;
  contactPreference: string | null;
  marketingConsent: boolean;
  gdprConsentAt: string | null;
  iban: string | null;
}

export interface IClient {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  codiceFiscale: string | null;
  avatar: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  businessProfile: IBusinessProfile | null;
  addresses?: IUserAddress[];
  preferences?: IUserPreference | null;
  billCount?: number;
}

export interface IClientQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface ICreateClient {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  codiceFiscale?: string;
  companyName?: string;
  partitaIva?: string;
  legalRepresentative?: string;
  companyType?: string;
  atecoCode?: string;
  pecEmail?: string;
  address?: {
    streetAddress: string;
    city: string;
    postalCode: string;
    province?: string;
    /**
     * Omitted, the API picks by role: `legal` for a business account, whose
     * address is its registered office, and `residential` for a personal one.
     * Sent, it has to agree with the role — `residential` on a business account
     * and `legal` on a personal one come back as a 400 rather than being
     * stored, so there is no reason to send it at all.
     */
    addressType?: AddressType;
  };
}

export interface IUpdateClient {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  /**
   * No `role`. The account type is settled when the account is created and
   * never changes, so the API does not accept one on a PATCH at all: the field
   * is off `UpdateUserDto`, and the server validates with
   * `forbidNonWhitelisted`, which turns a stray `role` into a 400 that fails
   * the whole save. A customer who needs the other type opens the other
   * account.
   */
  status?: UserStatus;
  codiceFiscale?: string;
  companyName?: string;
  partitaIva?: string;
  legalRepresentative?: string;
  companyType?: string;
  atecoCode?: string;
  /** Null or an empty string clears it. */
  pecEmail?: string | null;
}

export interface IPaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Label maps for preference display
export const paymentMethodLabels: Record<string, string> = {
  rid_bancario: "RID Bancario",
  credit_card: "Carta di Credito",
  postal_order: "Bollettino Postale",
  bank_transfer: "Bonifico Bancario",
};

export const invoiceDeliveryLabels: Record<string, string> = {
  digital: "Digitale",
  paper: "Cartaceo",
};

export const languageLabels: Record<string, string> = {
  italiano: "Italiano",
  english: "English",
};
