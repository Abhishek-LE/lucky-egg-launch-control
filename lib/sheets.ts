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

/** Converts MM/DD/YYYY → YYYY-MM-DD; passes through anything else. */
function normaliseDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  return raw;
}

/**
 * Reads the "Arrival Date by SKU" tab (read-only — do NOT write to this tab).
 * Returns a map keyed by "SKU:Region" → { launchDate, arrivalDate } in YYYY-MM-DD.
 */
export async function getLaunchDates(): Promise<
  Map<string, { launchDate: string | null; arrivalDate: string | null }>
> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Arrival Date by SKU'!A2:D",
  });
  const rows = res.data.values || [];
  const map = new Map<string, { launchDate: string | null; arrivalDate: string | null }>();
  for (const r of rows) {
    const sku = r[0]?.trim();
    const region = r[3]?.trim();
    if (!sku || !region) continue;
    const key = `${sku}:${region}`;
    if (map.has(key)) continue; // keep the first row per SKU+region
    map.set(key, {
      arrivalDate: normaliseDate(r[1]?.trim()),
      launchDate: r[2]?.trim() || null,
    });
  }
  return map;
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

/** Updates the Owner cell (column H) for a single SKU_Tasks row. */
export async function updateTaskOwner(rowNumber: number, owner: string) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `SKU_Tasks!H${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [[owner]] },
  });
}
