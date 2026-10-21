import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// backend/.env takes priority, then root .env.local as optional fallback
const backendEnv = path.resolve(__dirname, "../../.env");
const rootEnvLocal = path.resolve(__dirname, "../../../.env.local");

if (fs.existsSync(backendEnv)) {
  dotenv.config({ path: backendEnv });
}

if (fs.existsSync(rootEnvLocal)) {
  dotenv.config({ path: rootEnvLocal });
}
