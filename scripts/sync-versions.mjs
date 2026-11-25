import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const desktopRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");

const targets = [
  { label: "desktop", path: resolve(desktopRoot, "package.json") },
  { label: "web", path: resolve(desktopRoot, "../admt-web/web/package.json") },
  { label: "shared", path: resolve(desktopRoot, "../admt-shared/package.json") },
];

const source = JSON.parse(readFileSync(resolve(desktopRoot, "version.config.json"), "utf8"));
const version = source.version;

let failed = false;
for (const target of targets) {
  let current;
  try {
    current = JSON.parse(readFileSync(target.path, "utf8"));
  } catch (error) {
    console.error(`[version] 无法读取 ${target.label}: ${error.message}`);
    failed = true;
    continue;
  }
  if (current.version === version) {
    console.log(`[version] ${target.label}: ${version} OK`);
    continue;
  }
  if (checkOnly) {
    console.error(`[version] ${target.label}: ${current.version} != ${version}`);
    failed = true;
    continue;
  }
  current.version = version;
  writeFileSync(target.path, `${JSON.stringify(current, null, 2)}\n`, "utf8");
  console.log(`[version] ${target.label}: ${current.version} -> ${version}`);
}

if (failed) {
  process.exit(1);
}
