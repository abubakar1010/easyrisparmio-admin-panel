export type UtilityType = "electricity" | "gas" | "water" | "internet";

export interface IMeter {
  id: string;
  utilityType: UtilityType;
  name: string;
  description: string | null;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IMeterQuery {
  page?: number;
  limit?: number;
  search?: string;
  utilityType?: UtilityType;
  isActive?: string;
}

export interface ICreateMeter {
  utilityType: UtilityType;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface IUpdateMeter extends Partial<ICreateMeter> {}

export interface IPaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const utilityTypeLabels: Record<UtilityType, string> = {
  electricity: "Electricity",
  gas: "Gas",
  water: "Water",
  internet: "Internet",
};
