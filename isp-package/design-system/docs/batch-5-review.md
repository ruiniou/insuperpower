# 批 5 审核：Prompt Input 与 Add-on

**结果**：Prompt Input 8 个状态 + Prompt Shortcut、Attached Items Chips、AI Attachment Thumbnail、AddOn 外壳及 Pending Changes / Metadata Changes / Event Progress 三组已实现；`npm run build`、`npm run typecheck`、`npm test`（95 个用例）通过；预览页亮暗已看，Prompt Input 总高 128 / 204 / 149 与 Figma 一致。

## 启动预览
```bash
cd "design-system" && npm install && npm run dev
```
本次预览地址 http://127.0.0.1:5185 ，导航「Prompt Input」「Shortcut/Chip/Thumbnail」「Add-on」。Prompt Input 末格可真实输入（Enter 发送、Shift+Enter 换行、可填入 14 行长文本看 8 行滚动、回形针模拟上传、发送后进入 Running → 停止 → Stopping）。

## 文件
- 组件：`packages/react/src/` 下 `PromptInput/`、`PromptShortcut/`、`AttachedItemsChips/`、`AIAttachmentThumbnail/`、`AddOn/`、`PendingChanges/`、`MetadataChanges/`、`EventProgress/`（各含 tsx、css、test）
- 规则：`docs/prompt-input.md`；Props 见源码 `packages/react/src/<组件名>/`
- 预览：`apps/docs/src/App.tsx` 末尾三节；`docs.css` 末尾两行（这两节单列宽度）

## 与 Figma 的出入
- Figma 里 656:1910 / 656:1981 / 656:2030 三个 Add-on 画板已不存在，现存只有 665:6077「Multiple Tasks」；外壳与头部取自它，Event Progress 预览里用「3 Tasks to do」复现；Pending Changes（Reject/Accept、Lines 行）、Metadata Changes 内容按任务说明与 Atlas 行为定。
- Extra States 在 Figma 是只读（disabled）样式而非 Focused；Focused 取 Hover 的描边（品牌蓝 1px）作强制预览。
- Prompt Input 静态无阴影（Figma 节点无阴影）；只在叠于 Add-on 之下时带 `--wiz-shadow-layer`。Add-on 阴影在 Figma 是 drop-shadow，落成 `--wiz-shadow-layer`。
- Figma Pending Item 状态图标在行右侧；本批 Event Progress 行复用 LabelStatus，状态图标在左侧。
- 缩略图序号角标取自 Atlas（Figma 画板未画）；Chip 与 Shortcut 图标用 Remix 近似；Event Progress 行高 28 与 Figma 的 24 略有差异（沿用 LabelStatus 文字行高）。
- 输入区用 `<textarea>`（Atlas 为 contenteditable，含 @ 内联标签），@ 菜单与内联标签未做。
