# 批 2 审核：小件

**结果**：5 个组件已实现，`npm run build`、`npm run typecheck`、`npm test`（24 个用例）均通过；预览页亮暗两套都已目视核对，与 Figma 截图一致。

## 启动预览
```bash
cd "design-system" && npm install && npm run dev
```
打开 http://localhost:5173 。页内右上角可切亮暗，顶部导航跳到各组件，每节标题带 Figma 节点链接。

## 组件与位置
| 组件 | 源码（packages/react/src/） | 预览页分节 |
|---|---|---|
| LabelStatus（8 种 status） | LabelStatus/ | Label/Status |
| LabelScope（selection×tag，Figma 实有 4 组合） | LabelScope/ | Label/Scope |
| EventStatusBadge（blocked、skipped） | EventStatusBadge/ | Event Status Badge |
| AITagMini | AITagMini/ | AI Tag Mini |
| AIStatus（text 3 种、number 3 种） | AIStatus/ | AI Status / Confidence |

Props 见源码 `packages/react/src/<组件名>/`。预览页代码在 `apps/docs/src/App.tsx`。构建产物：`packages/react/dist`（`index.js`、`style.css`、`.d.ts`）。

## 与 Figma 的出入
- **Medium 色**：Figma 里是裸色值 `#949F0C`（未绑变量），代码绑最接近的 `--wiz-yellow-70`（`#B88702`），底色为其 10% 透明；未新增 token。与 Low（yellow-60）色相接近，区分度比 Figma 低。
- **图标**用 Remix 近似替换 Figma 的 SVG：Normal `ri-table-line`、Queued `ri-pause-circle-line`、Interrupted `ri-record-circle-line`、Running `ri-loader-4-line`（旋转）、Done `ri-check-line`，其余 `ri-alert-line`、`ri-close-circle-line`、`ri-code-line`。线条粗细可能与 Figma 略有差异。
- **属性命名**：Figma 的 `Property 1` 在代码里为 `level`，`Type` 为 `type`；取值用小写（`high`），数字档保持原文（`>90%`）。
- EventStatusBadge 的 Blocked 文字色按 Figma 绑定的 `--wiz-main-warning`（黄底黄字，对比度偏低，属设计本身）。
