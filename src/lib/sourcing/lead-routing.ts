import type { DedupMatch } from "@/lib/admin/sourcing-dedup.shared";

export type LeadDestination = "direct" | "draft";

export type LeadRoutingDecision = {
  destination: LeadDestination;
  reason: string;
};

export function decideLeadDestination(input: {
  score: number;
  autoPublishMinScore: number;
  dedupMatches: DedupMatch[];
  invalidUrls: string[];
}): LeadRoutingDecision {
  if (input.dedupMatches.length > 0) {
    return { destination: "draft", reason: "doublon" };
  }
  if (input.invalidUrls.length > 0) {
    return { destination: "draft", reason: "invalid_urls" };
  }
  if (input.score >= input.autoPublishMinScore) {
    return { destination: "direct", reason: "score_threshold" };
  }
  return { destination: "draft", reason: "below_threshold" };
}

export function assertAutoPublishMinScoreValid(
  minScore: number,
  autoPublishMinScore: number
): void {
  if (autoPublishMinScore < minScore) {
    throw new Error(
      `Seuil auto-publication (${autoPublishMinScore}) doit être >= score min pipeline (${minScore})`
    );
  }
}
