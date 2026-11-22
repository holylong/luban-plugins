<div align="center">

<img src="assets/luban.png" width="88" alt="luban" />

# luban-plugins

**给 [luban](https://github.com/holylong/luban) 的技能货架——一个 JSON 目录,点一下就装好。**

[![license](https://img.shields.io/badge/license-MIT-3da639?style=flat-square)](LICENSE)
[![plugins](https://img.shields.io/badge/plugins-5-2f81f7?style=flat-square)](plugins)
[![schema](https://img.shields.io/badge/schema-v1-8957e5?style=flat-square)](plugins.json)
[![luban](https://img.shields.io/badge/luban-2.9.5%2B-ff8c42?style=flat-square)](https://github.com/holylong/luban/releases)

[English](README.md) · [简体中文](README.zh-CN.md)

</div>

---

luban 的插件就是**技能包**:几个 `SKILL.md` 装进 `~/.luban/skills/`,模型在需要时用
`list_skills` / `read_skill` 自己读进来。没有二进制、没有钩子、没有常驻进程——只是一段在合适的时候被读到的指令。

桌面版直接读这个仓库的 `plugins.json`,所以状态栏的**「插件」**面板就是一个可搜索、可安装、可更新、可卸载的列表。

## 目录里的插件

| 插件 | 装好之后 | 版本 | 技能 |
| --- | --- | --- | --- |
| **[代码审阅](plugins/code-review)**<br><sub>`code-review`</sub> | 先读调用方,再按正确性 → 错误处理 → 并发 → 资源 → 可测试性过一遍;只报能复现的问题,每条给出具体改法。 | 1.0.0 | `code-review` |
| **[中文提交信息](plugins/commit-style-zh)**<br><sub>`commit-style-zh`</sub> | 提交信息写成「前缀 + 一句话 + 讲动机的正文」,附正反例和自检清单。 | 1.0.0 | `commit-style-zh` |
| **[SQL 与索引审阅](plugins/sql-review)**<br><sub>`sql-review`</sub> | 先解释执行计划再改写:认出隐式类型转换、前导通配符、复合索引列序,给出可验证的改写。 | 1.0.0 | `sql-review` |
| **[更新日志撰写](plugins/changelog-writer)**<br><sub>`changelog-writer`</sub> | 从 git 历史写更新日志:按用户可见变化归类,过滤重构噪音,破坏性变更写迁移说明。 | 1.0.0 | `changelog-writer` |
| **[CSV 预览与解读](plugins/csv-preview)**<br><sub>`csv-preview`</sub> | 先看字节再解析(分隔符、BOM、换行),按列查类型、缺失与异常值,给出可直接运行、只读不改的命令。 | 1.0.0 | `csv-preview` |

每个技能都是这个仓库里的纯 markdown,装之前可以先读 `plugins/<id>/skills/` 下的 `SKILL.md`。

## 怎么装

| 入口 | 用法 |
| --- | --- |
| **桌面版** | 状态栏 → **插件** → 输入即过滤 → **安装** / **更新** / **卸载** |
| **配置文件** | `~/.luban/config.json` → `"plugins": { "registry": "https://…/plugins.json" }` |
| **环境变量** | `LUBAN_PLUGIN_REGISTRY=https://…/plugins.json` |

默认目录:

```
https://raw.githubusercontent.com/holylong/luban-plugins/main/plugins.json
```

把 `plugins.registry` 指向自己的 JSON 就是私有镜像,需要的只是下面这套结构。

## 安装做了什么

```mermaid
flowchart LR
  A[plugins.json] -->|拉取| B[逐文件校验 sha256 与字节数]
  B -->|暂存| C[~/.luban/.luban-plugin-&lt;uuid&gt;/]
  C -->|原子移动| D[~/.luban/skills/&lt;skill&gt;/]
  D --> E[记入 ~/.luban/plugins.json]
  E --> F[list_skills 立刻可见]
```

1. 拉一次目录(应用内缓存,需要时刷新)。
2. 下载每个 `files[].url`,比对 `sha256` **和**字节数——不一致就在写盘之前中止。
3. 先写进 `~/.luban/` 里的临时目录,失败不会留下半个插件。
4. 把技能目录原子移动到位。
5. 在 `~/.luban/plugins.json` 里记账。卸载只删记账里的目录,手写的技能不受影响。

## 仓库结构

```
plugins.json                      # 目录——脚本生成,不要手改
plugins/<id>/plugin.json          # 名称、版本、描述、标签
plugins/<id>/skills/<skill>/…     # 真正会被安装的文件
scripts/build-index.mjs           # 重新生成目录并重算全部 sha256
assets/                           # 本 README 用的图标
```

## 发布一个插件

```bash
mkdir -p plugins/my-plugin/skills/my-skill
$EDITOR plugins/my-plugin/plugin.json                 # id / name / version / description / tags
$EDITOR plugins/my-plugin/skills/my-skill/SKILL.md    # 指令本身
node scripts/build-index.mjs                          # 重写 plugins.json,重算哈希
node scripts/build-index.mjs --check                  # CI 跑的检查:目录过期就失败
```

<details>
<summary><b>plugin.json 格式</b></summary>

```json
{
  "id": "my-plugin",
  "name": "我的插件",
  "version": "1.0.0",
  "description": "一句话说明用户能获得什么。",
  "author": "you",
  "license": "MIT",
  "homepage": "https://github.com/holylong/luban-plugins/tree/main/plugins/my-plugin",
  "tags": ["git", "docs"]
}
```

| 约定 | 说明 |
| --- | --- |
| `id` | 必须等于目录名:小写字母、数字、`.`、`_`、`-` |
| 文件位置 | 必须在 `skills/<skill>/…` 下,安装时剥掉这层前缀 |
| frontmatter | 每个 `SKILL.md` 需要 `name` 与 `description` |
| 大小 | 单文件 512 KB,一个插件最多 64 个文件 |
| 版本 | 改 `version`,客户端就显示「可更新」 |

</details>

## 安全边界

- 插件只是 markdown:不带来新工具、不执行代码、装完不会自己跑。
- 但技能内容**会被模型当指令读**,等于一份提示词。来自他人的 `SKILL.md`(尤其是 PR 里的)装之前先读一眼。
- 内部使用就自建目录:一个静态 `plugins.json` 加技能文件即可。

## 许可

目录与工具按 MIT;各插件在 `plugin.json` 里标注自己的 license(未标注按 MIT 处理)。

<div align="center"><sub>目录：<code>plugins.json</code> · 由 <a href="scripts/build-index.mjs">scripts/build-index.mjs</a> 生成</sub></div>
