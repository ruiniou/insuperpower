# Prompt Input 与 Add-on 规则

适用组件：`PromptInput`、`PromptShortcut`、`AttachedItemsChips`、`AIAttachmentThumbnail`、`AddOn`、`PendingChanges`、`MetadataChanges`、`EventProgress`。

## 1. Prompt Input 状态

| Figma Status | 触发条件 | 外观 |
|---|---|---|
| Default | 无内容、无附件 | 白底，描边 0.5 grey-40，圆角 16，内边距 12；总高 128；提示「Type a prompt or press @ for commands」；发送键浅蓝（禁用） |
| Hover | 鼠标悬停（非 Running） | 描边变 1（品牌蓝） |
| Focused | 输入框获得焦点 | 同 Hover 的描边 |
| Filled | 有内容或有附件 | 发送键实色品牌蓝，可点 |
| Running | `running` 为真 | 整框收成一行：星标图标 + 状态文字 + 停止键（品牌蓝底白方块）；无输入区、无附件区 |
| Stopping | `stopping` 为真（优先于 Running） | 恢复输入框外观，保留已输入内容；停止键灰底灰方块，不可点；Enter 不发送 |
| Extra States | `disabled` 为真（如历史会话） | 底色 canvas，描边 1，提示「Historical session is read-only」，输入与 @、附件入口全部不可用，操作区整体 40% 透明 |
| With Attachments | `attachments` 非空 | 附件缩略图排在文字上方；文字区最小一行，总高 = 24 + 48 + 16 + 文字 + 16 + 28 |
| Max Height | 内容超过 8 行 | 见第 2 节 |

状态优先级：Disabled > Stopping > Running > 其余。

## 2. 最大高度与滚动

- 文字区单行行高 17px，最多 8 行 = 136px；输入框整体最大 204px。
- 无附件时文字区最小 60px（整框 128）；有附件时最小一行（17px）。
- 超过 8 行：输入框不再变高，文字区内纵向滚动；文字区右侧留 4px，不与滚动条重叠。
- 滚动条宽 6px，全圆角，轨道无底色，滑块 `--wiz-agent-scrollbar-thumb`，悬停 `--wiz-agent-scrollbar-thumb-hover`。
- Add-on 列表的滚动条同此规格。

## 3. 发送、停止与快捷键

- Enter 发送；Shift+Enter 换行；输入法组合中（IME）的 Enter 不发送。
- 发送条件：未禁用、未 Stopping、无上传中的附件，且（文字去空白后非空 或 至少有一个附件）。
- 发送时回调 `onSend(去首尾空白的文字, 附件列表)`。非受控模式自动清空文字；受控模式由调用方清空 `value` 与附件。
- 发送后由调用方把 `running` 置真；点停止键触发 `onStop`，调用方置 `stopping`，终止完成后两者都置假。
- 有上传中的附件时，发送键禁用（Enter 同样无效）。

## 4. @ 与附件入口

- 回形针：触发 `onAttach`，文件选择与上传由调用方完成。附件达到上限（默认 5，`maxAttachments`）后禁用。
- @：触发 `onMention`，命令/提及菜单由调用方渲染；组件不内置菜单。
- 两个入口在 Disabled 时均不可用；Running 状态下不显示。

## 5. 附件

- 缩略图 48×48，圆角 4，相邻间距 8，一行排不下时换行。
- 左上角显示序号（按附件顺序 1、2…）；Uploading 时缩略图盖 12% 遮罩并显示转圈，序号隐藏。
- 悬停时右上角出现关闭按钮（偏移 -6），点击移除；点击缩略图触发预览。
- 点击缩略图前后有轻微按压缩放（0.98）。
- 文件类附件用 Attached Items Chips：Default 白底，悬停 grey-20 底；图标 + 文件名 + 关闭；文件名过长省略。

## 6. Prompt Shortcut

- 三态：Default、Hover（描边 1 品牌蓝 + 按钮阴影）、Disable（文字 grey-50，不可点）。
- 有 `description` 时变为两行、宽度撑满容器；无描述时按内容宽度。
- 图标可换、可隐藏。

## 7. Add-on 外壳

- 位于输入框正上方，顶部圆角条（圆角 16，描边 0.5 grey-40，底色 grey-10，阴影 `--wiz-shadow-layer`），与输入框叠放，叠放间距 -16（输入框盖住条的下缘）。
- 头部：展开箭头 + 标题（Subtitle 2）+ 右侧计数（Label）+ 进行中转圈；点头部任意处展开/收起（右侧操作区除外）。
- 收起时只显示头部；展开后列表区 `max-height`，超出纵向滚动。
- 三组最大高度：Pending Changes 140、Metadata Changes 200、Event Progress 180。
- 不带输入框单独使用时无叠放留白，四角圆角。

### Pending Changes
- 标题「N Pending Changes」；头部右侧 Reject（Secondary Small）、Accept（Primary Small），点击不触发展开。
- 列表项为代码范围（如 Lines 3-5），点击触发 `onLocate` 定位到代码。

### Metadata Changes
- 标题「N Metadata Changes」；传入 `onClose` 时头部右侧显示关闭按钮。
- 展开内容由调用方通过 children 提供。

### Event Progress
- 标题默认「Event Progress」，计数 = 已完成数/总数；存在进行中的项时右侧转圈。
- 每行是 Label/Status（8 种状态之一），行内边距上下 4、左右 12，悬停 grey-30 底；行右侧可放 Skip / Stop 等操作（`trailing`）。

## 给前端的特殊规则

- 输入框是原生 `<textarea>`（不是 contenteditable）；高度由内容自适应，上限由 `maxRows` 控制，不要另设 `height`。
- Hover、Focused 的 1px 描边实现为 0.5 描边 + 0.5 外扩，内容不会位移；整框内边距为 11.5 + 0.5 描边，总高与设计一致（128 / 204 / 149）。
- `previewState` 只用于文档预览，业务代码不要传。
- Add-on 想与输入框叠放，把 `<PromptInput />` 传给 `input`；需要自定义内容时直接用 `AddOn` + children。
- `AddOn` 头部是一个 button + 外层可点区域；actions 内的按钮已阻止冒泡。
