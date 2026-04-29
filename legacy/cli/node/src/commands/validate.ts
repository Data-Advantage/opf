import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Command } from "commander";
import { buildClient, type GlobalOptions } from "../client.js";
import { info, printJson } from "../output.js";
import { CliError } from "../client.js";

export function validateCommand(): Command {
  return new Command("validate")
    .description("Validate an OPF JSON document against the canonical schema")
    .argument("<file>", "Path to an OPF JSON file")
    .option("--json", "Emit the raw API response as JSON on stdout")
    .action(async (file: string, opts: { json?: boolean }, cmd: Command) => {
      const globals = (cmd.parent?.opts() ?? {}) as GlobalOptions;
      const client = buildClient(globals);
      const doc = readOpfFile(file);
      const result = await client.opf.validate(doc);

      if (opts.json) {
        printJson(result);
      } else {
        if (result.valid) {
          info(`valid — ${file}`);
        } else {
          info(`invalid — ${file}`);
        }
        for (const issue of result.errors) {
          info(`  error  ${issue.path}: ${issue.message}`);
        }
        for (const issue of result.warnings) {
          info(`  warn   ${issue.path}: ${issue.message}`);
        }
      }
      if (!result.valid) {
        throw new CliError("Document failed validation", 1);
      }
    });
}

export function readOpfFile(file: string): Record<string, unknown> {
  const path = resolve(file);
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch (err) {
    throw new CliError(
      `Could not read ${file}: ${err instanceof Error ? err.message : String(err)}`,
      2,
    );
  }
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (err) {
    throw new CliError(
      `${file} is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      2,
    );
  }
}
