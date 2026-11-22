# luban-plugins

luban 桌面版的插件目录。一个插件就是**技能包**:
一组 `SKILL.md` 放进 `~/.luban/skills/`,luban 的 `list_skills` / `read_skill` 就能读到,
模型在需要时自己加载。装插件不会执行任何代码,只写入 markdown。

```
plugins.json                     # 目录(由脚本生成,不要手改)
plugins/<id>/plugin.json         # 插件元数据
plugins/<id>/skills/<skill>/...  # 真正被安装的文件
scripts/build-index.mjs          # 生成/校验 plugins.json
```

## 在 luban 里使用

| 入口 | 用法 |
| --- | --- |
| 桌面版 | 状态栏「插件」按钮 → 搜索 → 安装 / 卸载 |
| 配置文件 | `~/.luban/config.json` 里 `plugins.registry` 指向自建目录 |
| 环境变量 | `LUBAN_PLUGIN_REGISTRY=https://…/plugins.json` |

默认目录是
`https://raw.githubusercontent.com/holylong/luban-plugins/main/plugins.json`。

安装过程:按 `plugins.json` 里每个 `files[].url` 下载,校验 `sha256` 与大小,
先写临时目录再原子移动进 `~/.luban/skills/<skill>/`,
最后在 `~/.luban/plugins.json` 记账(哪个插件拥有哪些技能目录)。
卸载只删除记账里的目录,手写的技能不受影响。

## 插件格式

`plugins/<id>/plugin.json`:

```json
{
  "id": "commit-style-zh",
  "name": "中文提交信息",
  "version": "1.0.0",
  "description": "一句话说明用户能获得什么。",
  "author": "luban",
  "license": "MIT",
  "homepage": "https://github.com/holylong/luban-plugins/tree/main/plugins/commit-style-zh",
  "tags": ["git", "中文"]
}
```

约定:

- `id` 只用小写字母、数字、`.`、`_`、`-`,并且必须等于目录名
- 文件必须放在 `skills/<skill>/…` 下,`skills/` 前缀会剥掉后装进 `~/.luban/skills/`
- 每个技能一个目录,`SKILL.md` 用 `name` / `description` frontmatter
- 单个文件上限 512KB,一个插件最多 64 个文件
- 升级插件就改 `version`,客户端会显示「可更新」

## 提交一个插件

```bash
mkdir -p plugins/my-plugin/skills/my-skill
$EDITOR plugins/my-plugin/plugin.json
$EDITOR plugins/my-plugin/skills/my-skill/SKILL.md
node scripts/build-index.mjs     # 重新生成插件目录(含 sha256)
```

CI 会跑 `node scripts/build-index.mjs --check`:目录文件的 sha256 一旦和内容不一致,
客户端安装时就会校验失败,所以这道检查是必须过的。

## 许可

各插件在 `plugin.json` 里标注自己的 license;未标注的按 MIT 处理。
