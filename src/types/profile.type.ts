import type { TUserRole } from "./common.type";

export type TProfile = {
  _id?: string;
  name?: string;
  email: string;
  phone?: string;
  role: TUserRole;
  image?: string;
  address?: string;
  bio?: string;
};
