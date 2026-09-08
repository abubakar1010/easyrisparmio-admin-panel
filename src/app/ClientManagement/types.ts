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
     * Sent explicitly only to override that.
     */
    addressType?: AddressType;
  };
}

export interface IUpdateClient {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
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
