"use client";

import { ScoreGauge } from "@/components/scores/score-gauge";

interface ScoreCircleProps {
  value: number;
  max: number;
  size: number;
  label: string;
  delay?: number;
}

export function ScoreCircle({ value, max, size, label, delay = 0 }: ScoreCircleProps) {
  return (
    <ScoreGauge
      label={label}
      value={value}
      max={max}
      diameter={size}
      delay={delay}
      showMax={max === 100}
    />
  );
}
