# 批 7b-1 审核页：补试点暴露的通用组件缺口

## 做了什么
Table 增强（行点击 / 行高 / 受控选中 / 单元格 memo / `variant="plain"`）、SegmentedControl、Search `collapsible`、Popover（带箭头，Workflow 气泡改为依赖它）、SideBar `selectedTone`、Button `block` / `shadow`、Card `interactive`、Dropdown 透传 `shadow`；Avatar 字号随 size 缩放原已实现，补了测试。试点两页已去掉全部外部覆盖：Studies 行高 48、整行可点、列表 / 卡片切换用 SegmentedControl（卡片视图原型未设计，试点自拟）、搜索用展开形态、侧栏 soft、Secondary 用 `shadow="none"`。`app.css` 里 `.studies-table` 与 `.wiz-button--secondary` 覆盖已删。

## 文件
`packages/react/src/{SegmentedControl,Popover}/`（tsx、css、test 各一）；改动：`Table/`（含 `Table.row.test.tsx`）、`Search/`（含 `Search.test.tsx`）、`SideBar/`、`Button/`、`Card/`、`Dropdown/`、`Variants7b1.test.tsx`；`packages/isp/src/WorkflowPopover/`；`apps/isp-demo/src/{pages/StudiesPage.tsx,pages/EventOverviewPage.tsx,AppShell.tsx,app.css}`；预览 `apps/docs/src/Batch7b1Sections.tsx`；`COMPONENTS.md`「批 7b-1」。

## 预览与启动
预览 http://127.0.0.1:5173/#b7-table（亮暗可切；`#b7-seg`、`#b7-search`、`#b7-popover`、`#b7-hooks`）；试点 http://127.0.0.1:5174/。`cd design-system && npm run dev`（预览）/ `npm run dev:isp`（试点）。

## 实测对照（getBoundingClientRect / computed style，预览页）
| 项 | 原型 | 实测 |
|---|---|---|
| 行高（rowHeight=48）/ plain 表头高 | 48 / 36 | 48 / 36 |
| plain 表头字号、首格左内边距 | 12 / 16 | 12 / 16 |
| SegmentedControl text：高、内边距、圆角、间距、选中底 | 32、12、8、4、#F5F5F5 | 32、12、8、4、rgb(245,245,245)，字重 500 |
| SegmentedControl boxed：总高、格、圆角、选中底 | 28、30×26、8、#F0F0F0 | 32、30×30、8、rgb(240,240,240)（按任务「高 32」调整） |
| Popover panel：宽、圆角、头高、箭头 | 300、12、44、10×10 偏移 -6 | 300、12、44、10×10、top -6 |
| confirm：宽、圆角、内边距左 | 320、12、16 | 320、12、16 |
| Search compact / 收起图标 | 28（原型）→ 任务 32 | 32 / 32×32 |
| SideBar soft：底、字色、字重 | #F5F8FE、#0049CD、500 | rgb(244,248,255)（brand-blue-10）、rgb(0,73,205)、500 |
| Avatar 20/24/32/40/56 字号 | — | 9/11/14/18/25 |

## 与交付包出入
- 色值映射到最近 `--wiz-*`（#F5F8FE→brand-blue-10，#D9DBDF→grey-40）；侧栏项高沿用库的 40（原型 32）。
- boxed 分段高 32（原型 28）；Search 高 32（原型 .srch 28）；confirm 气泡边框取透明 + modal 阴影，原型为 0 8 24 .18 阴影。
- 箭头方向命名：Workflow `placement: above` ↔ `arrow: down`。

## 对已审核组件的改动（单列，默认外观均不变）
Table（新增 Props，`.wiz-table__td` 高度改读 `--wiz-table-row-height`，默认 32）、Search（新增 `size` / `collapsible`）、SideBar（`selectedTone`）、Button（`block` / `shadow`）、Card（`interactive`）、Dropdown（`shadow`）、`@wiz/isp` WorkflowPopover（内部改用 Popover，类名 `wiz-isp-pop__tail` → `wiz-popover__tail`，其测试同步）。

## 验证
根目录 `npm run build`、`typecheck`、`test` 通过（react 189、isp 28、isp-demo 20）。浏览器：Studies 行高 48 整行点击跳转、搜索展开 / 收起 / 过滤、列表 / 卡片切换；Overview 连线按钮气泡、Secondary 无阴影，控制台无错误。
