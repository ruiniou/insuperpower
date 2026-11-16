---
title: ISP Design System · Agent 设计参考
status: draft
version: 5.0
---

# ISP Design System · Agent 设计参考 5.0

> **视觉以 `../design-system/` 为准。** 本文的颜色、字体、字号、圆角、阴影、组件外观写的是 DS 5.0 旧值，不要照抄。取值方式：
> - 颜色、字体、间距、圆角、阴影：只用 CSS 变量 `--wiz-*`，定义在 `design-system/packages/tokens/dist/tokens.css`；文本样式用 `.wiz-text-*` 类；不写色值。
> - 组件外观、Props、状态：以 `design-system/COMPONENTS.md` 和 `design-system/packages/react/src/<Name>/` 为准；ISP 独有组件在 `design-system/packages/isp/src/`。
> - 本文继续有效的部分：页面结构、布局关系、状态语义、交互与流程、文案规则、待确认事项（第一、二、三部分中不涉及具体视觉数值的内容）。
> - 本文中出现的 Loop A / Loop B 一律读作 Generate Shell / Generate Code。

> 本文是设计和交互参考，不是 React 包，也不代表业务规则已确认。覆盖 TOC → Shell → Code（Generate Code）合并后的 Review 工作台（画布画板「17 · Review（TOC → Shell → Generate Code）」）。 另含 Event Overview（画板「18d · Event 页 · Overview」，见 §2.4）。
> HTML 组件手册里还没有 §3.2 列出的几类组件。与上一版的差异、以及未改动的章节见文末附录。

## 0. 怎么读这份文档

文档分两部分：

- **第一部分 · 共用框架与规则**：三个 step 都适用的东西。先读这部分，页面里遇到冲突时以这里为准。
- **第二部分 · 页面**：TOC、Shell、Code 各自的功能模块位置和细节交互。

### 约束等级

每条规则都标了等级。**不是每条都要照搬**。

| 等级 | 含义 | 不符合时 |
| --- | --- | --- |
| 必须（M） | 影响全产品一致性和基本可用性，接入成本低 | 按最小改法调整 |
| 强建议（S） | 有明确收益，团队应当采用 | 可以不采用，但要写明原因，记为「允许的偏离」 |
| 细节规则（D） | 数值、位置、文案等具体做法 | 可以按自己的实现，不需要记偏离 |
| 示例 / Mock | 原型里的数据、文案、数量、示例页面形态 | 不对照，不当作需求 |

---

# 第一部分 · 共用框架与规则（TOC + Shell + Code）

## 1.1 结构

一个画板、一个页头、三个 step。TOC、Shell、Code 是同一个人在同一个 Event 的 Workflow 里连续做的事，所以不拆页。Code 与 Shell 是同一个工作区，只是权限不同（§2.3）。

```
Nav（默认收起） | 主卡片                                         | Copilot（可选，独立卡片）
                | ┌ Page Header：面包屑 | 步骤按钮 | 页面操作 ┐ |
                | ├ 工作区（随 step 切换）                    ┤ |
```

| 项 | 规则 | 等级 |
| --- | --- | --- |
| 外壳 | 画布 `--isp-color-page`，四周内边距 8px；Nav / 主卡片 / Copilot 各为独立卡片，间距 8px；卡片白底、`--isp-radius-card`、`--isp-shadow-card` | S |
| Nav | 见 §1.1.1 | S |
| 面包屑 | `… › Event › Workflow`；Study 收进「…」。**不再放阶段徽标**，当前阶段由页头中间的步骤按钮表达 | S |
| 切换 step 不丢状态 | 各 step 的编辑、选中、展开、撤销记录在切换后保留 | S |
| 面板 Head 高 48、内边距 0 16；Body 内边距 16（列表类 8） | 只在面板内部滚动 | D |
| 工作区面板之间 | 1px 细线分隔，细线上叠 Splitter（§1.5）；不嵌套圆角卡片 | S |

**共享的状态**（step 之间）有三个：

1. **当前输出**：TOC 里选中的输出，或点「打开 Shell」带过去的那一项。
2. **内容指纹**：TOC 里改了会影响科学含义的内容（标题、分析人群、记录范围、变量、新增输出），Shell 里已有的确认版就过期（见 §1.6）。
3. **Shell 确认版**：Code 步骤基于哪一版 Shell 生成；Shell 过期时 Code 要提示「基于旧版本」（§2.3）。

> TOC 和 Shell 维护的是同一个输出的科学含义，不能各有一份定义。凡是改动科学含义的入口，都要同步另一边。（来自 PM 业务文档）

### 1.1.1 Nav（Review 工作台）

| 项 | 规则 | 等级 |
| --- | --- | --- |
| 默认状态 | 进入 Review 工作台时 Nav **默认收起**，评审时很少用 | S |
| 展开入口 | 页头最左的展开图标（Nav 收起时才出现） | S |
| 收起入口 | Nav 顶部：ISP Logo **右侧**的收起图标，不放在底部 | S |
| 状态 | 只有「展开 160」和「完全隐藏」两态，不做图标态 | S |
| Recent events 行 | 标题单行省略（truncate），不换行；副标题（Study 编号）在标题下一行 | D |

## 1.2 步骤导航

| 项 | 规则 | 等级 |
| --- | --- | --- |
| 位置 | 页头正中，绝对居中，不随左右内容挤动 | D |
| 形式 | 按钮：左图标 + 文字，之间用「→」。当前 step 灰底（`--isp-color-page`），图标底变白；**不用蓝色** | S |
| 图标 | TOC：`ri-list-check-2`；Shell：`ri-table-line`；Code：`ri-code-s-slash-line` | D |
| 行为 | 点击切换 step，页面不跳转；`aria-current="step"` | S |
| 锁定标记 | 已 Lock 的 step 在按钮文字后显示小锁图标 | S |
| 进入 Shell / Code | **不需要** Lock + Approve，不需要先确认上一个 step；TOC 里没核对完也可以进 Shell（PM：Shell 草稿可在全部确认前继续） | S |
| 高度 | 36，不撑大页头 | D |
| 全局性 | 步骤导航是否是整个 Workflow 的全局导航，待确认（§3.1） | — |

## 1.3 主操作、按钮与品牌蓝

