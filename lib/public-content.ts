export const platformIdentity = {
  introduction:
    "Pinnaa connects healthcare, animal health, agriculture and everyday essentials in one One Health platform. Find verified providers, understand your options and make your next connection with confidence.",
  ecosystem:
    "For individuals, families, farmers and businesses. Useful information, services and conversations come together, so the next step is easier to take.",
  vision:
    "A world where human, animal and environmental health are connected, and everyone can access the services they need for a healthier, safer and more sustainable future.",
  mission:
    "Connect people, animals, businesses and essential service providers through one trusted platform that simplifies access to care, veterinary services, agricultural solutions and everyday needs.",
};

export const serviceGroups = [
  {
    id: "healthcare",
    title: "Healthcare",
    detail: "Hospitals, clinics, laboratories and home-care services.",
    icon: "health",
  },
  {
    id: "pharmacies",
    title: "Pharmacies & chemists",
    detail: "Explore listed medicines, products and service availability.",
    icon: "pharmacy",
  },
  {
    id: "animal-health",
    title: "Animal health & agriculture",
    detail: "Veterinary practices, agrovets and agricultural essentials.",
    icon: "nature",
  },
  {
    id: "emergency-services",
    title: "Ambulance services",
    detail: "Find provider contact details and confirm availability directly.",
    icon: "ambulance",
  },
] as const;

export const publicMenus = [
  {
    id: "about",
    label: "About Us",
    eyebrow: "THE PINNAA STORY",
    title: "Care. Cultivate. Connect.",
    description:
      "One Health starts with better connections between people, animals, the environment and essential services.",
    links: [
      {
        title: "Who we are",
        detail: "One platform. A connected community.",
        href: "/explore#about",
        icon: "team",
      },
      {
        title: "Our purpose",
        detail: "Our vision and mission for One Health.",
        href: "/explore#purpose",
        icon: "health",
      },
      {
        title: "Who we serve",
        detail: "For people, farmers and businesses.",
        href: "/explore#people",
        icon: "nature",
      },
    ],
  },
  {
    id: "services",
    label: "Services",
    eyebrow: "FIND YOUR STARTING POINT",
    title: "The right service. A closer connection.",
    description:
      "Explore the network, then sign in to compare listed providers by service, location, insurance or budget.",
    links: serviceGroups.map((s) => ({
      title: s.title,
      detail: s.detail,
      href: `/explore#${s.id}`,
      icon: s.icon,
    })),
  },
  {
    id: "providers",
    label: "For providers",
    eyebrow: "GROW WITH PINNAA",
    title: "Every business. Every location.",
    description:
      "Bring your services and customer conversations together in a workspace built around your business.",
    links: [
      {
        title: "Join the network",
        detail: "Register a business and submit it for review.",
        href: "/sign-up?account=business",
        icon: "business",
      },
      {
        title: "Your business toolkit",
        detail: "Locations, hours, offerings and optional stock.",
        href: "/explore#providers",
        icon: "settings",
      },
      {
        title: "How approval works",
        detail: "Each business is reviewed before publication.",
        href: "/explore#approval",
        icon: "shield",
      },
    ],
  },
  {
    id: "guidance",
    label: "Guidance",
    eyebrow: "MAKE YOUR NEXT STEP CLEARER",
    title: "A little clarity goes a long way.",
    description:
      "Understand your account, the provider journey and the privacy choices available to you.",
    links: [
      {
        title: "How Pinnaa works",
        detail: "Discover, compare and connect.",
        href: "/explore#how",
        icon: "guide",
      },
      {
        title: "Help & FAQs",
        detail: "Practical guidance for your account.",
        href: "/help",
        icon: "help",
      },
      {
        title: "Privacy & access",
        detail: "Your information and your choices.",
        href: "/privacy",
        icon: "lock",
      },
    ],
  },
  {
    id: "contact",
    label: "Contact Us",
    eyebrow: "START IN THE RIGHT PLACE",
    title: "Let’s get you connected.",
    description:
      "Find help with your account, business registration or a provider enquiry.",
    links: [
      {
        title: "Account support",
        detail: "Sign-in, verification and password guidance.",
        href: "/help#account-help",
        icon: "profile",
      },
      {
        title: "Provider onboarding",
        detail: "Get your business ready for review.",
        href: "/help#provider-help",
        icon: "business",
      },
      {
        title: "Contact a provider",
        detail: "Sign in to message a listed business.",
        href: "/sign-in",
        icon: "message",
      },
    ],
  },
] as const;
