import { writeFileSync } from "fs";
import { join } from "path";
import { getAllCountryCodes } from "../src/lib/country-code";
import { opportunities } from "../src/data/opportunities";
import { generateMarket } from "../src/lib/generate-market";
import { HAND_CRAFTED } from "../src/data/world-markets-handcrafted";
import type { WorldMarket } from "../src/types/world-market";

function slugsByCountry(code: string): string[] {
  return opportunities.filter((o) => o.originCountryCode === code).map((o) => o.slug);
}

function buildAllMarkets(): WorldMarket[] {
  const codes = getAllCountryCodes();
  return codes.map((code) => {
    const hand = HAND_CRAFTED[code];
    const generated = generateMarket(code, hand);
    if (!generated.opportunitySlugs.length) {
      generated.opportunitySlugs = slugsByCountry(code);
    }
    return generated;
  });
}

const markets = buildAllMarkets();
const outPath = join(process.cwd(), "src/data/world-markets.generated.json");
writeFileSync(outPath, JSON.stringify(markets));
console.log(`Wrote ${markets.length} markets to ${outPath}`);
