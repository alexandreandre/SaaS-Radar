"use client";

import { Megaphone, Rocket, Sprout } from "lucide-react";
import {
  MARKETING_PROFILES,
  type MarketingProfile,
} from "@/lib/campaign/tools";
import { cn } from "@/lib/utils";

type CampaignProfilePickerProps = {
  selected?: MarketingProfile;
  suggested?: MarketingProfile;
  onSelect: (profile: MarketingProfile) => void;
};

const PROFILE_ICONS: Record<MarketingProfile, typeof Sprout> = {
  organic: Sprout,
  "paid-light": Megaphone,
  "paid-scale": Rocket,
};

export function CampaignProfilePicker({
  selected,
  suggested,
  onSelect,
}: CampaignProfilePickerProps) {
  const profiles = Object.keys(MARKETING_PROFILES) as MarketingProfile[];

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4">
        <p className="font-data text-[10px] uppercase tracking-data text-primary">
          Profil marketing
        </p>
        <h3 className="mt-1 text-lg font-semibold">Quel est votre budget pub ?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          On adapte les outils et le parcours à votre profil.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {profiles.map((profile) => {
          const meta = MARKETING_PROFILES[profile];
          const Icon = PROFILE_ICONS[profile];
          const isSelected = selected === profile;
          const isSuggested = suggested === profile && !selected;

          return (
            <button
              key={profile}
              type="button"
              onClick={() => onSelect(profile)}
              className={cn(
                "rounded-xl border p-4 text-left transition-colors",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border hover:border-primary/40",
              )}
            >
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-2 font-medium">{meta.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{meta.description}</p>
              {isSuggested ? (
                <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-primary">
                  Recommandé
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
