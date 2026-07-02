import type { TUserRole } from "./common.type";

export type TProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  codiceFiscale?: string | null;
  avatar: string | null;
  role: TUserRole;
  status: string;
  authProvider: string;
  emailVerified: boolean;
  phoneVerified?: boolean;
  lastLoginAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};
