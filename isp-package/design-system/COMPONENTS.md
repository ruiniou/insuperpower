# 组件清单

源码：`packages/react/src/<组件名>/`（`.tsx` 含 Props 类型、`.css`、`.test.tsx`），入口 `packages/react/src/index.ts`；ISP 独有组件在 `packages/isp/src/<组件名>/`。同一行里 `/` 后的导出在第一个名字的目录里，例外已注明。**Props 以源码为准，本表只用来找组件。** 使用前引入 `tokens.css`、`remixicon.css`、`@wiz/react/dist/style.css`。

状态：稳定（有 Wiz 设计稿）｜无 Wiz 稿（规格取自旧包或交付包原型）｜待确认｜提案中。Figma 节点映射在 `figma-map/components-figma.json`（写回 Figma 时才读）。各组件的设计取舍见 `docs/batch-*-review.md`。

## Copilot 对话

| 组件 | 用途 | 状态 |
|---|---|---|
| UserChat | 用户消息气泡，可带文件、标签 | 稳定 |
| PureText | AI 纯文本回复（Markdown，13px，无内边距） | 稳定 |
| Markdown | 把 Markdown 渲染为 Wiz 样式；元素组件 MarkdownHeading / Link / InlineCode / Callout / Blockquote / Divider / TaskItem / Table / CodeBlock / Image / Citation / Footnote（目录 `markdown/`，规则见 `docs/markdown.md`） | 稳定 |
| ChatStream | 对话区：消息列表、自动滚动、底部固定区（放 PromptInput） | 稳定 |
| AIThinkingStatus | AI 思考中或等待中的状态行 | 稳定 |
| AIToolCall | 工具调用行，可展开看参数与结果 | 稳定 |
| AIErrorAlert | AI 回复里的错误提示 | 稳定 |
| AIRiskSummary | 风险摘要列表（注意 / 参考两档） | 稳定 |
| AIImageRenderCard | 图片生成卡（生成中、完成、失败，版本标记） | 稳定 |
| AIAskUser | AI 向用户提问，单选选项加自定义输入，分步 | 稳定 |
| AIAskOption | AIAskUser 内的单个选项 | 稳定 |
| AIAskUserResult | AIAskUser 回答后的结果（已答或已跳过） | 稳定 |
| AIStatus | AI 置信度标签（High / Medium / Low 或百分比） | 稳定 |
| AITagMini | AI 小标签 | 稳定 |
| CardScope | 范围确认卡：scope（待确认的范围项）、progress（进度项）、summary（摘要） | 稳定 |
| CodeDiff | 代码差异卡 | 稳定 |
| EventStatusBadge | Event 状态徽标 | 稳定 |
| LabelStatus | 带状态图标的行文字（normal / running / queued / blocked / failed / skipped / interrupted / done） | 稳定 |
| LabelScope | 可选中的范围行（图标、标题、说明、blocked / skipped 标签） | 稳定 |

## Prompt 输入与 Add-on

| 组件 | 用途 | 状态 |
|---|---|---|
| PromptInput | Copilot 输入框：发送、停止、附件、快捷提示（规则见 `docs/prompt-input.md`） | 稳定 |
| PromptShortcut | 输入框内的快捷提示项 | 稳定 |
| AttachedItemsChips | 输入框里的附件、上下文芯片 | 稳定 |
| AIAttachmentThumbnail | 附件缩略图（上传中、悬停显示序号） | 稳定 |
| AddOn | 输入框上方的可展开外壳；PendingChanges、MetadataChanges、EventProgress 基于它 | 稳定 |
| PendingChanges | 待接受的变更列表（Reject / Accept / 定位） | 稳定 |
| MetadataChanges | Metadata 变更折叠区 | 无 Wiz 稿 |
| EventProgress | Event 进度状态行列表 | 稳定 |

## 表单与反馈

