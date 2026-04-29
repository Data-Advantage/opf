import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(packageRoot, "../..");

const destination = path.join(packageRoot, "dist", "spec");
const source = path.join(repoRoot, "spec");
const catalogDirs = [
  "audiences",
  "tones",
  "themes",
  "layouts",
  "charts",
  "narratives",
  "socials",
  "languages",
  "color-schemes",
  "font-schemes",
];

await fs.rm(destination, { recursive: true, force: true });
await fs.mkdir(destination, { recursive: true });

for (const file of await fs.readdir(source)) {
  if (file.endsWith(".schema.json")) {
    await fs.copyFile(path.join(source, file), path.join(destination, file));
  }
}

for (const dir of catalogDirs) {
  await fs.cp(path.join(source, dir), path.join(destination, dir), { recursive: true });
}
