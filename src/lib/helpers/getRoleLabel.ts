import { ROLE, type TUserRole } from "../../types/common.type";

export const getRoleLabel = (role: TUserRole) => {
  switch (role) {
    case ROLE.ADMIN:
      return "Admin";
    case ROLE.PERSONAL:
      return "Personal";
    case ROLE.BUSINESS:
      return "Business";
    default:
      return "User";
  }
};
