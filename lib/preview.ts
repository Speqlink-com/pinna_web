import type { DashboardData, Provider, User, Role } from "./types";
export const previewUsers: Record<string, User> = {
  customer: {
    id: "preview-customer",
    name: "Alex Morgan",
    email: "alex@example.com",
    role: "USER",
    mustChangePassword: false,
    mfaRequired: false,
    mfaEnrolled: false,
  },
  business: {
    id: "preview-business",
    name: "Jordan Kamau",
    email: "jordan@example.com",
    role: "BUSINESS",
    mustChangePassword: false,
    mfaRequired: false,
    mfaEnrolled: false,
  },
  admin: {
    id: "preview-admin",
    name: "Sam Wanjiru",
    email: "sam@example.com",
    role: "SUPER_ADMIN",
    mustChangePassword: false,
    mfaRequired: false,
    mfaEnrolled: true,
  },
};
export const previewProviders: Provider[] = [
  {
    id: "demo-1",
    name: "Parkview Medical Centre",
    category: "Hospital / clinic",
    county: "Nairobi",
    address: "Parklands Road, Nairobi",
    phone: "",
    status: "APPROVED",
    insurance: ["Jubilee", "SHA", "AAR"],
    services: [
      { name: "General consultation", price: 1500 },
      { name: "Wellness screening", price: 3500 },
    ],
    distance: null,
    created_at: "2026-11-08T08:00:00Z",
  },
  {
    id: "demo-2",
    name: "Cornerstone Community Chemist",
    category: "Pharmacy / chemist",
    county: "Nairobi",
    address: "Waiyaki Way, Nairobi",
    phone: "",
    status: "APPROVED",
    insurance: ["Jubilee", "Britam"],
    services: [{ name: "Pharmacy consultation", price: 500 }],
    distance: null,
    created_at: "2026-11-07T08:00:00Z",
  },
  {
    id: "demo-3",
    name: "Westlands Family Clinic",
    category: "Hospital / clinic",
    county: "Nairobi",
    address: "Woodvale Grove, Nairobi",
    phone: "",
    status: "APPROVED",
    insurance: ["SHA", "AAR"],
    services: [{ name: "General consultation", price: 1000 }],
    distance: null,
    created_at: "2026-11-06T08:00:00Z",
  },
  {
    id: "demo-4",
    name: "Greenfield Agrovet",
    category: "Agrovet",
    county: "Kiambu",
    address: "Limuru Road, Kiambu",
    phone: "",
    status: "APPROVED",
    insurance: [],
    services: [{ name: "Veterinary consultation", price: 800 }],
    distance: null,
    created_at: "2026-11-05T08:00:00Z",
  },
  {
    id: "demo-5",
    name: "Nairobi Diagnostic Centre",
    category: "Laboratory",
    county: "Nairobi",
    address: "Ngong Road, Nairobi",
    phone: "",
    status: "APPROVED",
    insurance: ["Jubilee", "SHA"],
    services: [{ name: "Laboratory services", price: null }],
    distance: null,
    created_at: "2026-11-04T08:00:00Z",
  },
  {
    id: "demo-6",
    name: "Carelink Ambulance Services",
    category: "Ambulance service",
    county: "Nairobi",
    address: "Kilimani, Nairobi",
    phone: "",
    status: "APPROVED",
    insurance: ["AAR", "Britam"],
    services: [{ name: "Patient transfer enquiry", price: null }],
    distance: null,
    created_at: "2026-11-03T08:00:00Z",
  },
];
export function previewData(role: Role): DashboardData {
  return {
    portfolios:
      role === "BUSINESS"
        ? [
            { ...previewProviders[0], status: "DRAFT" },
            { ...previewProviders[1], status: "SUBMITTED" },
          ]
        : role === "SUPER_ADMIN"
          ? previewProviders.slice(0, 4).map((p, i) => ({
              ...p,
              status:
                i === 0
                  ? "SUBMITTED"
                  : i === 1
                    ? "ADMIN_RECOMMENDED"
                    : i === 2
                      ? "CHANGES_REQUESTED"
                      : "DRAFT",
            }))
          : [],
    conversations: [
      {
        id: "demo-conversation",
        provider_name: "Parkview Medical Centre",
        customer_name: "Alex Morgan",
        last_message:
          "Hello, do you accept my Jubilee plan for a consultation?",
        updated_at: "2026-11-09T08:30:00Z",
        portfolio_id: "demo-1",
      },
    ],
    admins: [
      {
        id: "demo-admin",
        name: "Taylor Mwangi",
        email: "taylor@example.com",
        created_at: "2026-11-08T08:00:00Z",
        must_change_password: true,
      },
    ],
    stats:
      role === "BUSINESS"
        ? [
            {
              label: "Your portfolios",
              value: 2,
              detail: "Across two service categories",
            },
            { label: "Published", value: 0, detail: "Verification needed" },
            {
              label: "Conversations",
              value: 1,
              detail: "Customer connections",
            },
            {
              label: "In progress",
              value: 2,
              detail: "Complete portfolio setup",
            },
          ]
        : role === "SUPER_ADMIN"
          ? [
              {
                label: "Portfolio applications",
                value: 4,
                detail: "Across the platform",
              },
              {
                label: "Awaiting review",
                value: 1,
                detail: "Submitted for initial review",
              },
              {
                label: "Awaiting approval",
                value: 1,
                detail: "Super Admin decision required",
              },
              {
                label: "Published portfolios",
                value: 0,
                detail: "Approved in this queue",
              },
            ]
          : [
              {
                label: "Saved providers",
                value: 0,
                detail: "Your shortlist, in one place",
              },
              {
                label: "Conversations",
                value: 1,
                detail: "Connect directly with providers",
              },
            ],
  };
}
