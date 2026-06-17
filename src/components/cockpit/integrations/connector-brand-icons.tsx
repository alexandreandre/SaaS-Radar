import type { SVGProps } from "react";
import {
  SiBetterstack,
  SiBrevo,
  SiFathom,
  SiGithub,
  SiGoogleads,
  SiGoogleanalytics,
  SiHubspot,
  SiIntercom,
  SiLemonsqueezy,
  SiMeta,
  SiMixpanel,
  SiPaddle,
  SiPlausibleanalytics,
  SiPosthog,
  SiResend,
  SiSentry,
  SiStripe,
  SiTiktok,
  SiVercel,
  SiZendesk,
} from "@icons-pack/react-simple-icons";

export type BrandIconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  color?: string;
  title?: string;
};

type BrandIconComponent = (props: BrandIconProps) => JSX.Element;

export const SIMPLE_BRAND_ICONS: Record<string, BrandIconComponent> = {
  SiStripe: (props) => <SiStripe {...props} />,
  SiLemonsqueezy: (props) => <SiLemonsqueezy {...props} />,
  SiPaddle: (props) => <SiPaddle {...props} />,
  SiGoogleads: (props) => <SiGoogleads {...props} />,
  SiMeta: (props) => <SiMeta {...props} />,
  SiTiktok: (props) => <SiTiktok {...props} />,
  SiPlausibleanalytics: (props) => <SiPlausibleanalytics {...props} />,
  SiGoogleanalytics: (props) => <SiGoogleanalytics {...props} />,
  SiPosthog: (props) => <SiPosthog {...props} />,
  SiMixpanel: (props) => <SiMixpanel {...props} />,
  SiFathom: (props) => <SiFathom {...props} />,
  SiBrevo: (props) => <SiBrevo {...props} />,
  SiResend: (props) => <SiResend {...props} />,
  SiIntercom: (props) => <SiIntercom {...props} />,
  SiZendesk: (props) => <SiZendesk {...props} />,
  SiGithub: (props) => <SiGithub {...props} />,
  SiVercel: (props) => <SiVercel {...props} />,
  SiSentry: (props) => <SiSentry {...props} />,
  SiBetterstack: (props) => <SiBetterstack {...props} />,
  SiHubspot: (props) => <SiHubspot {...props} />,
};
