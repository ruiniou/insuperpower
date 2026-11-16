# 批 3 审核：卡片

**结果**：Button + 5 个卡片组件已实现，`npm run build`、`npm run typecheck`、`npm test`（49 个用例）均通过；预览页亮暗两套已目视核对，与 Figma 截图一致。

## 启动预览
```bash
cd "design-system" && npm install && npm run dev
```
打开 http://localhost:5173 ，顶部导航跳到各节，节标题带 Figma 链接。

## 组件与位置（源码在 packages/react/src/，预览代码在 apps/docs/src/App.tsx）
| 组件 | 目录 | 预览分节 |
|---|---|---|
| Button（Primary/Secondary/Danger/Link） | Button/ | Button |
| AIAskOption（5 种） | AIAskOption/ | AI Ask Option |
| AIAskUser（step×state 6 种） | AIAskUser/ | AI Ask User |
| AIAskUserResult（answered/skipped） | AIAskUserResult/ | Ask User Result |
| CardScope（scope 3 + progress 2 + summary） | CardScope/ | Card/Scope |
| CodeDiff（collapsed/expanded） | CodeDiff/ | Code Diff |

Props 见源码 `packages/react/src/<组件名>/`。另：LabelStatus 加了可选 `description`、`trailing`（Summary 行需要），原有用法不变。

## 与 Figma 的出入
- **Button**：只做了 4 个变体；Danger 的 Figma「Size Default/Medium」实为两种样式，代码里拆成 `dangerStyle`（outline/solid）+ 通用 `size`。Small 尺寸按盘点表 4×8 内边距，实现为固定高 24 + 横向 8。Loading 时左图标换为旋转的 `ri-loader-4-line`（无左图标也会出现）。图标用 Remix 近似。
- **AIAskUser**：Figma 页头 16px 问号、翻页箭头为 SVG，代码用 `ri-question-line`、`ri-arrow-left/right-s-line`。外框阴影按任务要求用 `--wiz-shadow-overlay`（Figma 稿无明显阴影）。选项由 `options` 数组生成，Figma 固定为 3 项 + 自定义项。
- **CardScope**：Figma 标题前的箭头为静态图标，代码用 `ri-arrow-down-s-line`，本批不做折叠交互。Progress 右侧「n of m completed」默认按 items 里 `done` 数计算，需要与 Figma 稿一致时用 `progressText` 覆盖（预览页已覆盖）。Atlas 的 `StoppedEventCard` 不在 Card/Scope 变体内，本批未做。
- **CodeDiff**：Figma 头部带 1px 全框描边，与外框重叠，代码只保留外框与行区上分隔线；Figma 稿计数为 +4/-4 但示例只有 2+2 行，预览用 `addedCount/removedCount` 覆盖。未新增 Token。