| 组件 | 用途 | 状态 |
|---|---|---|
| Field / FieldBox | 表单控件的外壳（标签、必填、错误、hint）。Input / Textarea 的 `readOnly` 使用只读外观，内容可选择和复制 | 稳定 |
| Input | 单行输入 | 稳定 |
| Textarea | 多行输入 | 稳定 |
| Select | 单选下拉 | 稳定 |
| MultiSelect | 多选下拉 | 稳定 |
| MemberSelect | 可搜索的单选成员选择器：触发器为头像加姓名，面板顶部搜索，选项带头像；`variant="inline"` 无边框无箭头，悬停才显底色，并向单元格内边距悬挂使内容与列头左对齐，用于表格单元格（Event Owner 交接）。面板挂到 body，不被表格裁切（移植自 Atlas MemberSingleSelect） | 无 Wiz 稿 |
| Search | 搜索框；`collapsible` 可收成图标按钮，点击展开（新增能力无 Wiz 稿） | 稳定 |
| Checkbox | 复选框 | 稳定 |
| Radio | 单选框 | 稳定 |
| Switch | 开关 | 稳定 |
| Chip | 标签、筛选芯片 | 稳定 |
| Upload / FileChip | 拖放或点击选文件，显示与移除已选文件。`browseActions` 可在上传区内提供选择入口，`onFilesDrop` 可接管拖放并自行校验文件或文件夹。`selectedInZone` 在选中后以 FileChip 替换上传区内容 | 稳定 |
| FileBox | 紧凑的单文件选择框，显示文件名，回传原始 `File`，`onRemove` 可显示移除操作 | 无 Wiz 稿 |
| PickList | 多选列表选择器（带列头，选中行浅蓝底） | 无 Wiz 稿 |
| CheckPill | 整块可点的勾选胶囊（多选） | 无 Wiz 稿 |
| Divider | 分隔线 | 稳定 |
| Message | 内联提示条（warning 等语义） | 稳定 |
| Snackbar | 轻提示；SnackbarProvider / useSnackbar 管理队列 | 稳定 |
| Modal | 弹窗，框架布局取自 Atlas（默认宽 480，圆角 8，头部 / 内容 / 页脚上边线，遮罩轻微模糊），可传 `width` | 稳定 |
| ConfirmDialog | 二次确认 / 拦截弹窗（Atlas 框架，默认宽 440，可用 `width` 调整，破坏性确认带红色警示图标块）。破坏性确认时安全选项为主按钮并初始聚焦；可用 `children` 添加表单或阻断详情，`showConfirm` 控制确认操作是否显示；`primaryDanger` 可使用实心 Danger 和无底色返回按钮，安全按钮仍初始聚焦；文案按 ui_content_writer skill 写 | 提案中 |
| Tooltip | 悬停提示 | 稳定 |
| Popover | 气泡：panel（面板）、confirm（确认气泡），可带箭头（新增能力无 Wiz 稿） | 无 Wiz 稿 |
| EmptyState | 空状态：标题、说明、操作 | 无 Wiz 稿 |

## 按钮

| 组件 | 用途 | 状态 |
|---|---|---|
| Button | 按钮：Primary / Secondary / Danger / Link；Secondary 和 Link 无阴影，Primary 和 Danger 可通过 `shadow="none"` 去阴影；`block` 撑满 | 稳定 |
| IconButton | 图标按钮 | 稳定 |
| CloseButton | 关闭按钮 | 稳定 |
| OnStatusButton | 用在深色或彩色状态条上的半透明按钮 | 稳定 |
| ButtonGroup | 按钮组 | 稳定 |
| SegmentedControl | 分段切换：text（图标加文字）、boxed（仅图标） | 无 Wiz 稿 |

## 导航与布局