| 编号 | 规则 | 等级 |
| --- | --- | --- |
| M2（改） | **每个 step 一个 Primary**。步骤内其余操作降为 Normal / Text。展开菜单、弹窗、二级页面、浮层可各自有 Primary | 必须 |
| S-1 | 品牌蓝只用于「选中」和「唯一的 Primary」。其余操作按钮（添加为条目、Mark Reviewed、本节核对完成、确认内容范围、Run、Update Code 等）一律中性色 | 强建议 |
| S-2 | Page Header 的 Primary 是 Lock + Approve。**范围只限当前 step 的对象**，不是全局 Approve；点击先弹出确认气泡说明范围（如「锁定 14.1.3.1 的 Code 与 Metadata，之后只读。TOC 和 Shell 的锁定状态不受影响」）。TOC / Shell 步骤里该按钮禁用；条件不满足时禁用，`title` 写原因 | 强建议 |
| S-6 | Run 永远是 Normal，即使 Code 已过期也不变成 Primary（Atlas 的做法在 ISP 里不沿用，否则与 S-2 冲突） | 强建议 |
| D-1 | 页头右侧顺序：More（…，内含 Version History）、Comment 模式图标、视图切换（仅 Code 步骤）、Lock + Approve、Copilot 图标（Copilot 关闭时才显示）。Lock + Approve 按钮不带图标，保持精简 | D |
| D-2 | 按钮高度：页头的 Normal 为 32；面板 Head 与面板内小按钮 28；图标按钮 32 / 28 | D |
| D-3 | 破坏性或低频操作用 Text 按钮（删除条目、不需要、取消） | D |

## 1.4 选中与高亮（一套语言）

| 状态 | 表现 | 等级 |
| --- | --- | --- |
| 悬停 | 底色 `--isp-brand-blue-10`（行、Shell 行与列头、Outline 行）；文档里的已关联片段悬停时由点状线变实线 | S |
| 选中 | 底色 `--isp-brand-blue-20`（`#DCE9FF`），文字不变色。Outline 里选中的条目可用 `primary-soft` 底 + 蓝色文字 | S |
| 已关联（文档阅读器） | 文字下点状下划线，颜色 `--isp-brand-blue-40`；没有被引用的文字无标记 | S |
| 被选中输出所引用的原文 / 被选中 Block 对应的代码行 | 与「选中」同色（blue-20），**不再另设一种高亮色** | S |
| 异常 | 黄色 Badge + 文字；行级异常用行首或行尾黄点（6px），黄点必须配文字说明（可放在悬停提示里，详情面板里要有文字），不能只靠颜色（M3） | 必须 |

> `--isp-color-surface-selected`（blue-10）在白底纸面上几乎看不出来，所以选中填充改为 blue-20，blue-10 退为 hover。建议在 Token 里为此新增语义名（如 `--isp-color-surface-selected-strong`），§3 待确认。

## 1.5 面板、尺寸与 Splitter

| 面板 | TOC step | Shell step | Code step | 等级 |
| --- | --- | --- | --- | --- |
| Outline | 220，两级（章节 › 输出） | 220，当前章节下的输出 | 同 Shell | D |
| 主面板 | SAP 原文阅读器，最小 480 | Shell 画布，最小 440 | Shell（最小 480，内含 Metadata）+ Code（最小 300） | D |
| 右侧面板 | 本节输出，440 | 依据，420（上：选中项；下：SAP 原文） | Metadata 在 Shell 面板内右侧，默认 368 | D |
| Copilot | 360，独立卡片 | 360，独立卡片 | 360，独立卡片 | D |

| 编号 | 规则 | 等级 |
| --- | --- | --- |
| S-3 | **打开 Copilot 时 Outline 自动收起**；在 Outline 收起时点击展开会关闭 Copilot。其余面板不动 | 强建议 |
| S-4 | 相邻面板之间使用 Splitter（M5：任何面板拖大后都不能把其他面板挤出屏幕）；折叠 / 展开时宽度与透明度一起过渡，180ms。Splitter 的视觉与交互见下表，尺寸范围见下下表 | 强建议 |
| D-4 | Outline 收起后，展开入口放在主面板 Head 最左 | D |
| D-5 | 1440 宽下，Outline + 主面板 + 右侧面板 + Copilot 放不下时，优先保证主面板，其余按「Copilot > Outline」的顺序让位，参考 S-3 | D |

**Splitter（沿用 4.0，5.0 原型已补回）**：

| 项 | 规则 |
| --- | --- |
| 视觉 | 2px，默认透明；叠在面板之间的 1px 细线上，不额外占位；卡片之间（Copilot 左侧）位于 8px 间距正中 |
| 可点区域 | 两侧各外扩 5px（共 10px）；指针 `col-resize` |
| 高亮 | `--isp-brand-blue-70`；悬停 200ms 后淡入（150ms），离开立即消失；拖拽中和键盘聚焦时始终高亮 |
| 拖拽 | 宽度实时跟手；结束时恢复 `body` 的光标与 `user-select` |
| 键盘 | 聚焦后左右方向键每次 ±16px；`role="separator"`，带当前值与上下限 |
| 上限 | 实际最大值 = 该面板当前宽 + 相邻自适应面板还能让出的宽度（不低于它的最小宽）；与下表最大值取较小者 |

| 面板 | 默认 | 最小 | 最大 |
| --- | --- | --- | --- |
| Outline | 220 | 180 | 320 |
| 右侧面板（本节输出 / 依据） | 440 / 420 | 320 | 560 |
| Metadata（Shell 内） | 368 | 288 | 528 |
| Shell（Code 步骤并排时） | 自适应 | 480 | 900 |
| Copilot | 360 | 320 | 520 |

> 原型的宽度吸附到 4px 一档，拖动会有轻微台阶感；落地时用像素值即可。

### 1.5.1 Outline 行（三个 step 共用）

| 项 | 规则 | 等级 |
| --- | --- | --- |
| 条目行 | 高 28：`[类型图标] 编号 标题（单行省略） …… [状态位]`。**类型图标在标题前**（Table / Listing / Figure，业务图标；原型按编号前缀区分：14.x Table、16.x Listing），参考 Atlas Treelist | S |
| 状态位 | 在行尾，**只显示一个**。优先级：Locked（锁）> 异常（黄点）> Edited（笔）> 已完成（对勾）> 空。待处理不显示图标，参考 Atlas 的 `TreeStatusIcon`（`idle` / `completed` 无图标） | S |
| 状态含义随 step 变 | TOC：对勾 = 已核对；Shell：对勾 = 已确认，黄点 = 确认版已过期；Code：锁 = Locked，笔 = 有未写入 Code 的修改 | S |
| 悬停提示 | 状态位悬停显示文字（Locked / Edited / 已核对 / 无原文依据 / 确认版已过期）；黄点的正式文字说明在对应详情面板里 | S |
| 分组行 | 高 28：`展开箭头 编号 标题 …… 已完成/总数`；全部完成后右侧换成对勾。三个 step 都按 **SAP 章节**分组（Shell / Code 步骤只显示当前章节） | S |
| 当前项 | `primary-soft` 底 + 蓝色文字；未实现的条目 `aria-disabled`，指针为默认 | D |
| Filter | 仅 TOC 步骤有（全部 / 未核对 / 无原文依据，各带计数）；Shell、Code 步骤不放 | D |

### 1.5.2 主面板 Head

