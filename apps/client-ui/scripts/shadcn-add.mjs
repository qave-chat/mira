#!/usr/bin/env node
/**
 * Wraps `shadcn add` so generated files conform to the `.ui.tsx` convention.
 *
 * Steps:
 *  1. Snapshot existing files under src/ui/.
 *  2. Run `pnpm dlx shadcn@latest add <args>`.
 *  3. Rename every newly-created `<name>.tsx` → `<name>.ui.tsx`.
 *  4. Rewrite `@/ui/<name>` imports across src/ to point at the
 *     renamed `.ui` path, so cross-component imports resolve after renaming.
 */
import { spawnSync } from "node:child_process";
import { readdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const uiDir = join(appRoot, "src/ui");
const srcDir = join(appRoot, "src");

async function listFiles(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isFile()).map((e) => e.name);
  } catch {
    return [];
  }
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const before = new Set(await listFiles(uiDir));

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("usage: ui:add <component> [component...]");
  process.exit(1);
}

const result = spawnSync("pnpm", ["dlx", "shadcn@latest", "add", ...args], {
  cwd: appRoot,
  stdio: "inherit",
});
if (result.status !== 0) process.exit(result.status ?? 1);

const after = await listFiles(uiDir);
const added = after.filter((name) => !before.has(name));

for (const name of added) {
  if (!/\.tsx?$/.test(name) || /\.ui\.tsx?$/.test(name)) continue;
  const ext = name.endsWith(".tsx") ? ".tsx" : ".ts";
  const base = name.slice(0, -ext.length);
  await rename(join(uiDir, name), join(uiDir, `${base}.ui${ext}`));
}

const uiBases = new Set();
for (const name of await listFiles(uiDir)) {
  const m = name.match(/^(.+)\.ui\.tsx?$/);
  if (m) uiBases.add(m[1]);
}

const files = await walk(srcDir);
for (const file of files) {
  let text = await readFile(file, "utf8");
  let changed = false;
  for (const base of uiBases) {
    const re = new RegExp(`(from\\s+["'])@/ui/${base}(["'])`, "g");
    const next = text.replace(re, `$1@/ui/${base}.ui$2`);
    if (next !== text) {
      text = next;
      changed = true;
    }
  }
  if (changed) await writeFile(file, text);
}

if (added.length > 0) {
  console.log(
    `\nrenamed → ${added
      .filter((n) => /\.tsx?$/.test(n) && !/\.ui\.tsx?$/.test(n))
      .map((n) => {
        const ext = n.endsWith(".tsx") ? ".tsx" : ".ts";
        return `${n.slice(0, -ext.length)}.ui${ext}`;
      })
      .join(", ")}`,
  );
}
