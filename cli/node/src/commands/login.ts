import { Command } from "commander";
import { CONFIG_FILE, clearConfig, loadConfig, saveConfig } from "../config.js";
import { info, success } from "../output.js";
import { promptSecret } from "../prompt.js";
import { CliError } from "../client.js";

export function loginCommand(): Command {
  return new Command("login")
    .description("Save a pptx.dev API key to ~/.pptx/config.json (0600)")
    .option("--api-key <key>", "API key (skip interactive prompt)")
    .option("--base-url <url>", "Override the API base URL")
    .action(async (opts: { apiKey?: string; baseUrl?: string }) => {
      let key = opts.apiKey;
      if (!key) {
        key = (await promptSecret("pptx.dev API key: ")).trim();
      }
      if (!key) {
        throw new CliError("No API key provided.", 2);
      }
      const existing = loadConfig();
      const next = { ...existing, apiKey: key };
      if (opts.baseUrl) next.baseUrl = opts.baseUrl;
      saveConfig(next);
      success(`Saved credentials to ${CONFIG_FILE}`);
      info("Override with PPTX_API_KEY or --api-key at any time.");
    });
}

export function logoutCommand(): Command {
  return new Command("logout")
    .description("Remove saved pptx.dev credentials")
    .action(() => {
      const removed = clearConfig();
      if (removed) {
        success(`Removed ${CONFIG_FILE}`);
      } else {
        info("No stored credentials found.");
      }
    });
}