| 项 | 规则 | 等级 |
| --- | --- | --- |
| 高度 | 48，所有主面板 Head 对齐（Outline、Shell、Code、SAP） | D |
| 左侧 | 面板类型**图标**（SAP / Shell / Code），不放标题和文件名；文件名等放在图标的悬停提示里。内容本身已经说明了它是什么，标题和文件名是重复信息。Outline 收起时最左是展开按钮 | S |
| 状态文字 | 紧跟图标，中性小字（如确认状态、依据说明、进度）；空则不显示 | D |
| 右侧 | 面板自己的操作：缩放（`− 100% +`）、面板专属按钮（显示引用、本节核对完成、确认内容范围、Metadata 开关、Run、复制、版本历史）。缩放等工具**并入同一行**，不单独占一行 | S |
| 第二行 | 只有该面板有一排编辑工具时才保留（目前仅 Shell step 的编辑工具条）；只读的 Shell（Code 步骤）和 SAP 阅读器只有一行 | D |
| 类型图标冲突 | 同一 step 里有多个面板时用图标区分：SAP / Shell 用文档图标，Code 用代码图标；切到 RTF Preview 后 Shell 面板变成「文档图标 \| RTF Preview」分段切换 | D |

## 1.6 确认状态与留痕

| 项 | 规则 | 等级 |
| --- | --- | --- |
| 状态文字 | 未确认 / 已确认 · 确认版 N / 确认版 N 已过期。放在 Shell 主面板 Head，中性文字，不用颜色 | S |
| 什么会让确认失效 | 内容变更：改人群、条件、行列、小数位、TOC 里的科学内容。**格式变更不会失效**：加粗、对齐、缩进、缩放 | S |
| 过期原因 | 由 TOC 内容变更引起的过期，状态文字追加「· TOC 内容已修改」 | D |
| 科学含义的修改 | 必须填「原因」，原因随修改留痕；「人工决定」类内容在含义里显示原因 | 强建议 |
| 重新生成 | 不得静默覆盖人工修改；删除显示内容不等于取消 SAP 的原始要求 | 强建议（业务） |
| 其他必须保留的合规项 | 操作可追溯、可撤销（Undo / Redo 至少 30 步）、已删除的条目可 Restore | S |
| Lock + Approve 范围 | 只锁当前 step 的对象（Code step：14.1.3.1 的 Code + Metadata）；三个 step 各自 Lock，没有全局 Approve（S-2）。Mark Reviewed 只记进度，不拦截操作 | 强建议 |
| Code 的 Lock 前置 | 假设：Shell 已确认且未过期才能 Lock Code，否则 Checks 里出 Blocker、Lock 禁用（待 PM 确认，§3.1） | 待确认 |
| Locked 之后 | 本 step 页面只读；返工走 Request Changes，改后生成新版本 | S |

## 1.7 滚动、版式与文档阅读器

M4 在文档类面板里这样适用：

- 整页不滚动。Page Header、步骤导航、面板 Head、工具条固定。
- **文档阅读器（SAP 原文、Shell 纸面）的纸页在灰色「桌面」里滚动**：桌面 `--isp-color-surface-sunken`，纸页白底、1px 细边框，多页纸页纵向叠放。只有桌面区域滚动，纸页本身不滚动。
- 选中的输出、条目、段落、Block 或代码行被定位时，用 `scrollIntoView`（居中，平滑），不要让用户手动找。

**文档阅读器（强建议）**：

| 项 | 规则 | 等级 |
| --- | --- | --- |
| 版式 | 保留原文的文档形态：页眉、章节标题、缩进、页脚。不改写原文，只叠加引用、定位、核对 | S |
| 段落编号 | 悬停时显示在纸页左侧（如 P180），平时隐藏 | D |
| 引用标记 | 见 §1.4；悬停或选中时在片段上方显示输出编号小标签 | D |
| 没有对应条目的段落 | 段下出现一行：黄色 Badge「No TOC Item」+「添加为条目」+「不需要」；「不需要」可撤销 | S |
| 显示引用开关 | 面板 Head 右侧一个 toggle，关掉后只保留阅读版式 | D |
| 字体 | 中文文档用衬线（Noto Serif SC）、行高约 2；Shell 纸面用等宽（Courier New）。属于「文档版式」，不受 `--isp-font-ui` 约束 | D |

## 1.8 信息结构：依据驱动（TOC 与 Shell 通用）

每个输出、每行、每列都回答三件事：**是什么（含义）、凭什么（依据）、有什么问题**。

| 概念 | 规则 | 等级 |
| --- | --- | --- |
| 依据类型 | 原文要求 / 推测 / 人工决定 / 未知。**只有「未知」用黄色 Badge**，其余中性（M3） | S |
| 依据引用 | 用 P 编号（P180 …）的虚线下划线小链接。悬停预览原文片段，点击滚动到原文并高亮 | S |
| 问题 | 黄色 Badge（类型）+ 一句话说明。能修的问题，修复动作写在问题下面，不用跳到别处 | S |
| Shell 要处理的问题类型 | **条件缺失、分析人群不符、分类水平未知**。「SAP 要求但 Shell 缺失」不在 Shell 页处理（已移除占位行、合计缺失、遗漏类核对重点），交给 TOC 页的 No TOC Item | S（决定） |
| 可修的问题 | 条件缺失 → 补充条件；人群不符 → 改回 FAS；分类水平未知 → 输入分类水平后指定 | D |

## 1.9 图标：统一使用 Remix

**强建议（S）**：通用图标一律使用 Remix Icon（`ri-*`，当前 4.9.0）。不自绘、不用 emoji、不用内联 SVG 替代。

- 常规操作用 `-line`；`-fill` 只用于明确的选中、强调或状态反馈，同一处不混用。
- 图标按钮必须有可读名称（`aria-label`）；重要操作不只靠图标表达，要配文字。
- 业务图标（Study / Event / Table / Listing / Figure …）用 `assets/domain-icons/`，不用 Remix。
- 图标 16px（面板内小按钮 14px）；颜色跟随文字色，不单独给图标上色（M3）。
- **5.0 原型里的图标是内联 SVG，因为画布不能加载外部字体。落地时按下表替换。** 名称按 Remix 命名习惯给出，落地前请到组件手册「布局与图标」里搜索确认；标「?」的在 Remix 里没有合适的直接对应。

