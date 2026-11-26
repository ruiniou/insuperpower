# ISP Design System（Wiz）· Agent 指南

做 UI 前先读本文件和 `COMPONENTS.md`。

## 阅读顺序

1. `COMPONENTS.md`：组件目录（用途与状态），用来找组件，一次读完约 2.5k token。
2. 目标组件的 `src/<Name>/<Name>.tsx`：确认 Props 与行为；同目录 `.css` 看样式钩子，`.test.tsx` 看用法。
3. `packages/tokens/dist/tokens.css`：用到颜色、字体、间距、圆角、阴影时查变量名。
4. `docs/copilot.md`、`docs/markdown.md`、`docs/prompt-input.md`：做 Copilot、Markdown、PromptInput 时读。
5. `docs/batch-*-review.md`、`apps/isp-demo/docs/*-review.md`：查某组件或页面的设计取舍与已知偏差。
6. `../ISP-流程与状态规则.md` 第 7 章：涉及产品规则或未确认状态时读，不能把示例默认值当需求。

## 目录

| 路径 | 内容 |
|---|---|
| `packages/tokens` | W3C Token JSON（`src/primitive`、`semantic`、`agent`）与构建产物 `dist/tokens.{css,js,json,d.ts}` |
| `packages/react` | `@wiz/react`：通用组件（Button、Table、Tabs、Modal、Copilot 相关等） |
| `packages/isp` | `@wiz/isp`：ISP 独有组件（流水线、Inputs 卡、Workflow 气泡等）。依赖 `@wiz/react`，反向不允许 |
| `apps/isp-demo` | 用组件库搭的 ISP 页面（Vite + React） |
| `apps/docs` | 组件预览页 |
| `figma-map` | Figma 变量与 ISP 旧变量到 `--wiz-*` 的映射；`components-figma.json` 是组件到 Figma 节点的映射，只在把页面写回 Figma 或对稿时读，日常写前端不要读 |

## 事实来源

| 主题 | 来源 |
|---|---|
| 组件 Props 与行为 | `packages/react/src/<Name>/`、`packages/isp/src/<Name>/`；公共入口 `src/index.ts` |
| Token 取值 | `packages/tokens/src/**/*.json`（源）与 `dist/tokens.css`（运行时）。改 JSON 后运行 `npm run tokens` 重新生成并校验 |
| Figma 对照 | `figma-map/`；Wiz Agent 文件与 Wiz-Guideline 主库 |

## 规则

