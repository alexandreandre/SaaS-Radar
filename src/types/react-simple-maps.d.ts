declare module "react-simple-maps" {
  import { ReactNode, CSSProperties } from "react";

  export interface Geography {
    rsmKey: string;
    properties: Record<string, string>;
  }

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: Record<string, number | [number, number]>;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
  }

  export interface ZoomableGroupProps {
    zoom?: number;
    center?: [number, number];
    onMoveEnd?: (position: { coordinates: [number, number]; zoom: number }) => void;
    children?: ReactNode;
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (data: { geographies: Geography[] }) => ReactNode;
  }

  export interface GeographyProps {
    geography: Geography;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onClick?: () => void;
    style?: {
      default?: CSSProperties;
      hover?: CSSProperties;
      pressed?: CSSProperties;
    };
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element;
  export function ZoomableGroup(props: ZoomableGroupProps): JSX.Element;
  export function Geographies(props: GeographiesProps): JSX.Element;
  export function Geography(props: GeographyProps): JSX.Element;
}
