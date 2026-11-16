# Markdown 渲染规则（Copilot 对话流）

组件：`<Markdown>{字符串}</Markdown>`（`packages/react/src/markdown/`）。基于 `react-markdown` + `remark-gfm`，另有一个内置插件把 GFM Alert 转成 Callout。需引入 `tokens.css`、`remixicon.css`、`@wiz/react/dist/style.css`。样式只用 `--wiz-*` 变量，亮暗随 `data-theme`。

## 1. 元素 → 样式映射

正文 13px（Body 2）、行高 20、字色 `--wiz-agent-text`；块级元素下边距 8（`--wiz-spacing-sm`），最后一个子元素下边距 0。

| Markdown | 输出 | 规则 |
|---|---|---|
| `#`–`######` | h1–h6（`.wiz-md-heading`） | **六级同一样式**：14px、Semi Bold 600、行高 20、下边距 8、`--wiz-agent-text`；只保留语义标签 |
| 段落 | p | 13/20，下边距 8 |
| `**x**` | strong | 600，`--wiz-agent-text` |
| `*x*` | em | 斜体，颜色继承 |
| `~~x~~` | del | 删除线，`--wiz-agent-muted` |
| `` `x` `` | code（行内） | 等宽 13，字色 `--wiz-agent-brand`，底色 `--wiz-grey-30`，圆角 4，内边距 2×4，左右外边距 2，行高 1（不撑高所在行） |
| `[x](url)` | a | 字色 `--wiz-agent-brand`，无下划线；Hover 下划线；Focus（键盘）1px 品牌色描边、圆角 4、外扩 2；Visited 字色 `--wiz-agent-muted`。`http(s)` 链接 `target=_blank` + `rel="noopener noreferrer"` |
| `-` / `1.` | ul / ol | 左缩进 20、项间距 4、嵌套列表上边距 4，标记用浏览器原生 |
| `- [ ]` / `- [x]` | 任务项 | 14×14 方框、圆角 4、间距 8；未勾：`--wiz-grey-60` 描边 + `--wiz-agent-surface` 底；已勾：`--wiz-agent-brand` 底 + 白色 `ri-check-line`（10px），文字变 `--wiz-agent-muted`（不加删除线）；只读 |
| `>` | blockquote | 左侧 2px `--wiz-agent-border` 竖线，竖线与文字间距 12，文字 `--wiz-agent-muted`；嵌套引用各自带竖线；独立组件可传 `attribution`（12px，`--wiz-grey-70`） |
| `---` | hr | 1px `--wiz-agent-border`，上下外边距 12 |
| `> [!NOTE]` 等 | Callout | 见第 2 节 |
| 表格 | 见第 3 节 | |
| 围栏代码 | 见第 4 节 | |
| `![alt](src "图注")` | Image | 见第 5 节 |
| `[^1]` 与 `[^1]: 说明` | Citation + 脚注区 | Citation：12px、`--wiz-agent-brand`，底 `--wiz-grey-20`，圆角 4，内边距 0×4；Hover 底 `--wiz-agent-brand-bg`；Focus 1px 品牌色描边。脚注区：每条「序号（品牌色）+ 说明（`--wiz-agent-muted`）」，12/18，间距 8，条间距 4；回链不显示 |

## 2. Callout（GFM Alert）

写法：引用块首行为 `[!NOTE]`、`[!TIP]`、`[!WARNING]`、`[!CAUTION]`（不区分大小写），标记行不显示。其他 `[!XXX]` 按普通引用处理。

结构：1px `--wiz-agent-border` 外框、**无圆角**；左侧 3px 色条压在外框上；内边距 8×12；头部「14px 图标 + 标题」间距 6，标题 13px Semi Bold；正文 13/20，头部与正文间距 4。

| 类型 | 底色 | 色条与图标 | 标题色 | 图标 |
|---|---|---|---|---|
| Note | `--wiz-agent-canvas` | `--wiz-agent-muted` | `--wiz-agent-text` | `ri-information-line` |
| Tip | `--wiz-agent-success-bg` | `--wiz-agent-success` | `--wiz-agent-success` | `ri-check-line` |
| Warning | `--wiz-agent-approval-bg` | `--wiz-main-warning` | `--wiz-agent-text` | `ri-alert-line` |
| Caution | `--wiz-agent-error-bg` | `--wiz-agent-error` | `--wiz-agent-error` | `ri-close-circle-line` |

## 3. 表格

