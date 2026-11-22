#!/usr/bin/env node
/* Regenerate plugins.json from plugins/<id>/.
 *
 * The catalog is derived, never hand-edited: every file under a plugin folder is
 * hashed here, so the sha256 a client verifies is always the bytes this repo
 * serves at that URL. `--check` recomputes and fails when the committed catalog
 * is stale, which is what CI runs on every pull request.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const PLUGINS = join(ROOT, "plugins");
const CATALOG = join(ROOT, "plugins.json");
const BASE = process.env.LUBAN_PLUGINS_BASE || "https://raw.githubusercontent.com/holylong/luban-plugins/main/";
const CHECK = process.argv.includes("--check");
const now = process.env.LUBAN_PLUGINS_NOW || new Date().toISOString();

const REQUIRED = ["id", "name", "version", "description"];

function walk(directory) {
  const out = [];
  for (const name of readdirSync(directory).sort()) {
    if (name === ".DS_Store") continue;
    const full = join(directory, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function fail(message) {
  console.error(`plugins.json: ${message}`);
  process.exit(1);
}

const ids = new Set();
const plugins = [];
for (const id of readdirSync(PLUGINS).sort()) {
  const directory = join(PLUGINS, id);
  if (!statSync(directory).isDirectory() || id.startsWith(".")) continue;
  let meta;
  try { meta = JSON.parse(readFileSync(join(directory, "plugin.json"), "utf8")); }
  catch (error) { fail(`${id}/plugin.json 读取失败：${error.message}`); }
  for (const field of REQUIRED) if (typeof meta[field] !== "string" || !meta[field].trim()) fail(`${id}/plugin.json 缺少 ${field}`);
  if (meta.id !== id) fail(`${id}/plugin.json 的 id 是 ${meta.id}，必须和目录名一致`);
  if (ids.has(meta.id)) fail(`id 重复：${meta.id}`);
  ids.add(meta.id);
  const files = walk(join(directory, "skills")).map(full => {
    const path = relative(directory, full).split(sep).join("/");
    const body = readFileSync(full);
    return { path, url: `${BASE}plugins/${id}/${path}`, sha256: createHash("sha256").update(body).digest("hex"), bytes: body.length };
  });
  if (!files.length) fail(`${id} 的 skills/ 下没有文件`);
  const skills = [...new Set(files.map(file => file.path.split("/")[1]))].sort();
  plugins.push({ ...meta, skills, files });
}

const catalog = { schemaVersion: 1, updatedAt: now, plugins };
const text = `${JSON.stringify(catalog, null, 2)}\n`;

if (CHECK) {
  let current;
  try { current = JSON.parse(readFileSync(CATALOG, "utf8")); }
  catch (error) { fail(`plugins.json 不存在或不是 JSON（${error.message}）；运行 node scripts/build-index.mjs`); }
  delete current.updatedAt;
  const generated = { ...catalog };
  delete generated.updatedAt;
  if (JSON.stringify(current) !== JSON.stringify(generated)) {
    fail("plugins.json 与 plugins/ 不一致，运行 node scripts/build-index.mjs 后提交");
  }
  console.log(`plugins.json 已是最新（${plugins.length} 个插件）`);
  process.exit(0);
}

writeFileSync(CATALOG, text);
console.log(`写入 plugins.json：${plugins.length} 个插件，${plugins.reduce((sum, plugin) => sum + plugin.files.length, 0)} 个文件`);