| 场景 | 建议 Remix 图标 |
| --- | --- |
| 展开 / 收起 Nav、Outline | `ri-sidebar-unfold-line` / `ri-sidebar-fold-line`（已约定） |
| Outline 入口 | `ri-list-unordered` |
| 步骤：TOC / Shell / Code | `ri-list-check-2` / `ri-table-line` / `ri-code-s-slash-line` |
| 面板头：SAP / Shell 文档 | `ri-file-text-line` |
| 面板头：Code | `ri-code-s-slash-line` |
| Outline 类型：Table / Listing / Figure | 业务图标（`assets/domain-icons/`）；原型用占位图形 |
| Copilot | `ri-bard-fill`（已约定）；其他 AI 操作 `ri-sparkling-2-line` |
| Version History | `ri-history-line` |
| Comment 模式 | `ri-chat-3-line`（或 `ri-chat-new-line`） |
| Lock + Approve / Locked | `ri-lock-line` |
| More | `ri-more-line` |
| 关闭 | `ri-close-line` |
| 筛选 | `ri-filter-3-line` |
| 展开 / 折叠 | `ri-arrow-right-s-line` / `ri-arrow-down-s-line` |
| 状态：Pending / Reviewed / Edited / Draft | `ri-checkbox-blank-circle-line` / `ri-checkbox-circle-line` / `ri-edit-2-line` / `ri-draft-line`（已约定） |
| 编辑 | `ri-edit-2-line` |
| 添加 | `ri-add-line` |
| 删除 / 恢复 | `ri-delete-bin-line` / `ri-arrow-go-back-line` |
| 撤销 / 重做 | `ri-arrow-go-back-line` / `ri-arrow-go-forward-line` |
| 加粗 | `ri-bold` |
| 对齐 左 / 中 / 右 | `ri-align-left` / `ri-align-center` / `ri-align-right` |
| 减少 / 增加缩进 | `ri-indent-decrease` / `ri-indent-increase` |
| 减少 / 增加小数位 | `?`（Remix 没有现成的；可用文字「.0」「.00」做按钮，或自制业务图标） |
| 缩小 / 放大 | `ri-zoom-out-line` / `ri-zoom-in-line` |
| 行 / 列手柄 | `ri-more-2-line`（竖三点） |
| Run | `ri-play-line` |
| 复制 | `ri-file-copy-line` |
| 打开 Shell / 外链 | `ri-external-link-line` 或 `ri-arrow-right-up-line` |
| 搜索 / 发送 | `ri-search-line` / `ri-arrow-up-line`（与 Copilot 发送保持一致） |

## 1.10 文案与语言（细节规则）

- 中文界面里夹英文术语时保持原样：TOC、Shell、Code、Outline、Lock + Approve、Mark Reviewed、No TOC Item、Restore、Copilot、Run、Update Code、RTF Preview、Log、Metadata。
- 按钮文字用动词短语：添加为条目、添加变量、新增输出、确认内容范围、应用修订。
- 状态用中性文字 + 图标，不用「成功 / 失败」式的颜色词。
- **界面上不写操作说明**：不用文字告诉用户怎么和 Shell 交互（点哪里、拖哪里），这类信息放在设计稿便签或文档里。
- 内部状态标签（confirmed / assumed / TBD）不出现在面向团队的页面里。

## 1.11 Comment 模式（给 Copilot 的批注）

目的：让用户就页面上任何内容（Shell 行列、TOC 条目、依据、Code 行、Log 行）快速写意见，攒在一起一次发给 Copilot，而不是逐条对话。

| 项 | 规则 | 等级 |
| --- | --- | --- |
| 入口 | Page Header 的 Comment 图标按钮（开关）。取代原来 More 菜单里的静态 Comments | S |
| 模式中 | 悬停内容出现虚线框；点击不触发原操作，而是取该内容的文字作**锚点**加入一条评论 | S |
| 浮条 | 主卡片底部居中的浮层，不占布局：标题 + 条数、关闭；每条 = 锚点标签 + 一行输入 + 移除；底部「清空」「发送给 Copilot」 | S |
| 发送 | 合成一条消息显示在 Copilot 对话里，Copilot 自动展开，模式关闭，浮条清空 | S |
| 省 token | 只传锚点文字和用户意见，不传截图和 DOM；真实实现里带上对象编号、行 / 列 ID，让 Copilot 能精确定位（需研发提供） | D |
| 不做 | 评论持久化、历史列表、Copilot 的实际回复（原型只展示发送动作） | — |

---

# 第二部分 · 页面

## 2.1 TOC step（SAP 原文为审核主体）

**业务**（PM《iSP 业务需求说明 UI 设计师版》）：TOC = 报告的输出清单 + 每个输出报告什么（目的、人群、变量 / 记录、条件、方法、规则、未知），不只是编号 + 标题。

| 优先级 | 内容 |
| --- | --- |
| P0 | 看全并检查所有输出；发现遗漏 / 重复 / 拆分错误；追溯到 SAP 原文；修正错误；补充遗漏的输出；进入对应 Shell |
| P1 | 搜索 / 筛选 / 分组 / 重新编号 / 复制 / 排除与恢复；检查采集支持与适用规范。「内容确认」是阶段结果，要记录，但**不能成为页面主体**；Shell 草稿可在全部确认前继续 |
| P2 | 拆分 / 合并输出；限定范围的批量修改 |

「独立的 TOC 视图」不是必须的：PM 只要求输出信息像「工作单元」而不是导航列表。所有操作都落在 SAP 原文页，**审核者发现问题时必须能就地处理**。

### 2.1.1 布局（强建议）

```
Outline 220 | SAP 原文（主，≥480） | 本节输出 440 | Copilot 360（可选）
```

| 模块 | 位置 | 内容 | 等级 |
| --- | --- | --- | --- |
| Outline | 左 | 见 §1.5.1。两级：章节 + 输出；章节行右侧为已核对/总数；输出行为 `类型图标 编号 标题 …… 状态位`（对勾 = 已核对，黄点 = 无原文依据）。顶部是 Filter 下拉：全部 / 未核对 / 无原文依据，各带计数；有筛选时旁边出现清除；筛选后只显示有匹配的章节并默认展开 | S |
| 主面板 Head（一行） | SAP 原文上方，48 高 | 左：文档图标（悬停显示文件名）、小节标题（§4.2.3 …，单行省略）、进度（x / y Reviewed）、黄色 Badge「N 段原文没有对应条目」；右：「显示引用」toggle、「本节核对完成」或「本节已核对」。Outline 收起时最左出现展开按钮 | S |
| SAP 纸页 | 主区 | 见 §1.7；多页纵向叠放，页脚标页码；上下文略去处写「⋯ 略」 | S |
| 本节输出 | 右 | Head：「本节输出」+ 数量 + 「新增输出」Text 按钮。下面是输出列表，可逐项展开 | S |
| Copilot | 最右 | §1.5；Outline 自动收起 | S |

### 2.1.2 「本节输出」列表行（强建议）

收起态一行（两到四行内容）：状态图标 | 编号、标题、摘要（`人群 · N 项变量`）、来源行（`SAP P180、P181`）、标签 | 类型（Table / Listing）| 展开箭头。

标签（黄色 Badge，只在需要处理时出现）：
- 「N 个变量 SAP 未提及」
- 「手动添加 · 无原文依据」
- 「可能与 14.1.x.x 重复」
- 「已删除」（行内文字划线，展开后只有 Restore）

展开态，从上到下（`primary-soft` 底）：

