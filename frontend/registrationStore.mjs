import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { YEAR_CONFIG } from "./src/registrationConfig.js";

const databasePath = resolve(process.env.DATABASE_PATH ?? "./data/frameverse.sqlite");
mkdirSync(dirname(databasePath), { recursive: true });

const database = new DatabaseSync(databasePath);
database.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");

function tableName(collection) {
  if (!Object.values(YEAR_CONFIG).some((year) => year.collection === collection)) {
    throw new Error("Unknown registration collection.");
  }
  return `"${collection}"`;
}

for (const year of Object.values(YEAR_CONFIG)) {
  database.exec(`CREATE TABLE IF NOT EXISTS ${tableName(year.collection)} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
}

export function saveRegistration(yearKey, payload) {
  const year = YEAR_CONFIG[yearKey];
  if (!year) return { saved: false, status: 422, message: "Choose a valid academic year." };

  const table = tableName(year.collection);
  const result = database.prepare(`INSERT INTO ${table} (payload) VALUES (?)`).run(JSON.stringify(payload));
  return {
    saved: true,
    id: Number(result.lastInsertRowid),
  };
}
