import type { SVGProps } from "react";

type LocalIconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  color?: string;
};

function iconProps({ size = 24, color = "currentColor", ...rest }: LocalIconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color,
    role: "img" as const,
    ...rest,
  };
}

export function LocalFreemiusIcon(props: LocalIconProps) {
  return (
    <svg {...iconProps(props)} aria-hidden="true">
      <path d="M4 4h16v4H4V4zm0 6h10v4H4v-4zm0 6h14v4H4v-4z" />
    </svg>
  );
}

export function LocalLinkedinAdsIcon(props: LocalIconProps) {
  const { color = "currentColor", ...rest } = props;
  return (
    <svg {...iconProps({ ...rest, color })} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
    </svg>
  );
}

export function LocalMicrosoftAdsIcon(props: LocalIconProps) {
  const { size = 24, ...rest } = props;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-hidden="true" {...rest}>
      <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022" />
      <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00" />
      <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF" />
      <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900" />
    </svg>
  );
}

export function LocalLoopsIcon(props: LocalIconProps) {
  const { color = "currentColor", ...rest } = props;
  return (
    <svg {...iconProps({ ...rest, color })} aria-hidden="true" fill="none">
      <path
        d="M12 4c4.418 0 8 3.134 8 7s-3.582 7-8 7c-1.657 0-3.2-.5-4.472-1.356"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M8 12H4l2.5-2.5M4 12l2.5 2.5"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LocalCrispIcon(props: LocalIconProps) {
  const { color = "currentColor", ...rest } = props;
  return (
    <svg {...iconProps({ ...rest, color })} aria-hidden="true">
      <path d="M12 3C7.03 3 3 6.582 3 11c0 2.386 1.094 4.537 2.828 6.05L5 21l4.05-1.172A9.96 9.96 0 0012 19c4.97 0 9-3.582 9-8s-4.03-8-9-8z" />
    </svg>
  );
}

export function LocalQontoIcon(props: LocalIconProps) {
  const { color = "currentColor", ...rest } = props;
  return (
    <svg {...iconProps({ ...rest, color })} aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 3.5a6.5 6.5 0 110 13 6.5 6.5 0 010-13z" />
    </svg>
  );
}

export function LocalPennylaneIcon(props: LocalIconProps) {
  const { color = "currentColor", ...rest } = props;
  return (
    <svg {...iconProps({ ...rest, color })} aria-hidden="true">
      <path d="M4 20V4h4.5c3.038 0 5.5 2.015 5.5 4.5S11.538 13 8.5 13H8v7H4zm4-9h.5c1.38 0 2.5-.896 2.5-2s-1.12-2-2.5-2H8v4z" />
    </svg>
  );
}

export function LocalAbbyIcon(props: LocalIconProps) {
  const { color = "currentColor", ...rest } = props;
  return (
    <svg {...iconProps({ ...rest, color })} aria-hidden="true">
      <path d="M4 20l6-16h2.5l6 16h-3.5l-1.25-3.5H8.75L7.5 20H4zm5.25-6h5.5L12 8.5 9.25 14z" />
    </svg>
  );
}

export function LocalSlackIcon(props: LocalIconProps) {
  return (
    <svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24" role="img" aria-hidden="true">
      <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 17.688a2.527 2.527 0 012.522-2.523h2.52v2.523zm1.271 0a2.527 2.527 0 012.521-2.523 2.527 2.527 0 012.521 2.523v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313z" />
      <path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312z" />
      <path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.271 0a2.528 2.528 0 01-2.523 2.521 2.528 2.528 0 01-2.52-2.521V2.522A2.528 2.528 0 0115.162 0a2.528 2.528 0 012.523 2.522v6.312z" />
      <path fill="#ECB22E" d="M15.162 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.162 24a2.528 2.528 0 01-2.523-2.522v-2.522h2.523zm0-1.271a2.528 2.528 0 01-2.523-2.522 2.528 2.528 0 012.523-2.523h6.315A2.528 2.528 0 0124 15.163a2.528 2.528 0 01-2.522 2.522h-6.316z" />
    </svg>
  );
}

export function LocalPipedriveIcon(props: LocalIconProps) {
  const { color = "currentColor", ...rest } = props;
  return (
    <svg {...iconProps({ ...rest, color })} aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 5.5h2v3.25l2.75 4.75h-2.1l-1.65-2.875V17.5h-2V7.5z" />
    </svg>
  );
}

export const LOCAL_BRAND_ICONS: Record<
  string,
  (props: LocalIconProps) => JSX.Element
> = {
  freemius: LocalFreemiusIcon,
  "linkedin-ads": LocalLinkedinAdsIcon,
  "microsoft-ads": LocalMicrosoftAdsIcon,
  loops: LocalLoopsIcon,
  crisp: LocalCrispIcon,
  qonto: LocalQontoIcon,
  pennylane: LocalPennylaneIcon,
  abby: LocalAbbyIcon,
  slack: LocalSlackIcon,
  pipedrive: LocalPipedriveIcon,
};