| 行 | 内容 | 编辑方式 |
| --- | --- | --- |
| 标题 | 文本 | 悬停出现编辑图标，点击进入输入框，Enter 确认 |
| 分析人群 | 下拉（FAS / SS / PKCS / PKPS）+ 依据 P 引用 +「为什么」展开一句理由 | 同上 |
| 记录范围 | 文本 + 依据引用 | 同上 |
| 统计内容 / 列示字段 | 数量，可展开变量列表；SAP 未提及的变量有黄色 Badge，点击切到「仅显示 SAP 未提及」模式，再点「显示全部」 | 添加变量 / 删除 / Restore；手动添加的变量行内可改名 |
| 结果呈现 | 文本 + 依据引用 | 同上 |
| 底部操作 | Mark Reviewed、打开 Shell、删除条目（Text） | — |

变量列表按来源分组：每组头写一次来源（P 编号可悬停预览）或「仅 Shell 依据，SAP 未提及」「手动添加，无原文依据」；行里不再重复来源。Listing 的列示字段默认折叠；很长时末尾写「另有 N 项字段」。

### 2.1.3 细节交互（细节规则）

| 交互 | 行为 |
| --- | --- |
| 点 SAP 里已关联片段 | 选中对应输出（展开）；一个片段被多个输出引用时，连续点击依次轮换 |
| 选中输出 | 对应原文片段染成选中色，片段上方显示输出编号小标签；选中输出所在位置自动滚到视野中央 |
| 点依据 P 引用 | 滚动到该段并居中 |
| 「添加为条目」 | 为没有对应条目的段新建一个输出，自动展开并进入标题编辑；该输出的来源为这一段 |
| 「不需要」 | 把这段标成「不需要对应条目」，Badge 消失；显示「已标记为不需要对应条目 · 撤销」 |
| 「新增输出」 | 新建「未命名输出」，无原文依据（标「手动添加」），进入标题编辑 |
| Mark Reviewed | 把该输出标为 Reviewed；不拦截其他操作 |
| 本节核对完成 | 当还有原文没有对应条目时禁用，`title` 说明「添加为条目，或标记为不需要」；可用时把本节所有输出标为 Reviewed |
| 重复检测 | 人群与变量集合相同的输出，互相标「可能与 … 重复」（Mock 规则，真实规则待确认） |
| 内容变更 | 触发共享的内容指纹更新（§1.1） |

## 2.2 Shell step（依据驱动）

**业务**：Shell P0 = 完整 Shell、对应 SAP 原文、当前内容含义与问题（原文明确要求 / 推测 / 人工决定 / 未知）；文字与科学内容的修正。TOC 和 Shell 由同一人审核。Copilot 暂不在 Shell 页展开设计；CRF / 采集资料明细保持轻量，不做详细面板。

**「确认内容范围」是什么**：确认这张 Shell 的科学含义（人群、行列、条件、小数位）与 TOC、SAP 一致，可交给下游用；确认后得到「确认版 N」。它不是 Lock，不拦截继续编辑；内容变更会让它过期（§1.6）。名称可能改为「确认 Shell」（待定）。

### 2.2.1 布局（强建议）

```
Outline 220 | Shell 画布（≥440） | 依据 420（上：选中项 / 下：SAP 原文） | Copilot 360（可选）
```

| 模块 | 位置 | 内容 | 等级 |
| --- | --- | --- | --- |
| Outline | 左 | 见 §1.5.1；当前章节下的输出，状态位：对勾 = 已确认，黄点 = 确认版已过期，笔 = 有未确认修改 | S |
| 画布 Head（一行） | 中上，48 高 | 左：文档图标 + 确认状态文字；右：缩放（`− 100% +`）、「确认内容范围」（有核对重点时禁用，`title` 写原因）。**不放标题**（Shell 纸面上已有）；不再显示页码 | S |
| 工具条 | 画布 Head 下，40 高，常驻 | 撤销 / 重做 \| 加粗 / 居左 / 居中 / 居右 \| 减缩进 / 增缩进 \| 减小数位 / 增小数位。缩放已移到 Head | S |
| Shell 纸面 | 中 | 三行居中标题、列头行（粗上下线）、数据行、脚注区（上粗线）。选中项底色见 §1.4 | S |
| 依据（上） | 右上，最高占 50% | 见 §2.2.3 | S |
| SAP 原文（下） | 右下 | §1.7 版式，当前页，选中项依据到词级高亮；Head：「SAP 原文 · §4.2.3 · 文件名」 | S |
| Copilot | 最右 | 打开时 Outline 自动收起；Head 有「新建对话」「关闭」；输入框上方用一个 Badge 展示当前选中的对象名作为上下文 | D |

### 2.2.2 编辑分工：对象触发 vs 常驻（强建议）

| 类型 | 放在哪 | 例 |
| --- | --- | --- |
| 对象触发的编辑 | 在对象上 | 原地改字（再点一次已选中的标题 / 行标签 / 列头 / 脚注）；选中行 / 列后出现手柄 → 菜单；脚注适用范围 |
| 全局动作 | 常驻工具条 | 撤销 / 重做、加粗、对齐、缩进、小数位（缩放在 Head） |
| 改变科学含义 | **只能**在右侧「修改定义」里改，必填原因 | 分析人群、行的适用条件 |
| P2 动作 | 「…」菜单（未做） | — |

**格式类**（加粗、对齐、缩进、缩放）不让确认失效；**内容类**（小数位、条件、人群、行列增删、标题）让确认失效（§1.6）。

行手柄菜单（选中行后出现在行首的竖三点）：上移 / 下移（不可用时禁用）/ 在下方插入行 / 复制行 / 删除行。列手柄菜单（选中列头后）：在右侧插入列 / 复制列 / 删除列。点画布空白处关闭菜单。新增或复制的行列，依据类型为「人工决定」，原因自动写为「手动新增」「复制自 …」。

### 2.2.3 右侧「依据」面板

**无选中**：Head「核对重点 N」；列表每项：黄色 Badge（人群 / 条件 / 未知）+ 一句话，点击选中对应对象并滚到原文。没有时写「没有未处理的核对重点」。

**有选中**：Head：对象名 +「全部核对重点 N」（Text，回到无选中）。上半区，从上到下：

| 行 | 内容 |
| --- | --- |
| 依据类型 | Badge（原文要求 / 推测 / 人工决定 / 未知，仅「未知」黄色） |
| 含义 | 一句话说这个对象在报告里是什么 |
| 依据 | P 编号链接（点击滚动并高亮原文）+ 引用文字（如「年龄」） |
| 说明 | 推测或人工决定的补充（人工决定要写原因） |
| 问题 · N | 每个问题：黄色 Badge + 说明 + **就地修复动作**（补充“仅女性”条件 / 改回全分析集 / 输入分类水平并「指定」） |
| 结果表达 | 分类变量组：分段控件 `n (%)` \| `n` \| `%` |
| 适用范围 | 脚注：下拉（整份输出 / 某个变量组） |
| 底部 | 变量行：「修改定义」；标题 / 人群：「修订分析人群」；脚注：「删除脚注」 |

