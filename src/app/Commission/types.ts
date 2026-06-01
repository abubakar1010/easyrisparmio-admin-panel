export type StructureType = "one-time" | "recurring" | "tiered" | "hybrid";

export type RuleStatus = "Active" | "Inactive" | "Draft";

export type Commodity = "Electricity" | "Gas" | "Dual";

export type Frequency = "Monthly" | "Quarterly" | "Annually";

export interface ConsumptionTier {
  from: number;
  to: number;
}

export interface CommissionRule {
  id: string;
  name: string;
  supplier: string;
  offer: string;
  commodity: Commodity;
  contractType: string;
  duration: number; // months
  structureType: StructureType;
  status: RuleStatus;
  initialFee?: number;
  recurringFee?: number;
  frequency?: Frequency;
  tiers?: ConsumptionTier[];
  bonusAmount?: number;
  bonusCondition?: string;
  allowReversals: boolean;
  clawbackDays?: number;
}

export const STRUCTURE_LABELS: Record<StructureType, string> = {
  "one-time": "One-time",
  recurring: "Recurring",
  tiered: "Tiered",
  hybrid: "Hybrid",
};

export const STRUCTURE_TAG_CLASS: Record<StructureType, string> = {
  "one-time": "bg-blue-50 text-blue-600",
  recurring: "bg-emerald-50 text-emerald-600",
  tiered: "bg-amber-50 text-amber-600",
  hybrid: "bg-teal-50 text-teal-600",
};

export const initialRules: CommissionRule[] = [
  {
    id: "rule-1",
    name: "Energy Plus - Standard Electricity",
    supplier: "Energy Plus",
    offer: "Trend Home Electricity",
    commodity: "Electricity",
    contractType: "Residential",
    duration: 12,
    structureType: "one-time",
    status: "Active",
    initialFee: 450,
    allowReversals: true,
    clawbackDays: 90,
  },
  {
    id: "rule-2",
    name: "Clean Power - Recurring Gas",
    supplier: "Clean Power",
    offer: "Pure Energy Gas",
    commodity: "Gas",
    contractType: "Business",
    duration: 24,
    structureType: "hybrid",
    status: "Active",
    initialFee: 200,
    recurringFee: 25,
    frequency: "Monthly",
    allowReversals: true,
    clawbackDays: 60,
  },
  {
    id: "rule-3",
    name: "Global Energy - Tiered Dual",
    supplier: "Global Energy",
    offer: "World Easy Dual",
    commodity: "Dual",
    contractType: "Commercial",
    duration: 36,
    structureType: "tiered",
    status: "Active",
    tiers: [
      { from: 0, to: 5000 },
      { from: 5000, to: 15000 },
      { from: 15000, to: 50000 },
    ],
    bonusAmount: 150,
    bonusCondition: "Annual renewal",
    allowReversals: false,
  },
];

export const SUPPLIER_OPTIONS = [
  "Energy Plus",
  "Clean Power",
  "Global Energy",
  "Enel Energia",
  "A2A Energy",
  "Edison",
];

export const OFFER_OPTIONS = [
  "Trend Home Electricity",
  "Pure Energy Gas",
  "World Easy Dual",
  "Family Country",
  "Clean Elect",
];

export const CONTRACT_TYPE_OPTIONS = ["Residential", "Business", "Commercial"];

export const COMMODITY_OPTIONS: Commodity[] = ["Electricity", "Gas", "Dual"];

export const FREQUENCY_OPTIONS: Frequency[] = ["Monthly", "Quarterly", "Annually"];
