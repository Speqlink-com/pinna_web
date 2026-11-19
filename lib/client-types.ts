import type { Portfolio, User } from "./types";
export type CategoryField = {
  key: string;
  label: string;
  type: "text" | "list" | "select" | "boolean" | "number";
  options?: string[];
};
export type ClientOptions = {
  categories: Record<string, CategoryField[]>;
  documentKinds: { value: string; label: string }[];
  maxDocumentBytes: number;
  currency: string;
};
export type BusinessProfile = {
  tradingName: string;
  registrationNumber: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  county: string;
  address: string;
  website: string;
  description: string;
  revision: number;
};
export type OpeningHours = {
  day: number;
  closed: boolean;
  allDay: boolean;
  opens: string;
  closes: string;
  overnight: boolean;
};
export type ClientService = {
  name: string;
  price: number | null;
  priceType: "fixed" | "from" | "quote";
};
export type ClientPortfolio = Omit<Portfolio, "services"> & {
  owner_id: string;
  owner_name?: string;
  owner_email?: string;
  description: string;
  registration_number: string;
  licensing_authority: string;
  license_number: string;
  latitude: number | null;
  longitude: number | null;
  category_details: Record<string, string | boolean | number | string[]>;
  opening_hours: OpeningHours[];
  revision: number;
  updated_at: string;
  verification_expires_on: string | null;
  review_note: string | null;
  archived_at: string | null;
  services: ClientService[];
};
export type Evidence = {
  id: string;
  kind: string;
  filename: string;
  media_type: string;
  byte_size: number;
  document_number: string;
  issuing_authority: string;
  expires_on: string | null;
  created_at: string;
};
export type ClientDetail = {
  portfolio: ClientPortfolio;
  businessProfile: BusinessProfile | null;
  documents: Evidence[];
  requirements: string[];
  submissions: {
    id: string;
    version: number;
    state: string;
    submitted_at: string;
    decision_note: string | null;
  }[];
  history: {
    id: number;
    action: string;
    note: string;
    revision: number;
    created_at: string;
    actor_name: string | null;
  }[];
  submissionSnapshot: { businessProfile?: BusinessProfile } | null;
};
export type PortfolioForm = {
  name: string;
  category: string;
  county: string;
  address: string;
  phone: string;
  registrationNumber: string;
  description: string;
  licensingAuthority: string;
  licenseNumber: string;
  insurance: string[];
  services: ClientService[];
  latitude: number | null;
  longitude: number | null;
  categoryDetails: ClientPortfolio["category_details"];
  openingHours: OpeningHours[];
  revision: number;
};
export type ClientWorkspaceProps = { user: User };
