# ISP Design System（Wiz）· Agent 指南

做 UI 前先读本文件和 `COMPONENTS.md`。

## 阅读顺序

1. `COMPONENTS.md`：组件目录（用途与状态），用来找组件，一次读完约 2.5k token。
2. 目标组件的 `src/<Name>/<Name>.tsx`：确认 Props 与行为；同目录 `.css` 看样式钩子，`.test.tsx` 看用法。
3. `packages/tokens/dist/tokens.css`：用到颜色、字体、间距、圆角、阴影时查变量名。
4. `docs/copilot.md`、`docs/markdown.md`、`docs/prompt-input.md`：做 Copilot、Markdown、PromptInput 时读。
5. `docs/batch-*-review.md`、`apps/isp-demo/docs/*-review.md`：查某组件或页面的设计取舍与已知偏差。
6. `../ISP-流程与状态规则.md` 第 7 章：涉及产品规则或未确认状态时读，不能把示例默认值当需求。

## 目录

| 路径 | 内容 |
|---|---|
| `packages/tokens` | W3C Token JSON（`src/primitive`、`semantic`、`agent`）与构建产物 `dist/tokens.{css,js,json,d.ts}` |
| `packages/react` | `@wiz/react`：通用组件（Button、Table、Tabs、Modal、Copilot 相关等） |
| `packages/isp` | `@wiz/isp`：ISP 独有组件（流水线、Inputs 卡、Workflow 气泡等）。依赖 `@wiz/react`，反向不允许 |
| `apps/isp-demo` | 用组件库搭的 ISP 页面（Vite + React） |
| `apps/docs` | 组件预览页 |
| `figma-map` | Figma 变量与 ISP 旧变量到 `--wiz-*` 的映射；`components-figma.json` 是组件到 Figma 节点的映射，只在把页面写回 Figma 或对稿时读，日常写前端不要读 |

## 事实来源

| 主题 | 来源 |
|---|---|
| 组件 Props 与行为 | `packages/react/src/<Name>/`、`packages/isp/src/<Name>/`；公共入口 `src/index.ts` |
| Token 取值 | `packages/tokens/src/**/*.json`（源）与 `dist/tokens.css`（运行时）。改 JSON 后运行 `npm run tokens` 重新生成并校验 |
| Figma 对照 | `figma-map/`；Wiz Agent 文件与 Wiz-Guideline 主库 |

## 规则

- Token 前缀是 `--wiz-*`：`--wiz-color-*`、`--wiz-spacing-*`、`--wiz-radius-*`、`--wiz-shadow-*`、`--wiz-text-*`、`--wiz-font-*`，色阶为 `--wiz-brand-*`、`--wiz-blue-*` 等。文本样式用 `.wiz-text-*` 类。不写色值、字号、圆角字面量；边界测试会检查。
- 暗色：根节点加 `[data-theme='dark']`，组件不单独写暗色。
- 先用已导出的组件；没有再在同一套 Token 上新建，并说明现有组件为什么不合适。ISP 独有的放 `packages/isp`，通用的放 `packages/react`。
- 样式覆盖用组件暴露的 className 与 CSS 变量钩子，不要靠调用方覆盖组件内部形状。
- 图标：Remix（`ri-*-line` 为默认），纯图标按钮必须有 `aria-label`；业务/法规类操作的图标必须带文本标签。
- Copilot 相关组件只是 UI 原语，AI 服务、持久化、权限、状态流转由应用提供。Markdown 用 `Markdown` 组件渲染（根类 `.wiz-md`），由应用提供内容并消毒，不注入原始 HTML。
- 命名：组件与文案里的英文术语、状态名保持原样。

## 交付前

在 `design-system/` 根目录运行 `npm run build`、`npm run typecheck`、`npm run test`；改了 Token JSON 先运行 `npm run tokens`。再到目标页面检查键盘、焦点、加载、错误、禁用和窄屏。不要声称与服务端已集成。
