# 批 7a-2 审核：通用组件第二组（导航、数据、布局）

**结果**：Tabs / Steps / Status / List / Column + Table / SideBar / TopNav / Logo / TitleBar / Splitter / Avatar（General + 头像组 >4）按主库落成 TS + CSS 类；Breadcrumb（含 ▾ 同级切换，以交付包原型为准）/ Dropdown / PopoverMenu / TreeList / Card / CodeEditor 沿用旧包换 Token。`npm run build`、`npm run typecheck`、`npm test`（170 项）通过。

## 启动预览
```bash
cd "design-system" && npm install && npm run dev -w @wiz/docs -- --port 5193
```
地址 http://127.0.0.1:5193 ，导航「导航」「数据」「布局」（锚点 `#n-tabs` / `#d-status` / `#l-title`），亮暗可切。

## 文件
- 组件：`packages/react/src/` 下 `Tabs/ Steps/ Status/ List/ Table/ Breadcrumb/ SideBar/ TopNav/ Logo/ TitleBar/ Splitter/ Avatar/ Card/ CodeEditor/ PopoverMenu/ Dropdown/`（每个含 tsx + css，测试在 `Tabs/Tabs.test.tsx`、`Table/Table.test.tsx`、`Breadcrumb/Breadcrumb.test.tsx`，各含多个组件）
- Logo 符号图：`Logo/assets/*.svg`（主库 Logo 11:1996 内 Symbol Frame 导出）
- 预览：`apps/docs/src/NavSections.tsx`；Props 见源码 `packages/react/src/<组件名>/`
- 新增依赖：无

## 实测尺寸（getBoundingClientRect，px）与 Figma 对照
| 项 | 实测 | Figma |
|---|---|---|
| Tabs Style A 高 / 内边距 / 页签高 | 40 / 4 / 32 | 40 / 4 / 32 |
| Tabs Style B 高 / 页签间距 | 32 / 8 | 32 / 8 |
| Step 圆 / 标题行高 / Stepper 间距图标 | 24 / 24 / 24（间距 24） | 24 / 24 / 24（间距 24） |
| Status 高（Style1/2/3） / Only dot | 24 / 16 | 24 / 16 |
| List Item 高 / 箭头 / 左内边距 | 32 / 16 / 8 | 32 / 16 / 8 |
| List 标题行 / Group 内边距 | 48 / 8 | 48 / 8 |
| Column Header / Body 高 | 32 / 32 | 32 / 32 |
| Header 图标按钮 / 图标 / 分隔线 | 24 / 16 / 1×16，距上 8 | 24 / 16 / 1，上 8 下 7 |
| Actions 单元格按钮间距 | 16 | 16 |
| SideBar 宽 / 外壳圆角 | 160 / 16 | 160 / 16（2026-11-16 起统一为 160） |
| 最近项（两行）高 / 项间距 | 44 / 4 | 原型 44；项间距按你定 4 |
| Side Bar Tab 高 / 图标 / 图标左内边距 | 40 / 20 / 10 | 40 / 20 / 10 |
| 用户行高 / 头像 | 40 / 24 | 40 / 24 |
| Top Nav 高 | 40 | 40 |
| Logo ISP（logo/ISP-Text.svg） | 58×24 | 文件原尺寸 58×24 |
| SideBar Logo 行（带折叠按钮 / 无） | 52 / 39 | 原型 .logo：8+32+12 / 8+19+12 |
| Title 高（无 / 有描述） | 52 / 64 | 52 / 64 |
| Draggable Divider 宽 | 1 | 1 |
| Avatar | 32 | 32 |
| 菜单项高 | 32 | 32 |

另（Breadcrumb，对照原型 `.crumb` / `.cmenu`）：▾ 20×20、菜单最小宽 288、搜索框高 32、行高 32、菜单圆角 12、内边距 8。

## 与 Figma 有出入
- Agent Avatar 与 4 个以内的头像组按要求暂不做。
- Tabs 轨道与 Style B 选中底主库为 `rgba(0,0,0,0.05)`，取最近 Token `--wiz-alpha-black-8`（8%）。
- Top Nav 的 Mac 三色圆点主库为固定红黄绿，代码取 `--wiz-red-50 / yellow-50 / green-50`；Win 窗口控件用 Remix 图标代替主库矢量。
- Status 主库只有 3 种固定配色 + 圆点；用 `tone` 补全 6 种语义色（同结构）。Only dot 圆点直径 8 居中于 16 方框，与主库一致。
- Step 的 Loading 圈用 CSS 渐变环 + 旋转动画（主库为导出矢量静图）；Completed 的勾用 `ri-check-line`。
- Left Bar 主库无 Logo 位与 `surface="floating"`，已去掉后者，Logo 作为可选 `logo` 插槽。
- List Item 带描述行时上下加 4 内边距（主库无此变体，沿用旧包能力）。
- Table 排序图标主库只有 `arrow-up-down-line`，排序后换成 `ri-sort-asc / desc` 并染品牌蓝；主库 Column 无斑马纹，`striped` 保留但无效果。
- 菜单项未带选中对勾（按原型 `.menu2` 只变色加粗）；Breadcrumb 下拉按原型 `.cmenu` 带对勾与高亮。
- Breadcrumb 以交付包原型为准（平铺下拉、点 ▾ 打开、链接悬停下划线），不含手册里的悬停自动打开与树形展开。
- Top Nav 的 Logo 用 ISP 标志（`Logo/assets/isp-text.svg`，复制自 `logo/ISP-Text.svg`，图内固定色，暗色主题下文字为深灰）。
- SideBar：Logo 行（粗体 16 文字 ISP，内边距 8 8 12）与折叠 / 展开按钮（原型 ibtn + 设计提供的 collapse-line / expand-line 图标）取自原型；外壳（圆角 16 卡片、宽 170）、折叠按钮（Logo 行右侧，收起后展开按钮在页头，用 `SideBarToggle`）、内容（分组「Recent events」、两行最近项、用户姓名在底部）取自交付包原型；导航项用主库 Side Bar Tabs（高 40、14px、图标 20、项间距 4）。收起时整个导航不渲染，主库 Left Bar 的 56 宽图标栏不再由 SideBar 渲染（图标态仍可用 `SideBarTabs collapsed`）。 用户行头像显示姓名前两个词的首字母（`User Name` 显示 `UN`），字号 11（与 Avatar 的 24 尺寸一致）。

## 遗留
- Dropdown / Breadcrumb 下拉未做空间不足时自动翻转。
- Table 列宽拖拽无键盘操作。
