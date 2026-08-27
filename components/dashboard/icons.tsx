import type { SVGProps } from "react";

/**
 * Hand-rolled, dependency-free icon set for the dashboard shell and stat
 * cards. Deliberately small and stroke-based rather than pulling in an
 * icon package — add more here as the dashboard grows.
 */
type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.75,
    stroke: "currentColor",
    "aria-hidden": true,
    ...props,
  };
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

export function DashboardIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 4.5h6v6h-6zM14.25 4.5h6v6h-6zM3.75 13.5h6v6h-6zM14.25 13.5h6v6h-6z"
      />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.25" strokeLinecap="round" strokeLinejoin="round" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 12h16.5M12 3.75c2.25 2.25 3.375 5.25 3.375 8.25S14.25 18.75 12 21c-2.25-2.25-3.375-5.25-3.375-8.25S9.75 6 12 3.75Z"
      />
    </svg>
  );
}

export function ServerIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.75" y="4.5" width="16.5" height="6" rx="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3.75" y="13.5" width="16.5" height="6" rx="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" d="M6.75 7.5h.008M6.75 16.5h.008" />
    </svg>
  );
}

export function InvoiceIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3.75h10.5v16.5l-2.625-1.5-2.625 1.5-2.625-1.5-2.625 1.5z"
      />
      <path strokeLinecap="round" d="M9 8.25h6M9 11.25h6M9 14.25h3.75" />
    </svg>
  );
}

export function TicketIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 9a1.5 1.5 0 0 0 0 3v3a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-3a1.5 1.5 0 0 1 0-3V6a1.5 1.5 0 0 0-1.5-1.5H5.25A1.5 1.5 0 0 0 3.75 6z"
      />
      <path strokeLinecap="round" strokeDasharray="1.5 2.5" d="M10.5 4.5v15" />
    </svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 8.25V6.75a1.5 1.5 0 0 1 1.5-1.5h6.75a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5H9.75a1.5 1.5 0 0 1-1.5-1.5v-1.5"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h10.5m0 0-3-3m3 3-3 3" />
    </svg>
  );
}

export function LifeBuoyIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.25" />
      <circle cx="12" cy="12" r="3.75" />
      <path d="m6.32 6.32 2.65 2.65M17.68 6.32l-2.65 2.65M6.32 17.68l2.65-2.65M17.68 17.68l-2.65-2.65" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8.25" r="3.375" strokeLinecap="round" strokeLinejoin="round" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.875 19.5a7.125 7.125 0 0 1 14.25 0"
      />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10.5" cy="10.5" r="6.75" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 20.25-4.35-4.35" />
    </svg>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.5l1.83 10.06a1.5 1.5 0 0 0 1.48 1.24h8.31a1.5 1.5 0 0 0 1.47-1.18l1.4-6.62H5.03"
      />
      <circle cx="8.25" cy="19.5" r="1.125" />
      <circle cx="15.75" cy="19.5" r="1.125" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 6.75h15M9.75 6.75V4.5a1.5 1.5 0 0 1 1.5-1.5h1.5a1.5 1.5 0 0 1 1.5 1.5v2.25M6.75 6.75l.6 12.09a1.5 1.5 0 0 0 1.497 1.41h6.306a1.5 1.5 0 0 0 1.497-1.41l.6-12.09"
      />
    </svg>
  );
}

export function PercentIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 5.25 5.25 18.75" />
      <circle cx="7.125" cy="7.125" r="2.625" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16.875" cy="16.875" r="2.625" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TakaIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 3.75v9a4.5 4.5 0 0 0 4.5 4.5h.75M6.75 8.25h7.5M15.75 3.75c-1.243 0-2.348.586-3.058 1.5"
      />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 9.75a5.25 5.25 0 0 1 10.5 0v3.19c0 .53.21 1.04.586 1.414l.914.914a1.125 1.125 0 0 1-.796 1.92H5.046a1.125 1.125 0 0 1-.796-1.92l.914-.914c.375-.375.586-.884.586-1.414z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 18.75a2.25 2.25 0 0 0 4.5 0" />
    </svg>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5h15" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 19.5v-6M12 19.5V9M16.5 19.5V6" />
    </svg>
  );
}

export function DocIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 3.75h6l3.75 3.75v12a1.5 1.5 0 0 1-1.5 1.5h-8.25a1.5 1.5 0 0 1-1.5-1.5V5.25a1.5 1.5 0 0 1 1.5-1.5Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 3.75V7.5h3.75M9 12.75h6M9 15.75h6" />
    </svg>
  );
}

export function ClipboardIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5.25h6a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H9a1.5 1.5 0 0 1-1.5-1.5v-12A1.5 1.5 0 0 1 9 5.25Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75h4.5v3h-4.5z" />
      <path strokeLinecap="round" d="M9.75 11.25h4.5M9.75 14.25h4.5" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3.25" strokeLinecap="round" strokeLinejoin="round" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m4.6 9.4 1.7-.5.9-2.2-.9-1.6 1.7-1.7 1.6.9 2.2-.9.5-1.7h2.4l.5 1.7 2.2.9 1.6-.9 1.7 1.7-.9 1.6.9 2.2 1.7.5v2.4l-1.7.5-.9 2.2.9 1.6-1.7 1.7-1.6-.9-2.2.9-.5 1.7h-2.4l-.5-1.7-2.2-.9-1.6.9-1.7-1.7.9-1.6-.9-2.2-1.7-.5Z"
      />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75 18.75 6v5.25c0 4.5-2.925 7.6-6.75 9-3.825-1.4-6.75-4.5-6.75-9V6Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2.1 2.1L15.75 9.5" />
    </svg>
  );
}

export function InboxIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 12h4.5l1.5 3h4.5l1.5-3h4.5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.106 6.246 3.75 12v6a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-6l-1.356-5.754A1.5 1.5 0 0 0 17.442 5H6.558a1.5 1.5 0 0 0-1.452 1.246Z"
      />
    </svg>
  );
}
