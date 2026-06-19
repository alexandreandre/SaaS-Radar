"use client";

export { PortfolioProvider } from "./portfolio/portfolio-provider";
export { usePortfolio, useOptionalPortfolio } from "./portfolio/use-portfolio-core";
export type { PortfolioContextValue, ConnectIntegrationOptions } from "./portfolio/portfolio-types";
export type { TargetScenario, ProjectPhase, UserProject } from "@/lib/portfolio";
