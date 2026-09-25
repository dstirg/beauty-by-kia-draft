import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync("index.html", "utf8");
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/giu)].map(match => match[1]).filter(script => script.trim());
if (!scripts.length) throw new Error("No inline client script was found.");
for (const [index, script] of scripts.entries()) new vm.Script(script, { filename: `index-inline-${index + 1}.js` });
if (!html.includes("app-config.js")) throw new Error("Production app configuration is not loaded.");
console.log(`Verified ${scripts.length} inline client script block(s).`);
