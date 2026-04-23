import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Command } from "commander";
import { buildClient, CliError, type GlobalOptions } from "../client.js";
import { info, printJson } from "../output.js";
import { readOpfFile } from "./validate.js";
import type { GenerateFormat } from "@pptx/sdk";

const SUPPORTED_FORMATS: GenerateFormat[] = ["pptx", "pdf", "png", "svg"];

export function renderCommand(): Command {
  return new Command("render")
    .description("Render an OPF JSON document to a target format")
    .argument("<file>", "Path to an OPF JSON file")
    .requiredOption(
      "-f, --format <format>",
      `Output format: ${SUPPORTED_FORMATS.join(" | ")}`,
    )
    .option(
      "-o, --out <file>",
      "Write API response JSON to this file instead of stdout",
    )
    .action(async (file: string, opts: { format: string; out?: string }, cmd: Command) => {
      const globals = (cmd.parent?.opts() ?? {}) as GlobalOptions;
      if (!SUPPORTED_FORMATS.includes(opts.format as GenerateFormat)) {
        throw new CliError(
          `Unsupported format "${opts.format}". Supported: ${SUPPORTED_FORMATS.join(", ")}.`,
          2,
        );
      }
      const client = buildClient(globals);
      const doc = readOpfFile(file);
      const response = await client.opf.generate(doc, {
        format: opts.format as GenerateFormat,
      });
      const text = `${JSON.stringify(response, null, 2)}\n`;
      if (opts.out) {
        writeFileSync(resolve(opts.out), text);
      } else {
        printJson(response);
      }
      const suggested =
        typeof response.filename === "string" && response.filename.length > 0
          ? response.filename
          : null;
      info(
        `render accepted — format=${opts.format} slides=${response.slideCount}` +
          (suggested ? ` suggested_file=${suggested}` : ""),
      );
    });
}