| 组件 | 用途 | 状态 |
|---|---|---|
| Tabs / TabItem | 页签：style-a、style-b、underline；CSS 钩子 `--wiz-tabs-padding` 控制容器内边距，默认等于各变体当前值 | 稳定 |
| Steps / StepItem | 数字步进器（横向、纵向） | 稳定 |
| SideBar / SideBarTabs / SideBarToggle | 左导航：默认宽 160，可收起；`selectedTone` 选中态 solid / soft（新增能力无 Wiz 稿） | 稳定 |
| TopNav | 顶栏（Mac / Win 项目选择器） | 稳定 |
| Logo | ISP 标志 | 稳定 |
| Breadcrumb | 面包屑，悬停层级名称展开同级切换（无 ▾） | 无 Wiz 稿 |
| Dropdown | 下拉菜单按钮；菜单本体是 PopoverMenu / MenuItem（目录 `PopoverMenu/`）。`multiple` 为多选筛选：行前带复选框，点选不关菜单，选中状态由 `items[].selected` 给；`filterName` 下 `label` 为空时只显示图标加名称（借鉴 Atlas FilterChip 的多选行为）。菜单项规则：破坏性项设 `danger: true`，自动沉底并与前面分隔；超过 6 项用 `group` 分组，组间自动加分隔线（`normalizeMenuItems`） | 无 Wiz 稿 |
| TitleBar | 标题栏（标题、描述、右侧操作） | 稳定 |
| Splitter | 可拖拽分隔条 | 稳定 |
| Card | 卡片容器；`--wiz-card-padding` 钩子 | 无 Wiz 稿 |
| Drawer | 右侧覆盖层抽屉，可拖宽；DrawerRow（键值操作行）、DrawerSectionHead（目录 `drawer/`） | 无 Wiz 稿 |
| StepNav | 步骤导航：图标加文字，步骤间 →，当前步骤灰底并带 `aria-current="step"`，已锁定步骤显示小锁，高 36；Review 页头用（规则 4.6） | 无 Wiz 稿 |
| PanelHead | 面板 Head：高 48，左图标（悬停文字）、标题、中性状态文字，右操作区，可选第二行工具条 | 无 Wiz 稿 |
| KeyValueRow | 通用键值行：键列宽与最小行高可配，值可单行省略或换行，可带操作；`DrawerRow` 暂保持独立实现 | 无 Wiz 稿 |

## 数据展示

| 组件 | 用途 | 状态 |
|---|---|---|
| Status | 状态标签（style1 / style2 / style3 / dot）；`textCase`（新增能力无 Wiz 稿） | 稳定 |
| List / ListGroup / ListDivider / ListItem | 列表项：图标、计数、展开、缩进、复选、开关 | 稳定 |
| TreeList | 树列表（目录 `List/`） | 无 Wiz 稿 |
| OutlineRow / OutlineGroup / OutlineFilter | Outline 条目行（高 28，类型图标，单一状态位 `outlineMark` 按优先级取一个）、分组行（已完成/总数，全部完成换对勾）、带计数的 Filter（目录 `Outline/`） | 无 Wiz 稿 |
| Table | 数据表：分页（含 `jumpToPage` 跳页）、选择、排序、`onRowClick` 整行可点、`rowHeight`、`groupBy`、`activeRow`、`columnLayout`；Column / ColumnHeader / ColumnBody 为单元格样式（新增能力无 Wiz 稿） | 无 Wiz 稿 |
| Avatar / AvatarGroup | 头像（6 色，字号随尺寸缩放）与头像组 | 稳定 |
| CodeEditor | SAS 代码编辑器（行号、当前行、语法高亮） | 无 Wiz 稿 |

## @wiz/isp（ISP 独有，`packages/isp/src/<组件名>/`）

| 组件 | 用途 | 状态 |
|---|---|---|
| PipelinePill | 流水线节点胶囊 | 无 Wiz 稿 |
| PipelineWire | 流水线连线 | 无 Wiz 稿 |
| EdgeButton | 连线上的按钮 | 无 Wiz 稿 |
| PipelineCanvas | 流水线画布（含泳道、备注） | 无 Wiz 稿 |
| PipelineLegend | 状态图例 | 无 Wiz 稿 |
| PipelineStatus | 流水线状态图标 | 无 Wiz 稿 |
| NodeCard | 胶囊展开后的信息卡 | 无 Wiz 稿 |
| InputsCard | Inputs 卡与替换区 | 无 Wiz 稿 |
| WorkflowPopover | Workflow 气泡 | 无 Wiz 稿 |
| AttentionRow | Next steps 待办行 | 无 Wiz 稿 |
| RefLink | 资产或 Dataset 引用链接 | 无 Wiz 稿 |
| VersionRow | 版本行（版本号、Latest / Official、人加日期、Used by） | 无 Wiz 稿 |
| DatasetCard | Dataset 空间卡；DatasetCardMore 为「+N more」占位 | 无 Wiz 稿 |
| ValidityPicker | 有效期选择：开始必填、结束可选（End time 开关），精确到分钟，欧美格式，时区由系统判定；`formatRange` 生成显示文案；`clearable` 有值时浮层底部出现 Clear，清空为 `{ start: '', end: null }`，用作时间范围筛选（Audit trail） | 提案中 |

## 提案中（未实现）

无。规则文档 5.3 里 U-11 至 U-13 暂缓（Demo 临时设计，未定稿），U-18 至 U-20 仍在页面内拼装，均不在上面的表里。
