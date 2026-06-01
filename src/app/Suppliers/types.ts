export type SupplierStatus = "Good" | "Warning" | "Inactive";
export type Commodity = "Electricity" | "Gas" | "Dual";

export type IconKey = "database" | "flame" | "zap" | "globe";

export interface SupplierOffer {
  id: string;
  name: string;
  commodity: Commodity;
  priceType: "Fixed" | "Variable";
  commission: number;
  status: "Active" | "Expiring" | "Draft";
}

export interface Supplier {
  id: string;
  brandName: string;
  legalName: string;
  taxId: string;
  commodity: Commodity;
  status: SupplierStatus;
  website: string;
  contactName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  iban: string;
  commElectricity: number;
  commGas: number;
  contractStartDate: string;
  notes: string;
  iconKey: IconKey;
  color: string;
  bg: string;
  offers: SupplierOffer[];
}

export const suppliersData: Supplier[] = [
  {
    id: "enel",
    brandName: "Enel",
    legalName: "Enel Energia S.p.A.",
    taxId: "IT06655971007",
    commodity: "Dual",
    status: "Good",
    website: "https://www.enel.it",
    contactName: "Marco Bianchi",
    email: "partner@enel.it",
    phone: "+39 800 900 860",
    street: "Viale Regina Margherita 137",
    city: "Roma",
    zip: "00198",
    country: "Italy",
    iban: "IT60X0542811101000000123456",
    commElectricity: 45,
    commGas: 38,
    contractStartDate: "01/01/2025",
    notes: "Primary energy partner. Volume bonus reviewed quarterly.",
    iconKey: "database",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    offers: [
      { id: "of-1", name: "Trend Home Electricity", commodity: "Electricity", priceType: "Fixed", commission: 45, status: "Active" },
      { id: "of-2", name: "Energia Sicura Gas", commodity: "Gas", priceType: "Variable", commission: 38, status: "Active" },
      { id: "of-3", name: "Dual Comfort", commodity: "Dual", priceType: "Fixed", commission: 60, status: "Expiring" },
    ],
  },
  {
    id: "eni",
    brandName: "Eni",
    legalName: "Eni Plenitude S.p.A.",
    taxId: "IT15844561009",
    commodity: "Gas",
    status: "Good",
    website: "https://eniplenitude.com",
    contactName: "Giulia Conte",
    email: "agenzie@plenitude.com",
    phone: "+39 800 900 700",
    street: "Piazzale Enrico Mattei 1",
    city: "Roma",
    zip: "00144",
    country: "Italy",
    iban: "IT60X0542811101000000654321",
    commElectricity: 40,
    commGas: 42,
    contractStartDate: "15/02/2025",
    notes: "Strong gas portfolio. Promotional rates in winter season.",
    iconKey: "flame",
    color: "text-rose-500",
    bg: "bg-rose-50",
    offers: [
      { id: "of-4", name: "Pure Energy Gas", commodity: "Gas", priceType: "Variable", commission: 42, status: "Active" },
      { id: "of-5", name: "Family Country", commodity: "Electricity", priceType: "Fixed", commission: 40, status: "Active" },
    ],
  },
  {
    id: "a2a",
    brandName: "A2A",
    legalName: "A2A Energia S.p.A.",
    taxId: "IT12883420155",
    commodity: "Electricity",
    status: "Warning",
    website: "https://www.a2aenergia.eu",
    contactName: "Luca Ferrari",
    email: "business@a2a.eu",
    phone: "+39 800 199 955",
    street: "Via Lamarmora 230",
    city: "Brescia",
    zip: "25124",
    country: "Italy",
    iban: "IT60X0542811101000000111222",
    commElectricity: 35,
    commGas: 30,
    contractStartDate: "10/03/2025",
    notes: "Contract under renewal — commission terms being renegotiated.",
    iconKey: "zap",
    color: "text-amber-500",
    bg: "bg-amber-50",
    offers: [
      { id: "of-6", name: "Click Luce", commodity: "Electricity", priceType: "Variable", commission: 35, status: "Active" },
      { id: "of-7", name: "Click Gas", commodity: "Gas", priceType: "Variable", commission: 30, status: "Draft" },
    ],
  },
  {
    id: "fastweb",
    brandName: "Fastweb",
    legalName: "Fastweb S.p.A.",
    taxId: "IT12878470157",
    commodity: "Electricity",
    status: "Good",
    website: "https://www.fastweb.it",
    contactName: "Anna Verde",
    email: "energy@fastweb.it",
    phone: "+39 800 920 600",
    street: "Piazza Adriano Olivetti 1",
    city: "Milano",
    zip: "20139",
    country: "Italy",
    iban: "IT60X0542811101000000333444",
    commElectricity: 50,
    commGas: 0,
    contractStartDate: "01/04/2025",
    notes: "Bundled energy + connectivity offers. Electricity only.",
    iconKey: "globe",
    color: "text-blue-500",
    bg: "bg-blue-50",
    offers: [
      { id: "of-8", name: "Fastweb Energia Luce", commodity: "Electricity", priceType: "Fixed", commission: 50, status: "Active" },
    ],
  },
];

export const getSupplierById = (id?: string): Supplier | undefined =>
  suppliersData.find((s) => s.id === id);
