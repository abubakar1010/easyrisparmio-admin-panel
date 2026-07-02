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
  pecEmail: string | null;
  legalRepresentative: string | null;
  companyType: string | null;
  atecoCode: string | null;
}

export interface IUserAddress {
  id: string;
  addressType: string;
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
  pecEmail?: string;
  legalRepresentative?: string;
  companyType?: string;
  atecoCode?: string;
  address?: {
    streetAddress: string;
    city: string;
    postalCode: string;
    province?: string;
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
  pecEmail?: string;
  legalRepresentative?: string;
  companyType?: string;
  atecoCode?: string;
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
