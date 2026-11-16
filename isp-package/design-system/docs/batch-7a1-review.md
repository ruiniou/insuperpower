# 批 7a-1 审核：通用组件第一组（表单、反馈、按钮余项）

**结果**：19 个组件按主库 Wiz-Guideline 落成 TS+CSS 类；`npm run build`、`npm run typecheck`、`npm test`（155 项）通过；预览页新增「表单 / 反馈 / 按钮」三节（共 13 个分节），每个主库变体都摆出，亮暗可切，已对照主库截图与 Token 读数核对。

## 启动预览
```bash
cd "design-system" && npm install && npm run dev -- --port 5191
```
本次预览地址 http://127.0.0.1:5191 ，导航「表单」「反馈」「按钮」。

## 文件
- 组件：`packages/react/src/` 下 `Field/`、`Input/`、`Textarea/`、`Select/`（含 SelectBase）、`MultiSelect/`、`Search/`、`Checkbox/`、`Radio/`、`Switch/`、`Chip/`、`Upload/`、`Divider/`、`Message/`、`Snackbar/`、`Modal/`、`Tooltip/`、`CloseButton/`、`IconButton/`、`OnStatusButton/`、`ButtonGroup/`；另有 `useControllable.ts`（受控 / 非受控与 id）
- Props 见源码 `packages/react/src/<组件名>/`
- 预览：`apps/docs/src/GeneralSections.tsx`、`docs.css` 末尾
- 测试：`Input/Input.test.tsx`、`Select/Select.test.tsx`、`Checkbox/Checkbox.test.tsx`、`Modal/Modal.test.tsx`（后两个文件各含多个组件）

## 新增依赖
无。Select / MultiSelect / Modal / Tooltip / Snackbar 自己实现（Radix 会新增约 6 个包，而需要的键盘与焦点行为不多）：listbox 键盘、Modal 焦点陷阱与还原、Tooltip 聚焦显示均有测试。

## 与 Figma 有出入
- Message 主库只有 Warning 一种，error / success / info 用同结构换语义色阶（Red / Green / Blue 的 10、20、70）。
- Tooltip 底色主库是写死的 #1e293b，改用 Grey 100 / Main White（暗色下自动反相）；Left / Right 的 `direction` 指气泡在触发元素的哪一侧，主库这两个变体的箭头朝向与名称相反，未照搬。
- Snackbar 各类型图标主库统一为 information-line，沿用；右上关闭按钮在 Detailed 下绝对定位，主库为自动布局内的占位，视觉一致。
- Upload 虚线用 CSS `dashed`，主库为 3/3 点划，肉眼差别很小。
- Checkbox 勾与横线用 Remix `ri-check-line` / `ri-subtract-line`，主库为矢量描边；Disable 的 Check / Intermediate 取 Grey 70 底（主库读数）。
- Radio 无 Disable 变体，按 Checkbox 的禁用配色补充。Switch 无 Disable 变体，用 40% 透明度。
- Select 下拉面板主库没有设计，按手册 `.menu2`（圆角 12、项高 32、项圆角 8、选中项品牌蓝加字重 500）。
- Textarea：主库无缩放手柄；代码用自绘手柄（距右、下各 4，所有尺寸一致，指针拖拽调高，最小高 48 / 64 / 80），textarea 撑满外框、关闭原生手柄。文字内边距与主库逐项量过一致：Small、Medium 左上 8，Large 12（Input、Select、Multi Select 同样量过，外框 1px 描边已计入，不叠加）。
- Chip Small：主库为左右 4、间距 4、字 11；与 Default 的 8 / 4 / 12 相比偏挤，按比例改为左右 6、文字与图标间距 3。
- IconButton 的 outline 固定 32，不随 size 变；Primary 只有 circle，与主库一致。

## 迁移注意（旧包 → 新）
- 尺寸 `sm|md` → `small|medium`；Select `multiple` → `<MultiSelect>`；Snackbar `tone` → `type`，`footerAction` / `variant` 取消（用 `actionLabel`、`details`）；Modal 默认宽 560 → 600，默认确认栏仍为取消 / 确认；Checkbox / Switch 的 `onChange` 现在带布尔参数，旧的无参回调仍可用。

## 遗留
- Tooltip / Select 下拉未做自动翻转（空间不足时向上）。
- Splitter（Draggable Divider）、List、Status 等不在本批范围，留给 7a-2。
