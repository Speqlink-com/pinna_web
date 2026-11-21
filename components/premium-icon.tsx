import Image from "next/image";

const assets = {
  chevron: "/left-chevron.webp",
  lock: "/lock.webp",
  dropdown: "/dropdown-icon.webp",
  profile: "/profile-icon.webp",
  notification: "/notification-icon.webp",
  location: "/location-icon.webp",
  message: "/message-icon.webp",
  settings: "/settings-icon.webp",
  search: "/search-icon.webp",
  sidebar: "/sidebar-toggler-icon.webp",
  business: "/chemist-icon.webp",
  add: "/add-icon.png",
  logout: "/logout-icon.png",
  team: "/team-icon.png",
} as const;

/** Decorative artwork; the surrounding control supplies its accessible name. */
export function PremiumIcon({
  name,
  size = 24,
  className = "",
}: {
  name: keyof typeof assets;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={assets[name]}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      className={`premium-icon ${className}`}
      unoptimized
    />
  );
}
