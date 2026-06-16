export type AdminRole = "none" | "viewer" | "editor" | "owner";

export const ADMIN_ROLE_RANK: Record<AdminRole, number> = {
  none: 0,
  viewer: 1,
  editor: 2,
  owner: 3,
};

export function normalizeAdminRole(
  role: string | null | undefined,
  isAdmin?: boolean | null
): AdminRole {
  if (role === "viewer" || role === "editor" || role === "owner") return role;
  if (isAdmin) return "owner";
  return "none";
}

export function hasAdminAccess(role: AdminRole): boolean {
  return ADMIN_ROLE_RANK[role] >= ADMIN_ROLE_RANK.viewer;
}

export function canEditAdmin(role: AdminRole): boolean {
  return ADMIN_ROLE_RANK[role] >= ADMIN_ROLE_RANK.editor;
}

export function isAdminOwner(role: AdminRole): boolean {
  return role === "owner";
}

export function roleMeetsMinimum(role: AdminRole, minimum: AdminRole): boolean {
  return ADMIN_ROLE_RANK[role] >= ADMIN_ROLE_RANK[minimum];
}

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  none: "Aucun",
  viewer: "Lecture",
  editor: "Éditeur",
  owner: "Propriétaire",
};
