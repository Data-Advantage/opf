import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Command } from "commander";
import { buildClient, CliError, type GlobalOptions } from "../client.js";
import { info, printJson, warn } from "../output.js";
import { readOpfFile } from "./validate.js";
import type { GenerateFormat } from "@pptx/sdk";

const SUPPORTED_FORMATS: GenerateFormat[] = ["pptx", "pdf", "png", "svg"];

/**
 * `pptx generate <input>` — primary entry point for creating a deck.
 *
 * `<input>` is either a path to an OPF JSON file (always supported, calls
 * /v1/generate) or a natural-language prompt. The prompt → OPF endpoint is
 * not wired up yet; when given a prompt we emit a clear "not yet available"
 * hint instead of silently failing, so the command surface is stable.
 */
export function generateCommand(): Command {
  return new Command("generate")
    .description("Generate a presentation from an OPF JSON file or a prompt")
    .argument("<input>", "Path to an OPF JSON file, or a natural-language prompt")
    .option(
      "-f, --format <format>",
      `Output format: ${SUPPORTED_FORMATS.join(" | ")}`,
      "pptx",
    )
    .option(
      "-o, --output <file>",
      "Write the generated OPF JSON to this file (for prompt mode)",
    )
    .action(
      async (
        input: string,
        opts: { format: string; output?: string },
        cmd: Command,
      ) => {
        const globals = (cmd.parent?.opts() ?? {}) as GlobalOptions;
        if (!SUPPORTED_FORMATS.includes(opts.format as GenerateFormat)) {
          throw new CliError(
            `Unsupported format "${opts.format}". Supported: ${SUPPORTED_FORMATS.join(", ")}.`,
            2,
          );
        }
        const client = buildClient(globals);

        if (looksLikeFile(input)) {
          const doc = readOpfFile(input);
          const response = await client.opf.generate(doc, {
            format: opts.format as GenerateFormat,
          });
          printJson(response);
          info(
            `generate accepted — format=${opts.format} slides=${response.slideCount}`,
          );
          if (opts.output) {
            writeFileSync(resolve(opts.output), `${JSON.stringify(doc, null, 2)}\n`);
            info(`copied source OPF → ${opts.output}`);
          }
          return;
        }

        warn(
          "prompt-based generation is not yet available — pass an OPF JSON file instead.",
        );
        info(
          "scaffold one with `pptx add deck -o deck.opf.json`, edit it, then run " +
            "`pptx generate deck.opf.json`.",
        );
        throw new CliError("prompt generation not supported yet", 3);
      },
    );
}

function looksLikeFile(input: string): boolean {
  if (/\s/.test(input)) return false;
  if (!/\.(opf\.)?json$/i.test(input)) {
    return existsSync(resolve(input));
  }
  return true;
}
