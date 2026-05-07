import { ROLE, type TUserRole } from "../../types/common.type";

export const getRoleLabel = (role: TUserRole) => {
  switch (role) {
    case ROLE.ADMIN:
      return "Admin";
    default:
      return "User";
  }
};
