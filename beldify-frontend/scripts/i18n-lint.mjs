#!/usr/bin/env node
/**
 * i18n leak detector.
 *
 * Greps src/ for JSX text nodes that look like English copy NOT wrapped in t().
 * Usage:
 *   node scripts/i18n-lint.mjs                       # full src/
 *   node scripts/i18n-lint.mjs src/components/layout # scoped
 *   node scripts/i18n-lint.mjs --json                # machine-readable
 *
 * Reports {file, line, snippet} per candidate. Conservative: only flags
 * sentence-ish strings (>= 3 chars, starts uppercase, has a vowel). Tune
 * the SENTENCE regex if it gets noisy in a given cluster.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const args = process.argv.slice(2);
const jsonOut = args.includes("--json");
const scopes = args.filter((a) => !a.startsWith("--"));
const targets = scopes.length ? scopes.map((s) => path.resolve(ROOT, s)) : [path.join(ROOT, "src")];

const TEXT_NODE = />\s*([^<>{}\n][^<>{}\n]{2,})\s*</g;
const ATTR_TEXT = /\b(?:placeholder|title|aria-label|alt)\s*=\s*"([^"]{3,})"/g;
const SENTENCE = /^[A-Z][\w\s,.!?'"&:;/-]+$/;
const HAS_VOWEL = /[aeiouAEIOU]/;
const IGNORE_FILES = /\/(node_modules|\.next|locales|test-utils|__tests__|i18n)\//;
const STOPWORDS = new Set(["TODO", "FIXME", "API", "URL", "JSON", "HTML", "CSS", "RTL", "LTR", "MAD", "USD", "EUR"]);
// TS generic type names that match >X< pattern but are types, not JSX text
const TS_TYPE_WORDS = new Set(["Promise", "Array", "Map", "Set", "Record", "Partial", "Readonly", "Required", "Pick", "Omit", "ReturnType", "Awaited", "Observable", "Subject", "BehaviorSubject", "Ref", "MutableRefObject", "ChangeEvent", "FormEvent", "MouseEvent", "KeyboardEvent", "FocusEvent", "TouchEvent", "DragEvent", "ClipboardEvent", "WheelEvent", "AnimationEvent", "TransitionEvent", "UIEvent", "SyntheticEvent", "Component", "FC", "PropsWithChildren", "ReactNode", "ReactElement", "JSXElementConstructor", "ComponentType", "Dispatch", "SetStateAction", "Action", "Reducer", "Store", "State", "Props"]);

async function walk(dir, out = []) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (IGNORE_FILES.test(full)) continue;
    if (ent.isDirectory()) await walk(full, out);
    else if (/\.(tsx?|jsx?)$/.test(ent.name)) out.push(full);
  }
  return out;
}

function looksLikeCopy(s, file) {
  const trimmed = s.trim();
  if (trimmed.length < 3) return false;
  if (STOPWORDS.has(trimmed)) return false;
  if (!SENTENCE.test(trimmed)) return false;
  if (!HAS_VOWEL.test(trimmed)) return false;
  if (/^\{.*\}$/.test(trimmed)) return false;
  // Filter TS generic types unconditionally — false positives from `=> Promise<void>` etc
  if (TS_TYPE_WORDS.has(trimmed.split(/\s+/)[0])) return false;
  return true;
}

function scanFile(file, src) {
  const findings = [];
  const lines = src.split("\n");
  const tCalls = new Set();

  lines.forEach((line, idx) => {
    if (/\bt\(/.test(line)) tCalls.add(idx + 1);
  });

  for (const re of [TEXT_NODE, ATTR_TEXT]) {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(src)) !== null) {
      const snippet = m[1];
      if (!looksLikeCopy(snippet, file)) continue;
      const pre = src.slice(0, m.index);
      const lineNum = pre.split("\n").length;
      if (tCalls.has(lineNum)) continue;
      findings.push({ file: path.relative(ROOT, file), line: lineNum, snippet: snippet.trim() });
    }
  }
  return findings;
}

const allFiles = (await Promise.all(targets.map((t) => walk(t)))).flat();
const all = [];
for (const f of allFiles) {
  const src = await fs.readFile(f, "utf8");
  all.push(...scanFile(f, src));
}

if (jsonOut) {
  console.log(JSON.stringify(all, null, 2));
} else {
  const byFile = new Map();
  for (const f of all) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file).push(f);
  }
  const sorted = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length);
  console.log(`i18n-lint: ${all.length} candidates across ${byFile.size} files\n`);
  for (const [file, finds] of sorted) {
    console.log(`${file}  (${finds.length})`);
    for (const f of finds.slice(0, 5)) console.log(`  L${f.line}  "${f.snippet.slice(0, 70)}"`);
    if (finds.length > 5) console.log(`  ... +${finds.length - 5} more`);
    console.log("");
  }
}
