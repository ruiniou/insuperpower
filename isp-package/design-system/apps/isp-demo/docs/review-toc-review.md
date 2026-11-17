# Review 工作台 TOC 步：评审记录

## 做了什么
- 路由 `#/event/:eid/review/toc` 用组件库实现，去掉 iframe。内容全是 Mock（SAP 正文、章节、4.2.3 的 4 个输出），状态接 `store`：`rvCommit(toc)` 把 `toc` 置 `locked`，`shell` 为 `empty` 时自动 `running`，同步 Workflow 更新时间；Overview、Workflow 列表从 store 推导，不用另行刷新。
- 没有 `:step` 时按 4.5 自动选步（`reviewStep`）；节点 `empty` / `running` 走生成态，`review` / `locked` / `stale` 加载工作台。Shell、Code 的步骤按钮可点，落到 `PlaceholderPage`。
- 不做：More、Comment 模式、新增输出、变量增删改、「添加为条目 / 不需要」（没有无对应输出的原文段落，Mock 里本节没有）。
- 规则写在 `ISP-流程与状态规则.md` 4.6（R4-47 至 R4-59），5.2.1 已更新，5.3 新增 U-18 至 U-20。

## 新增组件（`packages/react`，无 Wiz 稿）
| 组件 | 为什么不能用已有组件 | 测试 |
|---|---|---|
| `StepNav`（U-7） | `SegmentedControl` 是 `radiogroup`，没有 →、锁标记、36 高、`aria-current="step"` | 3 |
| `OutlineRow` / `OutlineGroup` / `OutlineFilter`（U-8） | `List` 最小行高 32，没有单一状态位优先级、分组完成度；Filter 基于已有 `PopoverMenu`，只补触发按钮与计数 | 6 |
| `PanelHead`（U-9） | `TitleBar` 高 52 / 64，标题为主角，没有左图标、状态文字、第二行 | 3 |
| `KeyValueRow`（U-10） | `DrawerRow` 键列固定 90、行高固定 44、单行省略；新组件键列宽、行高可配并可换行。`DrawerRow` 没改（会影响 Asset 抽屉），留作后续 | 3 |

页面内拼装、不组件化：SAP 阅读器（U-18）、「本节输出」行（U-19）、依据引用小链接（U-20）。

## 实测对照（1440×900，`getBoundingClientRect`）
原型取自 `index.html` 的 `RV_DOC` iframe（EVT-003，TOC 置 review）。

| 项 | 原型 | 实测 |
|---|---|---|
| 主卡片 | 8,8 1424×884 | 8,8 1424×884 |
| 页头高 | 56 | 48（按要求与面板 Head 统一） |
| Outline / SAP / 本节输出 宽 | 220 / 764 / 440 | 220 / 764 / 440 |
| 面板 Head 高 | 48 | 48 |
| 面板起点 y | 64 | 64 |
| Filter 按钮 | 86×28，位置 16,112 | 86×28，位置 16,112 |
| Outline 行高、分组行高 | 28、28 | 28、28 |
| 纸页宽 | 640 | 640 |
| 步骤按钮高、图标底 | 36、24 | 36、24 |
| 步骤导航居中 | 中心 978（未居中） | 中心 720（页面正中） |

交互已在浏览器里走过：Lock 不可用点击出原因气泡、Esc 关闭；逐条与整节标记；Lock 确认后 `toc` 为 `locked`、`shell` 为 `running`、TOC 出现小锁；Filter 三项与清除；Outline 选中、关闭、展开；Splitter 方向键 ±16 且主面板不小于 480；`stale`、`running`、`empty` 三种非常规状态。

## 已知差异
- 面包屑在 Review 里最多三层（取完整层级的最后三层），面包屑不含 Studies（列表入口在 Nav），有 Workflow 实例时也不显示 Study；规则 R4-47。
- 步骤导航居中到页面正中（规则 R4-47）；原型是按内容靠左偏移，没有居中。
- `Lock + Approve` 132×32，原型 124×32；面板 Head 内的按钮是库里 Medium（32），原型是 28。库 Button 的小号是 24，没有 28，不在此处改。
- 点击「已关联片段」轮换选中的输出，与原型一致；片段编号标签仍覆盖上一行文字（原型同样）。
- `Lock + Approve` 不可用时用 `aria-disabled` 加灰色样式，保持可聚焦，键盘也能弹出原因气泡；原型是原生 `disabled`，键盘到不了。
- 滚动条：Outline、本节输出、阅读器桌面都预留 `scrollbar-gutter`，Outline 行宽比原型窄一个滚动条宽度。
- SAP 阅读器字体用 `--rv-doc-font`（Noto Serif SC，回退宋体与衬线）；这是文档版式，不属于界面 Token（`index.html` 同样保持不换）。
- 暂缓：生成态进度条（U-11 未定稿）用文字 `n of 24`。
