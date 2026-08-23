import { copyFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const outputDirectory = resolve("dist");
const publicFiles = [
  "app-config.js",
  "icon.svg",
  "index.html",
  "manifest.webmanifest",
  "pricing.js",
];

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const file of publicFiles) {
  await copyFile(resolve(file), resolve(outputDirectory, file));
}

process.stdout.write(`Prepared ${publicFiles.length} public files in dist.\n`);
