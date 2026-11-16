# ISP 试点审核页

## 做了什么
- `packages/isp`：11 个 ISP 独有组件（胶囊、连线按钮、连线、画布、展开信息卡、Inputs 卡与替换区、Workflow 气泡、Attention 行、图例、引用链接），各含 tsx / css / 测试；依赖 `@wiz/react`，反向与写死色值由边界测试检查。
- `apps/isp-demo`：Vite + React + TS；`src/store/*.ts` 搬运原型 DB、状态推导、Run / Lock / Keep / 替换 / 槽位上传（纯逻辑，行为不变）；hash 路由；SideBar（含 Recent events）、Breadcrumb（▾ 同级切换）、Tabs；Studies 页、Event Overview 页；其余路由为占位页。
- 验证：根目录 `npm run build`、`typecheck`、`test` 全部通过（react 170、isp 28、isp-demo 20 个测试）。浏览器 1440×900 实测：Studies 搜索、TA 筛选、Switch 提示；Overview 的展开卡、Keep、Start 跳转、替换文件（下游变 Update available，Next steps 同步）、Update 运行至 Review，结果与原型一致。

## 启动
`cd design-system && npm run dev:isp`，地址 http://127.0.0.1:5174/（`#/studies`、`#/event/EVT-001/overview`）。

## 与原型的差异
1. 侧栏选中态为实心蓝（库 SideBar 样式），原型为浅蓝底。
2. （已解决）页签：库原无下划线版本，已在 `@wiz/react` Tabs 新增 `underline` 变体（取自交付包），页签已改用。
3. Studies 表格行高 32（原型 48），整行不可点，仅 Study ID 可点。
4. 搜索为常驻输入框（原型点图标展开）；列表/卡片切换里的卡片视图原型未设计，试点自拟。
5. 状态图标改用 Remix（原型自绘 SVG，Stale 无黄底填充）；写死色值已映射到最近的 `--wiz-*`，边框颜色略有深浅差。
6. 未做 Copilot 面板；Asset / Dataset / Workflow / Review 跳转落到占位页，运行中点 Update 会跳占位页，返回 Overview 可见进度。
7. 未逐像素对比，仅目测同视口截图。

## 缺口（通用组件 4 项，Tabs 下划线已入库）
Table 行点击与可调行高；图标分段切换（SegmentedControl）；Search 点击展开形态；带箭头 Popover（Workflow 气泡目前放在 isp 包内）。
ISP 独有已放 `packages/isp`：见上。规格不确定：设计参考 2.4.2 写“页面不放图例”，本试点按任务与原型保留。

## 组件库不顺手之处
- Table 的 `render(value,row)` 每格重建，行点击 / 选中无受控 API；Switch 无 `label` 外的可访问名约定。
- 样式覆盖只能靠外层 className，库组件内部无 CSS 变量钩子（如 Button 在卡片内撑满需自写选择器）。
- SideBar 选中态不可配；Avatar `size` 为数字，但字号不随之缩放。

## 对 7b / 7c 建议
7b 先补 Table 行点击 / 行高、SegmentedControl、Popover(arrow)；7c 再做 Study / Workflow / Asset / Dataset 页，复用 `packages/isp` 的 RefLink、AttentionRow。

## 对库已审核组件的改动（单列）
- Tabs：新增 `underline` 变体；旧别名 `underline` 不再映射到 style-b（`pill` 仍映射）。
- 应用内覆盖（未改库）：Secondary 按钮去阴影；Studies 表头无填充、无列分隔线、通栏分割线；Search 高度 32。
