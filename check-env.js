// Checks .env.local without ever printing secret values — safe to share the output.
const fs = require("fs");

const path = ".env.local";
if (!fs.existsSync(path)) {
  console.log("No .env.local found in this folder at all.");
  process.exit(1);
}

const raw = fs.readFileSync(path, "utf8");
const lines = raw.split(/\r?\n/);

const expected = [
  "GOOGLE_SHEETS_ID",
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

console.log(`Total lines in file: ${lines.length}`);
console.log("");

const found = {};
const orphanLines = [];

lines.forEach((line, i) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;

  const match = expected.find((key) => trimmed.startsWith(key + "="));
  if (match) {
    const value = trimmed.slice(match.length + 1);
    found[match] = value.length;
  } else {
    orphanLines.push(i + 1);
  }
});

expected.forEach((key) => {
  if (!(key in found)) {
    console.log(`❌ ${key} — MISSING (no line found)`);
  } else if (found[key] === 0) {
    console.log(`⚠️  ${key} — line exists but value is EMPTY`);
  } else {
    console.log(`✅ ${key} — present, ${found[key]} characters`);
  }
});

console.log("");
if (orphanLines.length > 0) {
  console.log(
    `⚠️  ${orphanLines.length} line(s) don't belong to any expected variable: lines ${orphanLines.join(", ")}`
  );
  console.log(
    "   This usually means a value (almost always the private key) broke across multiple real lines instead of staying on one line."
  );
} else {
  console.log("✅ No stray lines — file structure looks clean.");
}
