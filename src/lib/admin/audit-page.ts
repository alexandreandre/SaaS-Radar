import "server-only";

import { listAuditLogs } from "@/lib/admin/audit";

export async function getAdminAuditLogs(params?: {
  limit?: number;
  offset?: number;
  targetId?: string | null;
}) {
  return listAuditLogs(params);
}
