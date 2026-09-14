export const MAIN_NAV = [
  { label: "Properties", href: "/properties" },
  { label: "Brokers", href: "/brokers" },
  { label: "Communities", href: "/communities" },
  { label: "Developers", href: "/developers" },
  { label: "Investors", href: "/investors" },
  { label: "Partners", href: "/partners" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const PROPERTY_PURPOSE_LABELS: Record<string, string> = {
  BUY: "Buy",
  RENT: "Rent",
  COMMERCIAL: "Commercial",
  OFF_PLAN: "Off-Plan",
  LUXURY: "Luxury",
  INVESTMENT: "Investment",
  HOLIDAY: "Holiday / Short-Term",
};

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Apartment",
  VILLA: "Villa",
  TOWNHOUSE: "Townhouse",
  PENTHOUSE: "Penthouse",
  OFFICE: "Office",
  RETAIL: "Retail",
  WAREHOUSE: "Warehouse",
  LAND: "Land",
};

export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  VIEWING: "Viewing",
  NEGOTIATION: "Negotiation",
  OFFER: "Offer",
  CONTRACT: "Contract",
  CLOSED: "Closed",
  LOST: "Lost",
};

export const LEAD_STATUS_ORDER = Object.keys(LEAD_STATUS_LABELS);

export const PARTNER_STATUS_LABELS: Record<string, string> = {
  PENDING_VERIFICATION: "Pending Verification",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  MORE_INFORMATION_REQUIRED: "More Information Required",
  SUSPENDED: "Suspended",
};

export const PARTNER_TYPE_LABELS: Record<string, string> = {
  INDEPENDENT_BROKER: "Independent Broker",
  BROKERAGE_COMPANY: "Brokerage Company",
  PROPERTY_OWNER: "Property Owner",
  DEVELOPER: "Developer",
  INVESTOR: "Investor",
  CORPORATE_PARTNER: "Corporate Partner",
  SERVICE_PROVIDER: "Service Provider",
};

export const COMMUNITIES = [
  "Dubai Marina",
  "Downtown Dubai",
  "Business Bay",
  "Dubai Hills",
  "Palm Jumeirah",
  "JVC",
  "Arabian Ranches",
  "Dubai Creek Harbour",
  "Emaar Beachfront",
  "DIFC",
  "Jumeirah",
  "Al Barsha",
] as const;

/** Default commission rate applied when a deal reaches the Commission stage, per the spec's worked example (~2%). Editable per-deal afterwards. */
export const COMMISSION_DEFAULT_RATE = 0.02;

export const DEAL_STAGE_LABELS: Record<string, string> = {
  VIEWING: "Viewing",
  OFFER: "Offer",
  NEGOTIATION: "Negotiation",
  MOU: "MOU",
  CONTRACT: "Contract",
  PAYMENT: "Payment",
  TRANSFER: "Transfer",
  COMMISSION: "Commission",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

export const DEAL_STAGE_ORDER = [
  "VIEWING",
  "OFFER",
  "NEGOTIATION",
  "MOU",
  "CONTRACT",
  "PAYMENT",
  "TRANSFER",
  "COMMISSION",
  "CLOSED",
];

export const COMMISSION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  EXPECTED: "Expected",
  APPROVED: "Approved",
  PAID: "Paid",
  DISPUTED: "Disputed",
};

export const DEMO_DATA_DISCLAIMER =
  "Demo data for development and evaluation purposes. Not a live or official DLD data feed.";
