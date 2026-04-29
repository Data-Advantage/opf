import { readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { Command } from "commander";
import { buildClient, CliError, type GlobalOptions } from "../client.js";
import { info, printJson, success } from "../output.js";

export function parseCommand(): Command {
  return new Command("parse")
    .description("Parse a .pptx file into OPF JSON via the pptx.dev API")
    .argument("<file>", "Path to a .pptx file")
    .option("-o, --output <file>", "Write OPF JSON to this file (default: stdout)")
    .action(async (file: string, opts: { output?: string }, cmd: Command) => {
      const globals = (cmd.parent?.opts() ?? {}) as GlobalOptions;
      const client = buildClient(globals);

      const path = resolve(file);
      let data: Buffer;
      try {
        data = readFileSync(path);
      } catch (err) {
        throw new CliError(
          `Could not read ${file}: ${err instanceof Error ? err.message : String(err)}`,
          2,
        );
      }

      const opf = await client.convert.pptxToOpf({
        data: new Uint8Array(data),
        filename: basename(path),
      });

      if (opts.output) {
        writeFileSync(opts.output, `${JSON.stringify(opf, null, 2)}\n`);
        success(`Wrote OPF JSON → ${opts.output}`);
      } else {
        printJson(opf);
      }
      info(`parsed ${file}`);
    });
}
