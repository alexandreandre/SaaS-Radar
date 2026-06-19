"use client";

import { createContext } from "react";
import type { PortfolioContextValue } from "./portfolio-types";

export const PortfolioContext = createContext<PortfolioContextValue | null>(null);
