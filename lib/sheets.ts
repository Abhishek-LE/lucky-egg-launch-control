import { google } from "googleapis";

// Server-side only. Never import this file from a client component.
function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY env vars"
    );
  }
  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetsClient() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;

export type SkuTaskRow = {
  rowNumber: number; // 1-indexed sheet row, needed for writes
  sku: string;
  product: string;
  market: string;
  task: string;
  team: string;
  status: string; // "Done" | "Working on it" | "Not started" | "N/A"
  critical: boolean;
  owner: string;
  dayOffset: number | null;
};

/** Reads the full SKU_Tasks tab. */
export async function getSkuTasks(): Promise<SkuTaskRow[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "SKU_Tasks!A2:I",
  });
  const rows = res.data.values || [];
  return rows.map((r, i) => ({
    rowNumber: i + 2, // header is row 1
    sku: r[0] || "",
    product: r[1] || "",
    market: r[2] || "",
    task: r[3] || "",
    team: r[4] || "",
    status: r[5] || "Not started",
    critical: r[6] === "true" || r[6] === "1" || r[6] === true || r[6] === "TRUE",
    owner: r[7] || "",
    dayOffset: r[8] ? Number(r[8]) : null,
  }));
}

/** Reads the People tab (name, team). */
export async function getPeople(): Promise<{ name: string; team: string }[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "People!A2:B",
  });
  const rows = res.data.values || [];
  return rows.map((r) => ({ name: r[0] || "", team: r[1] || "" }));
}

/**
 * Updates the Status cell (column F) for a single SKU_Tasks row.
 * rowNumber must come from a row previously read via getSkuTasks(),
 * so we know we're writing to the row the user actually saw.
 */
export async function updateTaskStatus(rowNumber: number, newStatus: string) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `SKU_Tasks!F${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [[newStatus]] },
  });
}
