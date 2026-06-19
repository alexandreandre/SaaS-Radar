import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeSuggestions } from "@/lib/idea/clarify-utils";

describe("normalizeSuggestions", () => {
  it("converts string suggestions to structured options", () => {
    const result = normalizeSuggestions(["Abonnement mensuel", "Commission"], "single");
    assert.equal(result.length, 2);
    assert.equal(result[0]?.label, "Abonnement mensuel");
    assert.ok(result[0]?.id);
  });

  it("preserves structured suggestions with hints", () => {
    const result = normalizeSuggestions(
      [{ id: "b2b", label: "B2B", hint: "Entreprises et PME" }],
      "single",
    );
    assert.equal(result[0]?.hint, "Entreprises et PME");
  });

  it("returns empty array for open questions", () => {
    const result = normalizeSuggestions(["Option A"], "open");
    assert.deepEqual(result, []);
  });

  it("limits multi-select to five options", () => {
    const result = normalizeSuggestions(
      ["A", "B", "C", "D", "E", "F"].map((label) => ({ id: label, label })),
      "multi",
    );
    assert.equal(result.length, 5);
  });
});
