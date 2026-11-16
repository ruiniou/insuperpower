# 批 4 审核：Markdown

**结果**：`<Markdown>` + 13 个独立元素组件已实现，`npm run build`、`npm run typecheck`、`npm test`（共 65 个用例，Markdown 16 个）均通过；预览页亮暗两套已目视核对，各元素与 Figma 截图逐个对过。

## 启动预览
```bash
cd "design-system" && npm install && npm run dev
```
打开终端里显示的地址（本次为 http://localhost:5174 ），导航「Markdown」：先是整段示例（左源文本、右渲染），再是「Markdown 单元素状态」（Link 4 态、Callout 4 类、Code Block 2 态 + 无头部、Image 3 态、Task 2 态、Citation 3 态等）。

## 文件
- 组件与样式：`packages/react/src/markdown/`（`Markdown.tsx`、`elements.tsx`、`Markdown.css`、`remarkAlerts.ts`、`highlightSas.ts`、`markdown.test.tsx`），导出在 `packages/react/src/index.ts`
- 规则：`docs/markdown.md`；Props 见源码 `packages/react/src/<组件名>/`
- 预览：`apps/docs/src/App.tsx` 末尾两节
- 新增依赖：`react-markdown@9`、`remark-gfm@4`（`@wiz/react` 的 dependencies，库构建时不打进 dist）

## 与 Figma 的出入
- Link 的 Focus：Figma 是 4px 内边距 + 1px 描边的盒子，行内链接加内边距会撑乱排版，代码用 1px outline 外扩 2px 代替；Link 本身字重 400（Markdown/Link），未用 Copilot Inline 的 600。
- Figma 行高为 normal，代码按 13/20 落地（与 Code Block 20 行高一致）。
- Callout 图标、Image/Code Block 图标用 Remix 近似；Image 示例图为预览页自绘 SVG。
- Task 已勾项只变灰（Figma），不加删除线（Atlas 旧规则）。
- Table 单元格内边距沿用 Figma 的 12，字号降到 13。
- Heading 六级同一样式（14/600/下边距 8），Figma 现有的 16/14/13 需按此改。
- 图注取 Markdown 的 title；GFM 无 Image 状态与 Blockquote 出处语法，这两项仅独立组件可用。
- 原始 HTML 不渲染但以纯文本显示（不是丢弃）。
