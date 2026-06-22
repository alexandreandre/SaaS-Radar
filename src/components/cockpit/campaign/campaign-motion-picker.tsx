"use client";

import type { GtmMotion } from "@/lib/campaign/gtm-engine";
import { GTM_MOTION_LABELS } from "@/lib/campaign/gtm-engine";
import type { MarketingProfile } from "@/lib/campaign/tools";
import { MARKETING_PROFILES } from "@/lib/campaign/tools";
import { cn } from "@/lib/utils";

const MOTIONS: GtmMotion[] = [
  "founder_led",
  "outbound",
  "content",
  "paid_test",
  "launch",
];

const PROFILES: MarketingProfile[] = ["organic", "paid-light", "paid-scale"];

type CampaignMotionPickerProps = {
  motion: GtmMotion;
  profile: MarketingProfile;
  onMotionChange: (motion: GtmMotion) => void;
  onProfileChange: (profile: MarketingProfile) => void;
};

export function CampaignMotionPicker({
  motion,
  profile,
  onMotionChange,
  onProfileChange,
}: CampaignMotionPickerProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">Motion GTM (un seul focus)</p>
        <div className="flex flex-wrap gap-2">
          {MOTIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onMotionChange(m)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                motion === m
                  ? "border-primary bg-primary/10 font-medium"
                  : "border-border hover:border-primary/40",
              )}
            >
              {GTM_MOTION_LABELS[m]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Profil marketing</p>
        <div className="flex flex-wrap gap-2">
          {PROFILES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onProfileChange(p)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                profile === p
                  ? "border-primary bg-primary/10 font-medium"
                  : "border-border hover:border-primary/40",
              )}
            >
              {MARKETING_PROFILES[p].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