- Token 前缀是 `--wiz-*`：`--wiz-color-*`、`--wiz-spacing-*`、`--wiz-radius-*`、`--wiz-shadow-*`、`--wiz-text-*`、`--wiz-font-*`，色阶为 `--wiz-brand-*`、`--wiz-blue-*` 等。文本样式用 `.wiz-text-*` 类。不写色值、字号、圆角字面量；边界测试会检查。
- 暗色：根节点加 `[data-theme='dark']`，组件不单独写暗色。
- ISP 独有组件放 `packages/isp`，通用组件放 `packages/react`。按下方规则选型。
- 样式覆盖用组件暴露的 className 与 CSS 变量钩子，不要靠调用方覆盖组件内部形状。
- 图标：Remix（`ri-*-line` 为默认），纯图标按钮必须有 `aria-label`，并有 Tooltip 说明功能名称（`IconButton` 默认取 `title` / `aria-label`，位置与时延按 Atlas：下方 2px、水平居中、150ms，放不下自动翻转或平移，单行不换行；文案只写简短功能名称，如 More，不带对象；菜单 / 下拉展开时入口保持 Hovered 态，此时不出现 Tooltip）；业务/法规类操作的图标必须带文本标签。
- 选有效期（开始必填、结束可选，精确到分钟）用 `@wiz/isp` 的 `ValidityPicker`：欧美格式 `9:00 am, 09/10/2026`，值为本地 ISO 串 `YYYY-MM-DDTHH:mm`，加 `endable` 出现 End time 开关；显示用 `formatRange`（同天 `9:00 am → 10:00 am, 09/10/2026`，无结束只写开始）；时区由系统判定并标明。不得用文本框手填日期。列表页按时间范围筛选也用它（`endable` 加 `clearable`，空值即不限，区间 [开始, 结束)）。
- 弹出层（下拉、菜单、Tooltip、Popover）必须做边缘检测：下方放不下时按空间翻到上方，仍放不下限制最大高度并内部滚动，左右越界整体平移，离视口边缘 4px。组件库已内置（`useEdgeFit`、`Tooltip`）；自绘弹出层必须复用，不得依赖父容器不裁切或页面位置够用。
- 列表页工具栏统一版式（Demo 里用 `PageToolbar`，`apps/isp-demo/src/pages/study/common.tsx`）：一行 48 高；左侧依次为标题加计数或返回链接（二选一，可无）、筛选 Dropdown；右侧依次为 Search（默认直接显示搜索框，行拥挤时才收成图标）、次要操作、主 CTA。主 CTA 在最右，每页只有一个 Primary。有页签的页面、面包屑已显示页面名的页面，不再重复页面标题。控件统一 32 高。筛选入口用 `Dropdown` 的 `filterName`（13px，名称为次要色，当前值为主文字色），字号和字重不得高于同行的标题与主操作。无权限的 CTA 不渲染、不留空位；空间不足时优先截断筛选值，保留筛选名、下拉箭头和 Search 的宽度。
- 列表空态以筛选和搜索前的数据为准。列表没有数据时隐藏 Search、筛选和工具栏原 CTA，把有权限的新增或上传 CTA 放在 `EmptyState` 说明下方。只读列表或无权限时只显示说明。搜索或筛选无匹配时保留工具栏，方便用户恢复条件。若当前分区没有数据且其他分区有数据，保留分区切换，隐藏空分区的 Search、筛选和重复 CTA。
- 列表页分页（建议项，非强制）：同一页面骨架——工具栏固定在上，表格区在中间滚动，分页条（`Table` 的 `paginated` 加 `jumpToPage`，含 Rows per page、范围、Go to、上一页 / 下一页）粘在表格区底部，翻页与滚动不分两层。判定：数据条数随时间或租户规模无界增长（Studies、Members 这类全量列表）建议分页；条数由业务类型或结构限定（按分类分组的 Asset、Dataset，每 Event 单实例的 Workflow）和抽屉、面板内的列表不分页，保留页内滚动。拿不准的（如 Events）做之前先问用户是否分页。筛选或搜索变化后回到第 1 页；总数不超过最小页长时不显示分页条；选项默认 10 / 20 / 50，默认 20。
- 边界情况弹窗（二次确认、丢弃修改、不可逆操作、权限拦截、错误）用 `ConfirmDialog`，不得用 `Modal` 自拼；标题、正文、按钮文案必须按 `.agents/skills/ui_content_writer/SKILL.md` 写（动词开头、标题式大小写、先说后果、按钮写具体动作，不写 OK / Confirm / Cancel），不得自拟。
- Copilot 相关组件只是 UI 原语，AI 服务、持久化、权限、状态流转由应用提供。Markdown 用 `Markdown` 组件渲染（根类 `.wiz-md`），由应用提供内容并消毒，不注入原始 HTML。
- 命名：组件与文案里的英文术语、状态名保持原样。

## 业务页面组件选型

适用于新增或修改 ISP 业务页面、模块及弹窗。

1. 先明确关键控件的用户动作、所需数据和状态，再查 [组件清单](COMPONENTS.md)、候选组件的 Props 和一个同类业务用例。没有同类页面用例时，看组件预览或测试。
2. 单个组件能覆盖需求时直接复用。需要多个控件协作时，优先组合现有组件，业务处理放在应用层。组合仍缺能力时，再按 UI Design Skill 判断是否扩展或新增组件。
3. 在交付回执里简记容易选错的选择和偏离项，说明缺少的能力、复用的组件和采用的方案。常规复用无需逐项记录。
4. 验收时核对页面实际引用和传入的 Props，并检查相关交互与错误态。可归属到字段的校验错误放在对应字段下方，使用控件或 `Field` 的 `error`。整表级提示用于权限变化等无法归属到字段的问题。

## 导航与工具栏密度

| 位置 | 基准 |
|---|---|
| 导航文字 | SideBar 导航项、页头 `Breadcrumb size="sm"`、Underline Tabs 使用 13 px。页头和 SideBar 顶栏高 48 px。 |
| 列表工具栏 | `Search size="compact"`、`Dropdown filterName` 的 medium 变体、`SegmentedControl` 的 text 变体为 13 px，控件高 32 px。主操作 Button 保留原规格。 |
| 列表内容 | 表头和辅助说明 12 px，数据正文 13 px。行高按内容和操作空间选用。 |

新增或调整同排控件时，同时检查字号、控件高度、图标、内边距及焦点区域。重复出现的密度需求落实到共用组件或现有变体。光学对齐由页面容器处理。

## 交付前

在 `design-system/` 根目录运行 `npm run build`、`npm run typecheck`、`npm run test`；改了 Token JSON 先运行 `npm run tokens`。再到目标页面检查键盘、焦点、加载、错误、禁用和窄屏。不要声称与服务端已集成。
