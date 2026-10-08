import { google } from "googleapis";
import { getServerConfig } from "./server-config";

type ValueRange = {
  range?: string | null;
  values?: unknown[][] | null;
};

type BatchGetClient = {
  spreadsheets: {
    values: {
      batchGet: (request: {
        spreadsheetId: string;
        ranges: readonly string[];
        valueRenderOption: "UNFORMATTED_VALUE";
      }) => Promise<{ data: { valueRanges?: ValueRange[] | null } }>;
    };
  };
};

export function createGoogleSheetsClient(): BatchGetClient {
  const config = getServerConfig();
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: config.serviceAccountEmail,
      private_key: config.serviceAccountPrivateKey
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
  });

  const sheets = google.sheets({ version: "v4", auth });
  return { spreadsheets: { values: { batchGet: (request) => sheets.spreadsheets.values.batchGet({ ...request, ranges: [...request.ranges] }) } } };
}

export async function readSheetRanges(
  client: BatchGetClient,
  spreadsheetId: string,
  ranges: readonly string[]
): Promise<ValueRange[]> {
  if (!spreadsheetId.trim()) {
    throw new Error("Google Sheets spreadsheet ID is not configured");
  }

  if (ranges.length === 0 || ranges.some((range) => !range.trim())) {
    throw new Error("Google Sheets range is not configured");
  }

  const response = await client.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges,
    valueRenderOption: "UNFORMATTED_VALUE"
  });

  return response.data.valueRanges ?? [];
}
