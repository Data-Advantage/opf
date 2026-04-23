#!/usr/bin/env node
import { Command } from "commander";
import { handleError } from "./output.js";
import { CLI_VERSION } from "./version.js";
import { loginCommand, logoutCommand } from "./commands/login.js";
import { validateCommand } from "./commands/validate.js";
import { parseCommand } from "./commands/parse.js";
import { renderCommand } from "./commands/render.js";
import { fmtCommand } from "./commands/fmt.js";
import { addCommand } from "./commands/add.js";
import { generateCommand } from "./commands/generate.js";

async function main(argv: string[]): Promise<void> {
  const program = new Command();
  program
    .name("pptx")
    .description("Official CLI for pptx.dev — generate, parse, validate, and render OPF presentations.")
    .version(CLI_VERSION)
    .option("--api-key <key>", "Override the API key for this call")
    .option("--base-url <url>", "Override the API base URL");

  program.addCommand(loginCommand());
  program.addCommand(logoutCommand());
  program.addCommand(generateCommand());
  program.addCommand(validateCommand());
  program.addCommand(parseCommand());
  program.addCommand(renderCommand());
  program.addCommand(fmtCommand());
  program.addCommand(addCommand());

  program.showHelpAfterError();
  program.showSuggestionAfterError();

  await program.parseAsync(argv);
}

main(process.argv).catch(handleError);
