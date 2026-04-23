import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const CLI_VERSION = readCliVersion();

function readCliVersion(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const pkgPath = findPackageJson(here);
    if (!pkgPath) return "0.0.0";
    const raw = readFileSync(pkgPath, "utf8");
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function findPackageJson(start: string): string | null {
  let dir = start;
  for (let depth = 0; depth < 6; depth += 1) {
    const candidate = join(dir, "package.json");
    try {
      readFileSync(candidate, "utf8");
      return candidate;
    } catch {
      /* fall through */
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}
