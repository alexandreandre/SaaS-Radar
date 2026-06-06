"use client";

import { memo } from "react";
import { Geography, type Geography as RsmGeography } from "react-simple-maps";

type CountryGeographyProps = {
  geo: RsmGeography;
  fill: string;
  stroke: string;
  cursor: string;
  pressedFill?: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
};

export const CountryGeography = memo(function CountryGeography({
  geo,
  fill,
  stroke,
  cursor,
  pressedFill,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: CountryGeographyProps) {
  return (
    <Geography
      geography={geo}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={{
        default: {
          fill,
          stroke,
          strokeWidth: 0.25,
          outline: "none",
          cursor,
          transition: "fill 0.25s ease",
        },
        hover: { outline: "none" },
        pressed: { fill: pressedFill, outline: "none" },
      }}
    />
  );
});
