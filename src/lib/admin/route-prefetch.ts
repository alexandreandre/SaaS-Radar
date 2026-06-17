import { prefetchAdminJson } from "@/lib/admin/client-fetch";

/** APIs GET préchargées par route admin (état initial des écrans). */
export const ADMIN_ROUTE_APIS: Record<string, string[]> = {
  "/admin": ["/api/admin/overview"],
  "/admin/sourcing": [
    "/api/admin/sourcing",
    "/api/admin/sourcing/policy",
    "/api/admin/markets",
    "/api/admin/sourcing/summary",
  ],
  "/admin/opportunities": [
    "/api/admin/opportunities/stats",
    "/api/admin/opportunities?status=published&sort=newest&limit=50&offset=0",
  ],
  "/admin/users": ["/api/admin/users/stats", "/api/admin/users?limit=50&offset=0"],
  "/admin/billing": ["/api/admin/billing"],
  "/admin/newsletter": ["/api/admin/newsletter"],
  "/admin/markets": ["/api/admin/markets"],
  "/admin/cockpit": ["/api/admin/cockpit"],
  "/admin/system": ["/api/admin/system", "/api/admin/sourcing/policy", "/api/admin/markets"],
  "/admin/audit": ["/api/admin/audit"],
  "/admin/security": [],
};

export const ADMIN_NAV_HREFS = Object.keys(ADMIN_ROUTE_APIS);

export function prefetchAdminRoute(href: string) {
  for (const url of ADMIN_ROUTE_APIS[href] ?? []) {
    prefetchAdminJson(url);
  }
}

export function prefetchAllAdminRoutes() {
  for (const href of ADMIN_NAV_HREFS) {
    prefetchAdminRoute(href);
  }
}
