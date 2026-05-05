import { readFile } from "node:fs/promises";

import {
  catalogEntries,
  schemaEntries,
  validatePresentation,
} from "@openpresentation/opf";

function usage(): never {
  console.error(`Usage:
  opf validate <file>
  opf catalogs
  opf schemas`);
  process.exit(2);
}

async function readJson(file: string): Promise<unknown> {
  return JSON.parse(await readFile(file, "utf8"));
}

async function main(argv: string[]): Promise<void> {
  const [command, ...args] = argv;

  if (command === "validate") {
    const [file] = args;
    if (!file) usage();

    const result = validatePresentation(await readJson(file));
    if (!result.valid) {
      console.error(JSON.stringify(result, null, 2));
      process.exit(1);
    }

    console.log(JSON.stringify({ valid: true }, null, 2));
    return;
  }

  if (command === "catalogs") {
    console.log(JSON.stringify(
      catalogEntries.map((entry) => ({ kind: entry.kind, count: entry.records.length })),
      null,
      2,
    ));
    return;
  }

  if (command === "schemas") {
    console.log(JSON.stringify(
      schemaEntries.map((entry) => ({ name: entry.name, file: entry.file, id: entry.schema.$id })),
      null,
      2,
    ));
    return;
  }

  usage();
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
