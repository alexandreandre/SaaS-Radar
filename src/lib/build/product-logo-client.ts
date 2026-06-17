"use client";

import type { ProductLogo, UserProject } from "@/lib/portfolio";
import { shouldUpdateProductLogo } from "@/lib/build/product-logo";

export function mergeDetectedProductLogo(
  project: UserProject,
  detected: ProductLogo | null | undefined,
): UserProject | null {
  if (!detected || !shouldUpdateProductLogo(project.productLogo, detected)) {
    return null;
  }
  return { ...project, productLogo: detected };
}

export async function detectProductLogoFromHost(productionUrl: string): Promise<ProductLogo | null> {
  const res = await fetch("/api/build/product-logo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productionUrl }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { productLogo?: ProductLogo | null };
  return data.productLogo ?? null;
}
