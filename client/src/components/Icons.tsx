import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps, children: ReactNode) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconDashboard = (p: IconProps) =>
  base(p, <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>);

export const IconSales = (p: IconProps) =>
  base(p, <><path d="M4 4h2l2.2 11.2a2 2 0 0 0 2 1.8h7.6a2 2 0 0 0 2-1.6L21 8H7" /><circle cx="10" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" /></>);

export const IconMenu = (p: IconProps) =>
  base(p, <><path d="M6 3v7a2 2 0 0 0 4 0V3" /><path d="M8 10v11" /><path d="M17 3c-1.7 0-3 2.2-3 5s1.3 5 3 5" /><path d="M17 3v15" /></>);

export const IconInventory = (p: IconProps) =>
  base(p, <><path d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z" /><path d="M3 7.5V16l9 4.5 9-4.5V7.5" /><path d="M12 12v8.5" /></>);

export const IconSuppliers = (p: IconProps) =>
  base(p, <><rect x="2" y="8" width="13" height="9" rx="1.5" /><path d="M15 11h3.5l3 3.2V17h-6.5" /><circle cx="7" cy="19" r="1.6" /><circle cx="17.5" cy="19" r="1.6" /></>);

export const IconReports = (p: IconProps) =>
  base(p, <><path d="M4 20V10" /><path d="M11 20V4" /><path d="M18 20v-7" /></>);

export const IconLogout = (p: IconProps) =>
  base(p, <><path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>);

export const IconSearch = (p: IconProps) =>
  base(p, <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>);

export const IconEye = (p: IconProps) =>
  base(p, <><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" /><circle cx="12" cy="12" r="3" /></>);

export const IconEyeOff = (p: IconProps) =>
  base(p, <><path d="M3 3l18 18" /><path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c7 0 10.5 7 10.5 7a13.2 13.2 0 0 1-3.1 4" /><path d="M6.6 6.6C3.7 8.4 1.5 12 1.5 12s3.5 7 10.5 7a10.4 10.4 0 0 0 4.4-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>);

export const IconAlert = (p: IconProps) =>
  base(p, <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>);

export const IconTrend = (p: IconProps) =>
  base(p, <><path d="m3 17 6-6 4 4 8-8" /><path d="M17 6h4v4" /></>);

export const IconBowl = (p: IconProps) =>
  base(p, <><path d="M3 12h18a9 8 0 0 1-18 0Z" /><path d="M12 12V5" /><path d="M9 6.5c0-2 1.3-3.5 3-3.5s3 1.5 3 3.5" /></>);

export const IconBox = (p: IconProps) =>
  base(p, <><path d="M21 8V6.5L12 3 3 6.5V8" /><path d="M3 8l9 3.5L21 8" /><path d="M12 11.5V21" /><path d="M3 8v9l9 4 9-4V8" /></>);

export const IconEmpty = (p: IconProps) =>
  base(p, <><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></>);

export const IconClose = (p: IconProps) =>
  base(p, <><path d="M18 6 6 18" /><path d="M6 6l12 12" /></>);

export const IconPlus = (p: IconProps) =>
  base(p, <><path d="M12 5v14" /><path d="M5 12h14" /></>);

export const IconMinus = (p: IconProps) =>
  base(p, <path d="M5 12h14" />);

export const IconReceipt = (p: IconProps) =>
  base(p, <><path d="M6 3h12v18l-2.5-1.5L13 21l-1.5-1.5L10 21l-2.5-1.5L6 21V3Z" /><path d="M9 8h6" /><path d="M9 12h6" /></>);