- 外层容器横向滚动（`overflow-x: auto`），1px `--wiz-agent-border`、圆角 8、底色 `--wiz-agent-surface`。
- 表头：底色 `--wiz-grey-20`，13px Semi Bold，不换行；单元格 13/20，内边距 12；行间 1px `--wiz-agent-border` 分隔。
- 对齐跟随 Markdown 冒号语法（左/中/右）。数字使用等宽数字（`tabular-nums`）。

## 4. Code Block

- 外框：1px `--wiz-agent-border`、圆角 8、底色 `--wiz-grey-20`。
- 头部（可用 `showHeader={false}` 隐藏）：内边距 12，左侧语言名（12px，`--wiz-agent-muted`），右侧 Copy 按钮（`ri-file-copy-line` 16px + 文字 Copy）。语言名映射：sas→SAS、ts→TypeScript、json→JSON 等；未写语言显示 Code，未登记的语言显示大写原名。
- Copy 两态：Default 为「复制图标 + Copy」；点击后写入剪贴板，切到 Copied（`ri-checkbox-circle-line`，图标色 `--wiz-agent-success`，文字 Copied）1.5 秒后恢复。剪贴板不可用时仍显示 Copied。
- 代码区：内边距 12，`--wiz-text-code-*`（Roboto Mono 13，行高 20），字色 `--wiz-agent-text`，不换行、横向滚动。
- 语法色（仅 `sas`）：

| 类别 | 匹配 | Token |
|---|---|---|
| keyword | proc、proc sql、data、run、quit、select、from、where、create table、left join、group by、on、and、not、options、as、in、titleN、footnoteN | `--wiz-agent-syntax-keyword` |
| string | 单、双引号字符串 | `--wiz-agent-syntax-string` |
| comment | `/* … */`（斜体） | `--wiz-agent-syntax-comment` |
| number | 整数 | `--wiz-agent-syntax-number` |
| function | 宏调用 `%name` | `--wiz-agent-syntax-function` |
| variable | 参数名 inds、inda、cols、col_labels、freeze_cols、page_cols、page_num、orientation、out_rtf | `--wiz-agent-syntax-variable` |

  其他语言一律纯等宽文本，不染色。

## 5. Image

- 图片：块级、不超过容器宽度、圆角 8、底色 `--wiz-grey-20`；图注取 Markdown 的 `title`（`![alt](src "图注")`），12px、`--wiz-agent-muted`、居中，与图间距 8。
- 加载中：高 160 灰底占位（24px `ri-image-line` + 「Loading image…」12px），图片加载完成后替换。
- 失败（或 src 被安全规则清空）：同尺寸占位，文字「Image could not be loaded」。

## 6. 滚动条（表格容器、代码区）

宽/高 6px，全圆角（`--wiz-radius-full`），轨道透明；滑块 `--wiz-agent-scrollbar-thumb`，悬停 `--wiz-agent-scrollbar-thumb-hover`。Firefox 回退为 `scrollbar-width: thin` + 同色滑块。

## 7. HTML 与链接安全

- **不渲染原始 HTML**：不接 `rehype-raw`；Markdown 中的 `<script>`、`<iframe>`、`<img onerror>`、`<b>` 等一律不会变成 DOM 元素，以纯文本显示。不得为 `<Markdown>` 增加 `rehype-raw`、`dangerouslySetInnerHTML` 等绕过方式。
- 链接和图片地址使用 `react-markdown` 默认地址过滤：只放行 `http`、`https`、`mailto` 等安全协议与相对路径，`javascript:`、`data:` 等被清空。
- 外部链接统一 `target="_blank"` + `rel="noopener noreferrer"`。

## 8. 给前端

- `<Markdown>` 的输入必须是字符串；流式输出时每次传完整累计文本，不要分段拼多个 `<Markdown>`。
- 组件自身没有外边距与宽度，放进对话气泡后由气泡决定宽度；表格与代码块在窄宽度下自行横向滚动。
- 独立元素组件可单独用于非 Markdown 场景：`MarkdownHeading`、`MarkdownLink`、`MarkdownInlineCode`、`MarkdownCallout`、`MarkdownBlockquote`、`MarkdownDivider`、`MarkdownTaskItem`、`MarkdownTable`、`MarkdownCodeBlock`、`MarkdownImage`、`MarkdownCitation`、`MarkdownFootnote`。块级独立组件自带正文排版；Link、Citation、Inline Code 继承所在文字。
- Link、Citation、Image、Code Block 的 `state` / `copyState` 属性只用于文档展示强制某一状态，业务不要传。
- 复制功能依赖浏览器 Clipboard API（需 HTTPS 或 localhost）。
