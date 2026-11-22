# luban-plugins

**luban 的插件目录:一个 JSON,一堆技能包,装好就能用。**

[简体中文](README.md) · [English](#english)

[luban](https://github.com/holylong/luban) 是跑在自己机器上的编码 agent。它的能力之一是**技能**:
一组 `SKILL.md` 放在 `~/.luban/skills/` 里,模型需要时用 `list_skills` / `read_skill` 自己读进来。
这个仓库就是技能的公共货架——一个静态 JSON 目录 + 每个插件的源码,桌面版状态栏的「插件」按钮直接读它。

装插件不会执行任何代码,只往你的 `~/.luban/skills/` 写 markdown;不想要了,点卸载就干净移除。

## 为什么值得装

写给模型的技能,解决的是「每次都要重新教一遍」的问题:

| 插件 | 装好后 | 技能 |
| --- | --- | --- |
| **中文提交信息** `commit-style-zh` | 提交信息写成「前缀 + 一句话 + 讲动机的正文」,附正反例和自检清单 | `commit-style-zh` |
| **SQL 与索引审阅** `sql-review` | 慢查询先看执行计划,认出隐式类型转换、前导通配符、复合索引列序,给出可验证的改写 | `sql-review` |
| **更新日志撰写** `changelog-writer` | 从 git 历史写更新日志:按用户可见变化归类、过滤重构噪音、破坏性变更写迁移 | `changelog-writer` |

（每个插件的 `SKILL.md` 都在 `plugins/<id>/skills/` 下,点开就能先读一遍再装。）

## 怎么用

| 入口 | 用法 |
| --- | --- |
| 桌面版 | 状态栏「插件」→ 搜索框输入即过滤 → 安装 / 更新 / 卸载(显示「可更新 x → y」) |
| 配置文件 | `~/.luban/config.json` 的 `plugins.registry` 指向任意 JSON 目录,可换内网镜像 |
| 环境变量 | `LUBAN_PLUGIN_REGISTRY=https://…/plugins.json` |

默认目录:`https://raw.githubusercontent.com/holylong/luban-plugins/main/plugins.json`

安装做了什么:按目录里的 `files[].url` 下载 → 校验 `sha256` 与字节数 → 写进临时目录 →
原子移动到 `~/.luban/skills/<skill>/` → 在 `~/.luban/plugins.json` 记账。
任何一步失败都不留半个技能,校验不符就拒绝落盘。

## 目录结构

```
plugins.json                     # 目录(脚本生成,不要手改)
plugins/<id>/plugin.json         # 插件元数据:名称、版本、描述、标签
plugins/<id>/skills/<skill>/...  # 真正被安装的文件
scripts/build-index.mjs          # 重新生成目录并重算全部 sha256
```

## 写一个插件

```bash
mkdir -p plugins/my-plugin/skills/my-skill
$EDITOR plugins/my-plugin/plugin.json          # id / name / version / description …
$EDITOR plugins/my-plugin/skills/my-skill/SKILL.md
node scripts/build-index.mjs                   # 生成 plugins.json(重算 sha256)
```

`plugin.json` 里 `id` 必须等于目录名,只用小写字母、数字、`.`、`_`、`-`;
文件必须放在 `skills/<skill>/…` 下,前缀剥掉后落到 `~/.luban/skills/`;
单文件上限 512KB、一个插件最多 64 个文件、目录最多 500 个插件。
升级就改 `version`,客户端会显示「可更新」。

CI 会跑 `node scripts/build-index.mjs --check`:目录里的 sha256 和文件内容对不上就拒绝合并——
否则客户端安装到一半会校验失败。

## 安全边界

- 插件只是 markdown 指令:不会带来新工具、不会执行代码、装完不会自己跑。
- 但技能内容会被模型当指令读,等于一份提示词。**装之前读一眼 `SKILL.md`**,尤其是来自他人 PR 的插件。
- 目录可自建:公司内网放自己的 `plugins.json`,把 `plugins.registry` 指过去即可,不必用默认目录。

## 许可

各插件在 `plugin.json` 里标注自己的 license,未标注的按 MIT 处理。

---

## English

**The plugin catalog for [luban](https://github.com/holylong/luban): one JSON file, a shelf of skill packs.**

A luban plugin is a *skill pack*: markdown files that land in `~/.luban/skills/` and that the agent loads
on demand through `list_skills` / `read_skill`. The desktop status bar reads this repo's `plugins.json`
directly, so installing is one click — a searchable list with install, update and uninstall.

Installing runs no code: it writes markdown, verifies every file's `sha256` and size, moves the result into
place atomically, and records what it owns in `~/.luban/plugins.json`. Uninstalling removes only what that
record lists, so hand-written skills are never touched.

```
plugins.json                     # catalog, generated — do not edit by hand
plugins/<id>/plugin.json         # metadata
plugins/<id>/skills/<skill>/...  # the files that get installed
scripts/build-index.mjs          # regenerates the catalog and every sha256
```

Add a plugin with `plugins/<id>/plugin.json` plus `plugins/<id>/skills/<skill>/SKILL.md`, then run
`node scripts/build-index.mjs`; CI rejects a catalog whose hashes no longer match the files.
Point `plugins.registry` (or `LUBAN_PLUGIN_REGISTRY`) at your own JSON to use a private mirror.

Skills are instructions the model reads, so review a `SKILL.md` before installing one from a stranger —
same care you would give any prompt.
