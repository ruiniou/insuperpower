# 批 6 审核：Chat 流整体

**结果**：User Chat（6 变体）、AI Thinking Status、AI Image Render Card（5 态）、AI Tool Call（3 态）、AI Error Alert（2 态）、AI Risk Summary、Pure Text、ChatStream 已实现；`npm run build`、`npm run typecheck`、`npm test` 通过；预览页亮暗已看，自动滚底与上滑不强制已验证。

## 启动预览
```bash
cd "design-system" && npm install && npm run dev
```
本次预览地址 http://127.0.0.1:5190 ，导航「Chat 组件」「Chat 流」。「Chat 流」右侧可逐条追加 / 自动播放；左侧是整条对话。

## 文件
- 组件：`packages/react/src/` 下 `UserChat/`、`AIThinkingStatus/`、`AIImageRenderCard/`、`AIToolCall/`、`AIErrorAlert/`、`AIRiskSummary/`、`PureText/`、`ChatStream/`（各含 tsx、css、test）
- 规则：`docs/copilot.md`；Props 见源码 `packages/react/src/<组件名>/`
- 预览：`apps/docs/src/App.tsx` 末尾两节；`docs.css` 末尾

## 与 Figma 的出入
- User Chat 正文 Figma 为 12px，按已确认口径用 13px（行高 20）。
- Pure Text 主组件不在页面上，未读取其节点；样式按任务口径（13px、无内边距、复用 Markdown）。
- Image Render 的 Generating 右侧星标用 `ri-sparkling-2-fill`，Failed 的 Retry 用错误红（Figma 取 Main Error）；Atlas 用品牌蓝，以 Figma 为准。
- 图标均用 Remix 近似（Thinking 的转圈、Tool Call 扳手 `ri-tools-line` 等）。
- Image Render 全屏预览为简版（遮罩、标题、关闭、Esc），Atlas 的 ImagePreviewModal 缩放等未做。
- 用户标签块底色取 `--wiz-agent-surface` 80% 以适配暗色（Figma 为白 80%）。
- Thinking Chain、面板外壳、Command Menu 未做（按确认决定）。