**修改态**（点「修改定义」或「修订分析人群」后，整个上半区替换）：范围、适用条件输入（行）或分析人群分段控件、**原因（必填，留痕）**、影响范围（「本输出 14.1.3.1」）、「应用修订」（原因为空时禁用）/ 「取消」。

### 2.2.4 细节交互（细节规则）

| 交互 | 行为 |
| --- | --- |
| 选中 Shell 对象 | 右侧切到该对象；SAP 原文里对应的词（如「基于FAS」「序列」「合计」「年龄」）染成选中色并滚到中央 |
| 点「核对重点」 | 选中对应对象，同上 |
| 点 P 引用 | 滚动到该段 |
| 再次点击已选中的标签 | 进入原地编辑；Enter 或失焦结束；一次编辑只产生一条撤销记录 |
| 小数位 | 只对含小数的占位（如 `xx.x`）可用；范围 −1 … +2 |
| 缩进 | 0–3 级 |
| 缩放 | 90% / 100% / 115% 三档 |
| 条件缺失 | 标题含条件时在行标签后以括号显示，如「是否有生育可能（仅女性）」 |
| 脚注 | 「+ 脚注」添加；适用于变量组时标签后出现上标编号 `1)`，脚注行前缀同号 |

## 2.3 Code step（Generate Code：Shell → SAS Code）

**定位**：与 Shell 是**同一个工作区，权限不同**。Shell 在这里只读（科学含义只在 TOC / Shell 维护一份）；Metadata 按 Atlas 的方式可编辑实现层字段；Code 面板展示生成的 SAS 代码并支持 Run。Atlas 的面板规格（Metadata、Run、RTF Preview、Log）已照搬，差异见下。

### 2.3.1 布局（强建议）

```
Outline 220 | Shell（只读，含 Metadata）| Code（≥300）| Copilot 360（可选）
```

Page Header 右上角有视图切换：`Shell | 并排 | Code`。Code only 时 Shell 与 Metadata 收起；切到 Shell only 时 Code 收起。Code 与 Shell 之间有 Splitter（§1.5）。

| 模块 | 位置 | 内容 | 等级 |
| --- | --- | --- | --- |
| Outline | 左 | 见 §1.5.1；状态位：锁 = Locked，笔 = 有未写入 Code 的修改 | S |
| Shell Head | 中左，48 高 | 左：文档图标（运行后变「文档图标 \| RTF Preview」分段切换）、依据说明文字（有选中对象时）；右：缩放（仅 Shell 标签页）、Metadata 开关图标。**不放「只读」标签**，不放标题 | S |
| Shell 纸面 | 中左 | 与 Shell step 同款，只读：行、列、脚注可点选，不可编辑 | S |
| Metadata | Shell 面板内右侧子卡片，默认 368 | 见 §2.3.2 | S |
| RTF Preview | Shell 面板的第二个标签页 | Run 后出现；上：结果表（Mock 数字）；下：Log（§2.3.3） | S |
| Code Head | 中右，48 高 | 左：代码图标 + **Run**（Normal）；右：「Saved」（无后缀）、复制、Version History。不放文件名 | S |
| Code 区 | 中右 | 行号 + 等宽代码，只读（原型）。选中 Block 时对应代码行染选中色并滚到中央 | S |
| Copilot | 最右 | 与其他 step 一致；说明 Shell 只读，Code 里能直接改的是实现层 | D |

### 2.3.2 Metadata 子卡片

Basic / Blocks 两个标签页，Blocks 标签页按 Block 分段，滚动时导航下拉随当前 Block 同步（scroll-spy）。

| 项 | 规则 | 等级 |
| --- | --- | --- |
| **字段分两类** | **含义来自 Shell 的字段只读**：Population、Group、Reference、Statistics / Levels、Filter、Result format、Basis。**实现层字段可改**：Input Dataset、Program Name、Output Dataset、Suffix、每个 Block 的 Macro、Variable。目的：科学含义只在 TOC / Shell 维护一份 | S（决定） |
| 编辑 | 改动字段 → 该字段标 Edited，并**自动勾选确认**；字段前有确认复选框，标题行有三态全选，计数「N/M confirmed」 | S |
| Update Code | 有未写入的修改时出现，点击把修改写入 Code；Locked 后不可用 | S |
| Checks | Metadata 底部：Blocker（Shell 未确认 / 确认版过期）使 Lock + Approve 禁用；Warning（分类水平未知、有未写入修改）不拦截 | S |
| 点 Shell 里的 Block | 打开 Metadata → Blocks 标签页并滚到该 Block；Code 同时高亮并滚到该 Block 的代码行 | S |
| 宽度 | Splitter 拖拽 288–528（§1.5）；Metadata 开关在 Shell Head 右侧，Code only 视图下收起 | D |

> Block → 代码行的映射在 Atlas 里不存在，真实实现需要研发 / PM 提供；原型用生成代码里的 Block 标记模拟。

### 2.3.3 Runtime：Run、RTF Preview、Log

| 项 | 规则 | 等级 |
| --- | --- | --- |
| Run | Code Head 左侧，Normal 按钮（S-6）；运行中显示「Running」并禁用；点击后 Shell 面板自动切到 RTF Preview，Code only 视图时切成并排 | S |
| RTF Preview | Shell 面板里的标签页，Run 前不存在；显示结果表（Mock 数字）；「Running…」状态在结果区 | S |
| Log | RTF Preview 底部，三档高度：常规（约 40%）/ 收起（只剩一行 Head）/ 最大化（隐藏结果表） | S |
| Log 筛选 | Head 里 Error / Warning / Suspect 三个筛选 chip，各带计数，可多选；无选中显示全部 | S |
| Log 行 → Code | 点击 Log 行，Code 滚到该行并高亮：Error 红底、Warning 黄底、其余选中色 | S |
| 不做 | Syncing Metadata（Atlas 的 Lock 要等 Metadata 同步）、AI 徽标；日志文本、行号、RTF 数字全部是 Mock | — |

### 2.3.4 Lock + Approve（Code）

- 范围：只锁 14.1.3.1 的 Code + Metadata，点击弹出确认气泡说明范围，确认后页面只读。
- 步骤导航里 Code 按钮出现锁图标，Outline 当前项状态位变成锁。
- TOC 与 Shell 的锁定状态不受影响，三个 step 各自 Lock（S-2）。
- 返工走 Request Changes，改后生成新版本。

## 2.4 Event Overview（流水线）

**业务**：Overview 回答「这个 Event 做到哪一步、下一步做什么」。只放重点信息和高频操作；Workflow 运行记录、Asset / Dataset 版本细节、Member 在各自 Tab。

### 2.4.1 布局（强建议）

```
Nav 170 | Tabs: Overview · Workflow · Asset · Dataset · Member
        | 流水线画布（主）
        | Needs your attention（列表）
```

