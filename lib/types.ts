export type Role = "USER" | "BUSINESS" | "ADMIN" | "SUPER_ADMIN";
export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
  mfaRequired: boolean;
  mfaEnrolled: boolean;
  hasPassword?: boolean;
  googleConnected?: boolean;
  approvalStatus?:
    "NOT_REQUIRED" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  approvalNote?: string | null;
};
export const portfolioTypes = [
  "Hospital / clinic",
  "Pharmacy / chemist",
  "Ambulance service",
  "Agrovet",
  "Veterinary practice",
  "Laboratory",
  "Home care",
  "Other service",
] as const;
export type Portfolio = {
  id: string;
  name: string;
  category: string;
  county: string;
  address: string;
  status:
    | "DRAFT"
    | "SUBMITTED"
    | "ADMIN_RECOMMENDED"
    | "APPROVED"
    | "CHANGES_REQUESTED";
  created_at: string;
  insurance: string[];
  services: {
    name: string;
    kind?: "service" | "product";
    available?: boolean;
    trackInventory?: boolean;
    inStock?: boolean | null;
    price: number | null;
    priceType?: "fixed" | "from" | "quote";
  }[];
  phone: string;
};
export type Provider = Portfolio & {
  distance: number | null;
  is_open?: boolean;
  accepting_customers?: boolean;
  description?: string;
  latitude?: number | null;
  longitude?: number | null;
  verification_expires_on?: string | null;
  opening_hours?: {
    day: number;
    closed: boolean;
    allDay: boolean;
    opens: string;
    closes: string;
    overnight: boolean;
  }[];
};
export type Conversation = {
  id: string;
  provider_name: string;
  customer_name: string;
  last_message: string | null;
  updated_at: string;
  portfolio_id: string;
};
export type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};
export type DashboardData = {
  portfolios: Portfolio[];
  conversations: Conversation[];
  admins: {
    id: string;
    name: string;
    email: string;
    created_at: string;
    must_change_password: boolean;
  }[];
  stats: { label: string; value: number; detail: string }[];
};
