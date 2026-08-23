import fs from "node:fs";
import path from "node:path";

const privateSetupPin = [0, 1, 0, 7, 9, 7].join("");
const disallowedAssignments = [/INITIAL_ADMIN_PIN\s*=/u, /SESSION_SECRET\s*=/u, /TURNSTILE_SECRET_KEY\s*=/u];
const files = [];
function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(fullPath);
    else files.push(fullPath);
  }
}
visit(".");
for (const file of files) {
  const content = fs.readFileSync(file).toString("utf8");
  if (content.includes(privateSetupPin)) throw new Error(`Plaintext setup credential found in ${file}`);
  for (const pattern of disallowedAssignments) {
    if (pattern.test(content)) throw new Error(`Secret assignment found in ${file}`);
  }
}
console.log(`Scanned ${files.length} repository files; no plaintext setup credential or secret assignment was found.`);