| 模块 | 内容 | 等级 |
| --- | --- | --- |
| Inputs 折叠卡 | 左侧一列。折叠态：标题 + 数量 + 黄色「N newer」Badge；展开态：Analysis plan（SAP 版本）、Datasets（Dummy / Real + 已 pin 数量），每行有跳转（到 Asset / Dataset Tab）和更换版本小按钮 | S |
| Generate Shell | TOC → Shell，单行 | S |
| Generate Code | 上行 Prod Code → Prod Result，下行 QC Code → QC Result，两行汇入 Package | S |
| Study data · Loop C–G | 底部灰色虚线胶囊（aCRF、SDTM Dataset、ADaM Dataset）+「Not in this Event」。不可点击 | S |
| 节点（胶囊） | 40 高圆角胶囊：状态图标 + 名称 + 计数（`24/24`）。点击原地展开成信息卡 | S |
| 连线 | 箭头线连接上下游，线型表示下游节点状态（见 §2.4.2） | S |
| 连线按钮 | 每条连线中点一个 22px 圆形按钮，点击弹出该 Workflow 的卡片 | S |
| Needs your attention | 画布下方的待办列表，见 §2.4.5 | S |

### 2.4.2 状态（必须）

状态由图标 + 线型 / 边框共同表达，不只靠颜色（M3）。**页面上不放图例**，含义以本表为准；图标按钮必须有 `aria-label`。

| 状态 | 含义 | 胶囊 | 连线 | 建议 Remix 图标 | 主按钮 |
| --- | --- | --- | --- | --- | --- |
| Locked | 已锁定，可被下游使用 | 常规边框 | 灰色实线（按钮缩成 8px 小点，悬停放大） | `ri-checkbox-circle-line` | View result |
| Ready | 上游全部 Locked，可启动 | 蓝色边框 | 蓝色实线，按钮为蓝色实心播放 | `ri-play-circle-line` | Start workflow |
| Running | 生成中，显示 `N/M` | 蓝边 + 浅蓝底 | 蓝色流动虚线 | `ri-loader-4-line`（旋转） | View run |
| Review | 生成完成，等待评审 | 蓝边 | 蓝色实线 | `ri-time-line` | Open review |
| Stale | 上游有新版本（Update available） | 黄边 + 浅黄底 | 黄色虚线 | `ri-error-warning-line` | Adopt update |
| Failed | 运行中断，显示已完成数 | 红边 + 浅红底 | 红色虚线 | `ri-close-circle-line` | Retry |
| Blocked | 被外部条件挡住（如数据集云端 / 本地副本不一致、权限或策略限制） | 红色虚线边 | 红色点线 | `ri-forbid-line` | Resolve |
| Not ready | 上游未 Locked | 灰色虚线边，灰字 | 灰色虚线 | `ri-checkbox-blank-circle-line` | Check inputs |

### 2.4.3 交互（强建议）

| 交互 | 行为 |
| --- | --- |
| 点胶囊 | 原地展开成信息卡：标题行（状态图标 + 名称 + Caption，如 `Locked · v2`）+ 键值行 + 主按钮。再点标题收起；同一时间只展开一张；点空白处关闭 |
| 信息卡键值行 | TOC / Shell / Code：Source、File、Workflow；Result：Code、Datasets、Workflow；Package：Prod Result、QC Result、Workflow。资产名可跳转到 Asset / Dataset Tab；File 与 Datasets 行旁有小按钮（替换文件 / 更换版本） |
| 点连线按钮 | 弹出 Workflow 卡：Workflow 名 + 状态 Badge；Inputs（可跳转）、Output、Latest run；底部主按钮 + View runs。第 1 行的连线向下弹出，第 2 行向上弹出 |
| Inputs 折叠卡 | 点标题展开 / 折叠 |
| 替换文件 | 先弹影响预览（见 §2.4.4），确认后才生成新版本 |

### 2.4.4 版本更新与影响（必须）

| 规则 | 说明 |
| --- | --- |
| 替换 ≠ 执行 | 替换文件只产生新版本，**不执行任何后续 Workflow**。直接下游（当前为 Locked）显示 Stale / Update available |
| 逐个确认 | 每个 Stale 节点单独 Adopt；一次 Adopt 只重跑当前这一层，不连带启动更下游 |
| 影响预览 | 替换前文案：「{下游} will show "Update available". Nothing reruns until you adopt.」 |
| Adopt 预览 | Stale 节点的卡片多一行：`Reruns 6 of 24 · Code only`。只重跑命中的输出，其余沿用。模式标签只有三种：Shell only / Code only / This step only |
| 范围 | 只换数据只刷新 Result，不动 Shell / Code；只改样式只重新排版，不重跑 Code；Shell 改动只让命中的 Code 变 Stale |
| Keep | Stale 的 Attention 行有「Keep vN」：保留当前版本，记录决定，节点回到 Locked |
| 运行 / 评审中来了新版本 | 当前运行或评审不受影响，输入不替换。该节点卡片只显示一行「{来源 vN} is out」+ 两个按钮：Keep current / Restart。Restart = 终止当前并用新版本重跑受影响部分 |
| Failed | 输入没变：Retry，从头再来，不改输入。输入已变：走 Adopt update |
| Blocked | 一句原因 + Resolve。Blocked 期间不能 Start |
| Compare | Prod Result 与 QC Result 都 Locked 且 Package 未 Locked 时，Attention 出现「QC and Prod differ in N results」+ Review。差异详情在 Review 页，Overview 不展开 |

### 2.4.5 Needs your attention（强建议）

- 每行：类型 Badge + 标题 + 一行说明 + 至多两个按钮（主按钮 + 次按钮）。
- 排序：Failed / Blocked / Update → Review / Compare → Ready → Running → Study。
- 类型 Badge：Failed / Blocked（红）、Update / Compare（黄）、Review / Ready / Running（蓝）、Study（灰）。
- 固定一行「Newer Study versions」：Study 里有 SAP / Dataset 新版本，Event 继续使用已 pin 的版本，直到用户在 Asset / Dataset 里切换。
- 全部处理完显示「All caught up.」。
- 同一问题不重复出现在多处；列表是节点状态的投影，不是独立数据。

### 2.4.6 给前端的特殊规则

- **单一数据源**：每个节点一份状态（`locked / stale / running / review / failed / empty`）、版本、进度、重跑范围。胶囊、连线样式、连线按钮、卡片按钮、Attention 列表全部由它派生，不各存一份。
- **Ready / Not ready / Blocked 是派生状态**：节点内容为空时，按上游是否全部 Locked、是否有外部阻断条件计算，不存储。
- **标 Stale 的范围**：只标直接下游，且仅当它当前为 Locked。直接下游为 Running / Review 时，记为「待处理的新版本」，不改状态，不标 Stale。
- **进度分母**：Adopt 重跑时分母是本次重跑范围（如 `3/6`），完成后恢复显示全量（`24/24`）。
- **版本号**：重跑完成并 Lock 后版本号 +1；Keep 不改版本号。
- **连线按钮**：Locked 时 8px 小点，其余 22px 圆；点击不冒泡到画布；弹层不超出画布边界。
- **展开卡定位**：第 1 行节点卡片从节点上沿向下展开，第 2 行向上展开。
- **不可点**：Loop C–G 灰色胶囊。
- **示例 / Mock（不对照）**：Open review 直接等于 Lock 是演示，真实流程在 Review 工作台里 Lock + Approve（§2.3.4）；Failed、Blocked、Compare 的触发条件、`6 of 24`、`3 results` 均为演示数据。

