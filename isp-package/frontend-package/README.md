# ISP 设计系统 · 前端交付包

包含 Token（颜色、字体、间距、圆角、阴影）和 `@wiz/react` 基础组件。ISP 业务组件（流水线、Inputs 卡等）不在包内。

## 目录

| 路径 | 内容 | 用途 |
|---|---|---|
| `tokens/dist/tokens.css` | 260 个 `--wiz-*` CSS 变量，含暗色和 `.wiz-text-*` 文本类 | **直接引入使用** |
| `tokens/dist/tokens.json` / `tokens.js` / `tokens.d.ts` | 同一份数据的 JSON / JS / 类型版本 | JS 里取值时用 |
| `tokens/src/` | W3C DTCG 格式源文件（`primitive/` 原始值、`semantic/` 语义、`agent/` AI 相关） | 查层级关系，不直接引入 |
| `react/dist/` | 组件构建产物：`index.js`、`style.css`、类型声明 | **直接引入使用** |
| `react/src/<组件名>/` | 组件源码：`.tsx`（Props 与行为）、`.css`（样式） | 查 Props 和样式钩子 |
| `docs/COMPONENTS.md` | 组件清单（用途与状态） | 先从这里找组件 |
| `docs/` 其余 | Copilot、Markdown、PromptInput 专题规则 | 用到时读 |

`docs/` 里文档提到的 `packages/react/src/` 对应本包的 `react/src/`。

## 接入

依赖：`react` ≥ 18、`react-dom` ≥ 18、`react-markdown` ^9、`remark-gfm` ^4、`remixicon` ^4（图标）。

```ts
import 'remixicon/fonts/remixicon.css';
import './tokens/dist/tokens.css';
import '@wiz/react/dist/style.css'; // 即 react/dist/style.css

import { Button } from '@wiz/react';
```

三个样式文件的顺序不能变：Token 在前，组件样式在后。

## Token 规则

- 前缀统一 `--wiz-*`，样式里只用变量，不写色值、字号、圆角、阴影的字面量。
- 优先用语义层。原始色阶（`--wiz-grey-60`、`--wiz-brand-blue-70`）只在没有对应语义变量时使用。

| 类别 | 变量 | 取值 |
|---|---|---|
| 主色 | `--wiz-color-primary` / `-hover` / `-active` / `-soft` | brand-blue 70 / 60 / 90 / 10 |
| 文本 | `--wiz-color-text-primary` 等 | grey 90 起逐级变浅 |
| 边框 | `--wiz-color-border-subtle` / `-default` / `-strong` | grey 40 / 50 / 60 |
| 间距 | `--wiz-spacing-xs` / `xs-sm` / `sm` / `md` / `lg` / `xl` / `2xl` / `3xl` / `4xl` | 4 / 6 / 8 / 12 / 16 / 24 / 32 / 48 / 64 |
| 圆角 | `--wiz-radius-none` / `xs` / `sm` / `md` / `lg` / `xl` / `2xl` / `full` | 0 / 4 / 8 / 12 / 16 / 24 / 32 / 9999 |
| 阴影 | `--wiz-shadow-button` / `layer` / `overlay` / `popover` / `modal` / `ring-hairline` | 见 `tokens.css` |
| 字体 | `--wiz-font-family-ui`（Inter）、`--wiz-font-family-mono`（Roboto Mono） | |
| 文本样式 | 类 `.wiz-text-h1` 至 `h5`、`subtitle-1/2`、`body-1/2`、`caption`、`label`、`overline`、`code` | 字号 32 / 24 / 20 / 18 / 16 / 14 / 13 / 14 / 13 / 12 / 11 / 11 / 13 |

- 文本样式整套使用（字号、字重、字距），变量形如 `--wiz-text-body-1-size`。
- 暗色：根节点加 `data-theme="dark"`。组件不单独写暗色。
- Token 值由 `tokens/src/*.json` 生成。设计侧改值后会重新下发整个 `tokens/dist/`，前端不手改 `dist`。

## 组件规则

- 先用已有组件；没有再在同一套 Token 上新建。
- 样式覆盖只用组件暴露的 `className` 和 CSS 变量钩子（如 `--wiz-card-padding`、`--wiz-tabs-padding`），不要覆盖组件内部形状。
- 图标用 Remix，默认 `ri-*-line`。纯图标按钮必须有 `aria-label` 并带 Tooltip，文案只写功能名称（如 More）。
- 弹出层（下拉、菜单、Tooltip、Popover）必须做边缘检测：下方放不下翻到上方；仍放不下则限制最大高度并内部滚动；左右越界整体平移；距视口边缘 4px。内置组件已处理，自绘弹出层复用 `react/src/useEdgeFit.ts`。
- Props 以源码为准。`docs/COMPONENTS.md` 的状态含义：稳定（有设计稿）｜无 Wiz 稿（规格取自原型）｜待确认。

## 读组件的顺序

1. `docs/COMPONENTS.md` 按用途找到组件。
2. `react/src/<组件名>/<组件名>.tsx` 看 Props 类型（变体、尺寸、状态的枚举都在文件顶部）。
3. 同目录 `.css` 看样式钩子。
4. 取值查 `tokens/dist/tokens.css`。
