import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface CliConfig {
  apiKey?: string;
  baseUrl?: string;
}

export const CONFIG_DIR = join(homedir(), ".pptx");
export const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export function loadConfig(): CliConfig {
  if (!existsSync(CONFIG_FILE)) return {};
  try {
    const raw = readFileSync(CONFIG_FILE, "utf8");
    return JSON.parse(raw) as CliConfig;
  } catch {
    return {};
  }
}

export function saveConfig(config: CliConfig): void {
  mkdirSync(dirname(CONFIG_FILE), { recursive: true, mode: 0o700 });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export function clearConfig(): boolean {
  if (!existsSync(CONFIG_FILE)) return false;
  unlinkSync(CONFIG_FILE);
  return true;
}

/**
 * Resolve the effective API key. Precedence:
 *   1. explicit `--api-key` flag (passed in by caller)
 *   2. `PPTX_API_KEY` env var
 *   3. saved config file (written by `pptx login`)
 */
export function resolveApiKey(explicit?: string): string | undefined {
  if (explicit) return explicit;
  if (process.env.PPTX_API_KEY) return process.env.PPTX_API_KEY;
  const config = loadConfig();
  return config.apiKey;
}

/**
 * Resolve the effective API base URL. Precedence:
 *   1. explicit `--base-url` flag
 *   2. `PPTX_API_BASE_URL` env var
 *   3. saved config file
 *   4. https://api.pptx.dev (SDK default)
 */
export function resolveBaseUrl(explicit?: string): string | undefined {
  if (explicit) return explicit;
  if (process.env.PPTX_API_BASE_URL) return process.env.PPTX_API_BASE_URL;
  const config = loadConfig();
  return config.baseUrl;
}
