import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

describe("product-phase", () => {
  const original = process.env.NEXT_PUBLIC_PRODUCT_PHASE;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_PRODUCT_PHASE;
    } else {
      process.env.NEXT_PUBLIC_PRODUCT_PHASE = original;
    }
  });

  it("défaut discovery quand env absent", async () => {
    delete process.env.NEXT_PUBLIC_PRODUCT_PHASE;
    const mod = await import("../src/lib/product-phase.ts");
    assert.equal(mod.getProductPhase(), "discovery");
    assert.equal(mod.isDiscoveryPhase(), true);
    assert.equal(mod.isCockpitEnabled(), false);
    assert.equal(mod.isCheckoutEnabled(), false);
    assert.equal(mod.isMapDefaultUnlocked(), true);
  });

  it("full active cockpit et checkout", async () => {
    process.env.NEXT_PUBLIC_PRODUCT_PHASE = "full";
    const mod = await import("../src/lib/product-phase.ts");
    assert.equal(mod.getProductPhase(), "full");
    assert.equal(mod.isDiscoveryPhase(), false);
    assert.equal(mod.isCockpitEnabled(), true);
    assert.equal(mod.isCheckoutEnabled(), true);
    assert.equal(mod.isMapDefaultUnlocked(), false);
  });

  it("admin bypass cockpit en discovery", async () => {
    process.env.NEXT_PUBLIC_PRODUCT_PHASE = "discovery";
    const mod = await import("../src/lib/product-phase.ts");
    assert.equal(mod.isCockpitEnabled(true), true);
  });

  it("resolveOpportunityAccessTier élève free → builder en discovery", async () => {
    process.env.NEXT_PUBLIC_PRODUCT_PHASE = "discovery";
    const mod = await import("../src/lib/product-phase.ts");
    assert.equal(mod.resolveOpportunityAccessTier("free"), "builder");
    assert.equal(mod.resolveOpportunityAccessTier("builder"), "builder");
    assert.equal(mod.resolveOpportunityAccessTier("pro"), "pro");
  });

  it("hasDetailSectionAccess garde prompt gated en discovery", async () => {
    process.env.NEXT_PUBLIC_PRODUCT_PHASE = "discovery";
    const mod = await import("../src/lib/product-phase.ts");
    assert.equal(mod.hasDetailSectionAccess("free", "builder", "foreign"), true);
    assert.equal(mod.hasDetailSectionAccess("free", "builder", "prompt"), false);
    assert.equal(mod.hasDetailSectionAccess("free", "pro", "guide"), false);
  });

  it("resolveOpportunityAccessTier inchangé en full", async () => {
    process.env.NEXT_PUBLIC_PRODUCT_PHASE = "full";
    const mod = await import("../src/lib/product-phase.ts");
    assert.equal(mod.resolveOpportunityAccessTier("free"), "free");
    assert.equal(mod.resolveOpportunityAccessTier("pro"), "pro");
  });
});
