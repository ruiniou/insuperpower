# Copilot 对话流规则

适用组件：`ChatStream` 及其消息组件（UserChat、PureText、AIThinkingStatus、AIToolCall、AIImageRenderCard、CodeDiff、AIAskUser、CardScope、AIErrorAlert、AIRiskSummary）。面板外壳、Command Menu、Thinking Chain 不在本规则内。

## 1. 对话流排布

- 对话区内边距 24；消息块之间纵向间距 16。
- 用户消息靠右，左侧缩进 40；气泡按内容收缩，最宽到容器可用宽度。
- AI 回复（含文本、卡片、状态）靠左占满宽度，右侧缩进 40。
- Thinking Status 左右内边距为 0，与文字、卡片左边缘对齐；Pure Text 无内边距，文字与卡片左边缘对齐。
- 对话流中所有卡片外层圆角 8；用户气泡圆角 16，底色 Brand Blue 20。
- 对话流正文 13px（Body 2）；用户文字、Pure Text、卡片内正文均用此字号。
- 底部固定区（Prompt Input）通过 `footer` 放入，不随消息滚动；底部留 8。

## 2. 消息类型

| type | 组件 | 说明 |
|---|---|---|
| user | UserChat | 文字、文件块、标签块；标签默认折叠，超过 4 个显示 +N，展开后末尾出现 Collapse；只有文件时为单行 |
| assistant-text | PureText | AI 纯文本，内容按 Markdown 渲染 |
| thinking-status | AIThinkingStatus | loading（Thinking…，转圈）；waiting（Waiting for your input…，橙色图标）。结束后由调用方移除该条 |
| tool-call | AIToolCall | 默认收起；展开显示 Arguments、Result 两段等宽文本 |
| image-render | AIImageRenderCard | generating → complete，失败为 failed（带 Retry）；complete 点击图片区全屏预览 |
| diff | CodeDiff | 默认收起，头部显示 +/- 计数 |
| ask-user | AIAskUser | 问答卡 |
| scope-card / progress-card / summary-card | CardScope | 范围确认、进度、汇总 |
| error | AIErrorAlert | 红框；有详情时可展开；有 onRetry 时显示 Retry |
| risk-summary | AIRiskSummary | 黄框；attention 为黄色警示图标，reference 为灰色信息图标 |

## 3. 滚动

- 对话区纵向滚动，横向不滚。
- 滚动条 6px、全圆角、无轨道；滑块用 `--wiz-agent-scrollbar-thumb`，悬停用 `--wiz-agent-scrollbar-thumb-hover`。
- 新消息或末条内容增长时自动滚到底部；用户上滑离底部超过 24px 后不再强制；用户自己发送新消息时一定回到底部。

## 4. 输入框、代码、Markdown

- 输入框最大高度、发送与停止行为见 `docs/prompt-input.md`。
- Markdown 元素、代码块与代码高亮见 `docs/markdown.md`。
