export type CustomerType = "Private" | "Business";
export type CustomerStatus = "Active" | "Pending" | "Blocked";

export type ClientRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  type: CustomerType;
  supplies: number;
  status: CustomerStatus;
  operator: string;
};

export const statusClass: Record<CustomerStatus, string> = {
  Active: "green",
  Pending: "gold",
  Blocked: "red",
};
