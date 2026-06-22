"use client";

import { ScoreGauge } from "@/components/scores/score-gauge";

interface ScoreCircleProps {
  value: number;
  max: number;
  size: number;
  label: string;
  tooltip?: string;
  delay?: number;
}

export function ScoreCircle({ value, max, size, label, tooltip, delay = 0 }: ScoreCircleProps) {
  return (
    <ScoreGauge
      label={label}
      value={value}
      max={max}
      diameter={size}
      delay={delay}
      tooltip={tooltip}
      showMax={max === 100}
    />
  );
}
