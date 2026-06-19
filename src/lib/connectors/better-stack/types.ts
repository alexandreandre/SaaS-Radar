export type BetterStackCredential = {
  apiToken: string;
  monitorId: string;
  monitorName: string;
  monitorUrl: string | null;
  teamName: string | null;
};

export type BetterStackMonitorSummary = {
  id: string;
  name: string;
  url: string | null;
  status: string;
  teamName: string | null;
  lastCheckedAt: string | null;
};

export type BetterStackMonitorSla = {
  availability: number;
  totalDowntime: number;
  numberOfIncidents: number;
  longestIncident: number;
  averageIncident: number;
};

export type BetterStackUptimeMetrics = {
  monitorId: string;
  monitorName: string;
  monitorUrl: string | null;
  monitorStatus: string;
  lastCheckedAt: string | null;
  sla: BetterStackMonitorSla | null;
  openIncidents: number;
  avgResponseTimeMs: number | null;
};

export type BetterStackMonitorAttributes = {
  url?: string | null;
  pronounceable_name?: string | null;
  status?: string | null;
  team_name?: string | null;
  last_checked_at?: string | null;
};

export type BetterStackMonitorResource = {
  id: string;
  type: string;
  attributes: BetterStackMonitorAttributes;
};

export type BetterStackMonitorsListResponse = {
  data: BetterStackMonitorResource[];
  pagination?: {
    next?: string | null;
  };
};

export type BetterStackMonitorResponse = {
  data: BetterStackMonitorResource;
};

export type BetterStackSlaAttributes = {
  availability?: number;
  total_downtime?: number;
  number_of_incidents?: number;
  longest_incident?: number;
  average_incident?: number;
};

export type BetterStackSlaResponse = {
  data: {
    id: string;
    type: string;
    attributes: BetterStackSlaAttributes;
  };
};

export type BetterStackIncidentResource = {
  id: string;
  type: string;
};

export type BetterStackIncidentsListResponse = {
  data: BetterStackIncidentResource[];
  pagination?: {
    next?: string | null;
  };
};

export type BetterStackResponseTimeEntry = {
  response_time?: number;
};

export type BetterStackResponseTimesAttributes = {
  regions?: Array<{
    region?: string;
    response_times?: BetterStackResponseTimeEntry[];
  }>;
};

export type BetterStackResponseTimesResponse = {
  data: {
    id: string;
    type: string;
    attributes: BetterStackResponseTimesAttributes;
  };
};
