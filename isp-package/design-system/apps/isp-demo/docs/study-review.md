# Study 页审核

## 做了什么
`apps/isp-demo` 新增 Study 层四页，全部用组件库搭建，业务行为与原型一致（Member 保留占位，Workflow / Event 内页未动）：
- `#/study/:sid/events`：Status 筛选、搜索、列表（卡片视图原型未设计，置灰）、行菜单；**New Event** 弹窗默认引用 SAP / CRF 最新版，创建后 Overview 的 Inputs、Asset 计数联动。
- `#/study/:sid/asset`：按 Category 分组，含 `Not uploaded · Required` 占位行；点行开版本抽屉（440，可拖宽 320–560）；Upload File / Upload new version（占位被同类型文件顶替）。
- `#/study/:sid/dataset`、`/dataset/:space`：三空间卡（前 3 个 + `+N more`）、空间下钻（按 SDTM / ADaM 分组）、版本抽屉、Upload Dataset（模式必选、PROD 盲态勾选）；新版本后 Overview 出现 `NEWER` 提示。
- store：`store/study.ts`（createEvent / uploadAsset / uploadDataset）、`store/assets.ts`（31 种资产类型等常量）、`store/ui.ts`（抽屉、弹窗状态）。页签补了 Asset / Dataset 数量。
- 验证：根目录 `npm run build`、`typecheck`、`test` 通过（react 201、isp 32、isp-demo 20）。

## 启动
`cd design-system/apps/isp-demo && npx vite --port 5176 --host 127.0.0.1`，地址 http://127.0.0.1:5176/（`#/study/STU-001/events|asset|dataset|dataset/dummy`）。（5174 上是旧路径下遗留的进程，未动。）

## 实测对照（1440×900，getBoundingClientRect，原型 → 新）
| 项 | 原型 | 新 |
|---|---|---|
| 页头 / 页签高 / 页面工具条 | 56 / 40 / 48 | 56 / 40 / 48 |
| 表头 / 行 / 分组行 | 36 / 48 / 32 | 36 / 48 / 32 |
| 抽屉：宽 / 顶 / 标题栏 / kv 行 / 分节头 | 440 / 64 / 48 / 44 / 48 | 440 / 64 / 48 / 44 / 48 |
| 弹窗宽 | 600 | 600 |
| Dataset 卡 / 分节标题 | 397×84 / 36 | 397×83 / 36 |

## 与原型差异
1. 弹窗用库 Modal：标题栏 64、内边距 24/32、确认栏 80（原型 56 / 16·20 / 44），弹窗更高。
2. 筛选用 Dropdown（高 32，原型 chip 28）；Search 为展开式；Events 页卡片视图置灰。
3. 列宽为近似（原型 fr 比例 → 固定 + 弹性），Asset 名称列 370（原型 320）。
4. 抽屉阴影取 `--wiz-shadow-overlay`；状态标签高 20 / 句式大小写，色值映射 `--wiz-*`。
5. 筛选与搜索状态在页内，离开页面即重置（原型全局保留）。
6. 文件类型下拉的分类标题用不可选项模拟（Select 无分组）。
7. 抽屉里 Rename / 版本菜单仅提示未实现，同原型。

## 缺口与新增组件
新增（react）：Drawer（+DrawerRow、DrawerSectionHead）、PickList、CheckPill、EmptyState、FileBox；（isp）：VersionRow、DatasetCard。
缺口（共 3）：① Select 无分组；② Table 列宽 auto 模式不尊重 `width`（已加 `columnLayout="fixed"` 绕开）；③ Modal 不能调标题栏 / 内边距密度。

## 对已审核组件的改动（默认外观均不变）
Table（`groupBy` / `renderGroup` / `activeRow` / `rowClickable` / `columnLayout`）、Status（`textCase`）、Field / Input / Textarea / Select（`hint`）；应用外壳 `.app-hdr` 改 `box-sizing: border-box`（原为 57 高，与原型 56 对齐）。

## 不顺手之处
Table 的列宽首次测量后冻结，`width` 只是权重；Modal 底栏自带文本需自写 `margin-right:auto`（`.app-modal-note`）；Dropdown 筛选无「选中态」徽标。