---

# 第三部分 · 待确认与缺口

## 3.1 待确认事项（需向 PM 确认，不要当作需求实现）

| 事项 | 待确认 |
| --- | --- |
| Shell 内容的来源 | Shell 每一行 / 列在系统里是否都有对应的 SAP 段落和依据类型？ |
| SAP 要求哪些变量 | 系统是否知道 SAP 要求了哪些变量？这决定条件缺失、分类水平未知能否自动判断 |
| 重复 / 遗漏 | 判断规则是什么（原型的「人群 + 变量集合相同」是 Mock） |
| SAP 段落标签 | SAP 段落是否带「要求类」标签 |
| 步骤导航 | 是否是整个 Workflow 的全局导航，还是只在 Review 里 |
| Generate Shell / Generate Code 是否同一 Workflow | 步骤导航把三个 step 并在一页只是演示便利，真实产品里 Generate Shell 与 Generate Code 是否同属一个 Workflow 待确认 |
| Lock + Approve 范围与顺序 | 本稿假设每个 step 各自 Lock（PRD 是两个 Gate）。待确认：下游是否必须等上游 Lock；上游通过 Request Changes 解锁后，已 Lock 的下游怎么处理 |
| Code 的 Lock 前置 | 是否要求 Shell 已确认且未过期（本稿假设要求） |
| Block → 代码行映射 | 真实系统能否提供；这是「点 Block 高亮代码」「Log 行跳转」的前提 |
| 选中填充 Token | 是否在 Token 里新增语义名，或把 `surface-selected` 改成 blue-20 |
| Outline 让位顺序 | Atlas 在四块并排放不下时的让位顺序为 Metadata → Shell → Outline 宽度 → Outline 自动收起 → Copilot；ISP 目前只用 S-3（Copilot 打开时收起 Outline），是否采用 Atlas 顺序待定 |

## 3.2 建议补进 DS 组件手册的组件（5.0 原型里用到，手册里还没有）

1. SAP 文档式阅读器（纸页 + 桌面、段落编号、已关联点状线、选中填充）
2. 依据面板（含义 / 依据 / 问题 / 修订，键值行）
3. 步骤导航（页头居中，含锁定标记）
4. Outline 行（类型图标 + 状态位 + 分组计数）+ Filter 下拉
5. 键值行（kv）、分段控件（Segmented）、小徽标（16px）
6. Shell 编辑工具条、行 / 列手柄菜单
7. Metadata 子卡片（标签页 + scroll-spy + 确认复选框 + Edited 标记 + Checks）
8. Log 面板（筛选 chip + 三档高度 + 行跳转）
9. Comment 浮条
10. 流水线胶囊 + 连线按钮 + 展开信息卡（Event Overview，§2.4）

## 3.3 Mock 数据（不对照，不当需求）

原型里的这些都是示例：AG-123-122 / STU-001 / WF-01、SAP 的 §4.2.3 与 P180–P183 文字、四个输出（14.1.3.1 等）及其变量、章节列表与计数（x / y）、Copilot 对话、「Lock + Approve 还有 N 个章节未核对」文案、重复检测规则、宏名 / 变量名 / SAS 代码、Log 文本与行号、RTF 结果数字。原型只做了 14.1.3.1 的 Code 步骤。

---

# 附录

## A. 相对 4.0 的修改

| 项 | 4.0 | 5.0 |
| --- | --- | --- |
| M2 主操作 | 同一视图只放一个 Primary | 每个 step 一个 Primary（§1.3）；Run 永远 Normal（S-6） |
| 品牌蓝 | 未限定用途 | 只用于「选中」和「唯一的 Primary」（§1.3） |
| 高亮 | 未定义 | 全产品一套高亮语言（§1.4） |
| 选中填充 | `surface-selected` = brand-blue-10 | 选中填充用 `--isp-brand-blue-20`，blue-10 只做 hover（§1.4） |
| 步骤导航 | 无 | 页头居中的步骤按钮，含锁定标记（§1.2） |
| Review TOC / Shell / Generate Code | 独立工作台 | 同一个 Review 工作台的三个 step（§1.1、§1.5、§2.3） |
| Nav | 工作台里隐藏 | 默认收起 + 展开 / 收起入口位置 + 单行省略（§1.1.1） |
| 面包屑 | 带阶段徽标 | 不再放阶段徽标（§1.1） |
| Lock + Approve | 全局语义 | 只限当前 step 对象 + 确认气泡 + 步骤条锁标记（§1.3 S-2、§1.6） |
| Outline | 无统一行规范 | 类型图标在前、状态位在行尾、分组计数（§1.5.1） |
| 面板 Head | 标题 + 文件名 | 只放类型图标，工具并入同一行（§1.5.2） |
| Splitter | 有（框架页） | 画板里补回，补充上限算法和各面板范围（§1.5） |
| Generate Code 工作台 | 独立页 | 并入同一页，权限不同；Metadata 可编辑、Runtime、Code 联动（§2.3） |
| Comment | Comments 数量入口 | Comment 模式 + 浮条 + 发送给 Copilot（§1.11） |
| 界面文案 | 未定义 | 界面上不写操作说明（§1.10） |
| 面板内滚动（M4） | 只写了面板内滚动 | 补充文档阅读器的适用方式（§1.7） |
| 图标 | Remix（已有约定） | 补成强建议，附图标对照（§1.9） |
| 确认状态 | Lock + Approve | 增加「确认版」和「过期」（§1.6） |
| 约束等级 | 必须 / 建议 / 示例 | 必须 / 强建议 / 细节规则 / 示例·Mock |

## B. 沿用 4.0 的部分

以下章节 5.0 **没有变化**，直接看 `ISP-Design-System-Reference_4.0/`：

- 使用方式与对照检查（M1、M3、M4、M5 不变；M2 见 §1.3）
- 外壳结构、对象与层级、管理页、版本范式、Dataset
- 状态表达（Lock 的含义、Locked / Not locked）
- 面板折叠动画（180ms）
- 基础规则：颜色、字体、间距、圆角、阴影、Code Editor 与 Shell 样本、Copilot 与 Markdown
- **Token CSS 清单**（值不变）。5.0 原型已把颜色、字号、阴影、字体改为 `--isp-*`；未换的有：15 / 10 / 9px 字号、部分 px 间距、文档与 Shell 纸面字体
- 未确认事项（4.0 的各表仍然有效，本文 §3.1 为新增）
