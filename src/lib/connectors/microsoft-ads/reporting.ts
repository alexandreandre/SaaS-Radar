import "server-only";

import { microsoftAdsRequest } from "@/lib/connectors/microsoft-ads/client";
import { MICROSOFT_ADS_API_VERSION, buildReportDateRange } from "@/lib/connectors/microsoft-ads/snapshots";
import type {
  MicrosoftAdsCredential,
  MicrosoftAdsPollReportResponse,
  MicrosoftAdsSubmitReportResponse,
} from "@/lib/connectors/microsoft-ads/types";

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 120_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildAccountPerformanceReportRequest(accountId: string, months = 12) {
  const range = buildReportDateRange(months);
  return {
    Type: "AccountPerformanceReportRequest",
    Format: "Csv",
    ReportName: `SaaSRadarMonthly_${Date.now()}`,
    Aggregation: "Monthly",
    Columns: [
      "AccountName",
      "TimePeriod",
      "Spend",
      "Impressions",
      "Clicks",
      "ConversionsQualified",
    ],
    Scope: {
      AccountIds: [accountId],
    },
    Time: {
      CustomDateRangeStart: {
        Day: range.startDay,
        Month: range.startMonth,
        Year: range.startYear,
      },
      CustomDateRangeEnd: {
        Day: range.endDay,
        Month: range.endMonth,
        Year: range.endYear,
      },
      ReportTimeZone: "GreenwichMeanTimeDublinEdinburghLisbonLondon",
    },
    ExcludeColumnHeaders: false,
    ExcludeReportFooter: true,
    ExcludeReportHeader: true,
  };
}

export async function submitAccountPerformanceReport(
  credential: MicrosoftAdsCredential,
  months = 12,
): Promise<string> {
  if (!credential.accountId || !credential.customerId) {
    throw new Error("Compte Microsoft Ads non sélectionné");
  }

  const response = await microsoftAdsRequest<MicrosoftAdsSubmitReportResponse>(
    credential,
    `/Reporting/${MICROSOFT_ADS_API_VERSION}/GenerateReport/Submit`,
    {
      service: "reporting",
      customerId: credential.customerId,
      accountId: credential.accountId,
      body: {
        ReportRequest: buildAccountPerformanceReportRequest(credential.accountId, months),
      },
    },
  );

  const reportRequestId = response.ReportRequestId?.trim();
  if (!reportRequestId) {
    throw new Error("Identifiant de rapport Microsoft Ads manquant");
  }

  return reportRequestId;
}

export async function pollReportDownloadUrl(
  credential: MicrosoftAdsCredential,
  reportRequestId: string,
): Promise<string> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    const response = await microsoftAdsRequest<MicrosoftAdsPollReportResponse>(
      credential,
      `/Reporting/${MICROSOFT_ADS_API_VERSION}/GenerateReport/Poll`,
      {
        service: "reporting",
        customerId: credential.customerId,
        accountId: credential.accountId,
        body: { ReportRequestId: reportRequestId },
      },
    );

    const status = response.ReportRequestStatus?.Status;
    if (status === "Success") {
      const url = response.ReportRequestStatus?.ReportDownloadUrl?.trim();
      if (!url) {
        throw new Error("URL de téléchargement Microsoft Ads manquante");
      }
      return url;
    }

    if (status && status !== "Pending") {
      throw new Error(`Génération du rapport Microsoft Ads échouée (${status})`);
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(
    "Délai dépassé lors de la génération du rapport Microsoft Ads. Réessayez dans quelques minutes.",
  );
}

export async function downloadReportCsv(downloadUrl: string): Promise<string> {
  const res = await fetch(downloadUrl);
  if (!res.ok) {
    throw new Error(`Téléchargement du rapport Microsoft Ads échoué (${res.status})`);
  }
  return res.text();
}

export async function fetchAccountPerformanceReportCsv(
  credential: MicrosoftAdsCredential,
  months = 12,
): Promise<string> {
  const reportRequestId = await submitAccountPerformanceReport(credential, months);
  const downloadUrl = await pollReportDownloadUrl(credential, reportRequestId);
  return downloadReportCsv(downloadUrl);
}
