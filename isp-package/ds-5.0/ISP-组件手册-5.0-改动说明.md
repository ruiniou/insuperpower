# ISP 组件手册 5.0 · 改动说明

产出：`ISP-组件手册.html`（5.0）。4.0 的 HTML 未改动。

## 0. 事实来源与前提

- 优先级：DS 5.0 文档（`ISP-Agent-设计参考.md` 5.0）> 画板 17（`Review-ISP.dc.html`，只参考样式和布局）> 4.0 HTML。
- 项目里没有 `ISP-读取优先级与DS冲突处理.md`，也没有"规则文档更新"交接，所以按任务里写的优先级执行。
- 4.0 HTML 是打包产物。`design-system/gallery/` 的源码比它旧（没有 Workflow、Lock + Approve 等），不能用来重建。所以在 4.0 打包文件上做局部替换，其余结构原样保留。
- 5.0 的构建脚本和新组件源码在 `_build/`（`build5.py` 读 4.0 HTML，输出 5.0 HTML）。

## 1. 与 4.0 冲突、以 5.0 为准的项

| 项 | 4.0 HTML | 5.0 做法 |
| --- | --- | --- |
| M2 | 同一视图一个 Primary | 每个 step 一个 Primary；浮层可各自有 Primary |
| 规则编号 | M2–M6，M4 = Copilot，M5 = 滚动，M6 = 分隔条，无 M1 | 对齐 5.0：M1 视觉一致，M4 = 滚动，M5 = 分隔条；Copilot 位置规则保留，顺延为 M6 |
| 等级名 | 必须 / 建议 | 必须 / 强建议 / 细节规则 |
| M3 | 只写颜色用于异常 | 补"颜色不作为状态的唯一标识，黄点必须配文字说明" |
| M4 | 只写面板内滚动 | 补页头、步骤导航、面板 Head、工具条固定；文档阅读器纸页在桌面里滚动 |
| Nav（Review 工作台） | 隐藏；收起图标在底部 | 默认收起；展开图标在页头最左；收起图标在 Logo 右侧；只有"展开 160"和"完全隐藏" |
| Recent events | 标题可换行 | 标题单行省略（该改动对所有页面生效） |
| 面包屑 | 带阶段徽标 | 不带阶段徽标 |
| 页头右侧 | History、Comments、操作按钮 | More（含 Version History）、Comment 模式、视图切换（仅 Code）、Lock + Approve、Copilot |
| 页头图标按钮高度 | 36 | 32（D-2） |
| Lock + Approve | 全局语义 | 只限当前 step；点击弹确认气泡；TOC / Shell 步骤禁用；step 按钮出现锁标记 |
| Outline / Review TOC / Generate Code 两个参考页 | 两个独立页面 | 合并为一个「Review 工作台」（三个 step 共用页头与外壳） |
| Splitter（Review 工作台内） | 2px 占位，页面色 | 2px 透明，叠在 1px 细线上不占位；新增 aria 值与各面板上下限 |
| 面板 Head | 标题 + 文件名 | 只放类型图标，缩放等并入同一行，高 48 |
| Comment | Comments 数量入口 | Comment 模式 + 浮条 + 发送给 Copilot |

## 2. 新增

- `ov` 规则表：M1；M2 改写；S-1、S-2、S-3、S-4、S-6；D-1 至 D-5。
- 页面框架分区表和入口表：「Review 工作台」按 5.0 重写（10 个分区、13 个入口）。其余页面（页面框架、Studies、Study、Event、模式示意）保持 4.0。
- 组件手册新增 6 节，各带可交互演示和规则表：步骤导航、Outline 行与 Filter、面板 Head、Splitter 与面板尺寸、Comment 浮条、Lock + Approve 确认气泡。
- 图标全部是 Remix（`ri-*`）；Table / Listing / Figure 用手册里已有的业务图标。没有照搬画板的内联 SVG。

## 3. 按条落实对照（§1.1 至 §1.5.2）

| 要求 | 位置 |
| --- | --- |
| Nav 默认收起、展开 / 收起图标位置 | Review 工作台 · Nav（§1.1.1） |
| 面包屑无阶段徽标 | Page Header（§1.1） |
| 步骤导航居中、含锁定标记 | 页头中间；带 `aria-current="step"`（§1.2） |
| 页头右侧顺序 | D-1 |
| Outline 行：类型图标在前，状态位在行尾，只显示一个 | §1.5.1，优先级 Locked > 异常 > Edited > 已完成 |
| 面板 Head 高 48、只放图标、工具并入同一行 | §1.5.2 |
| Splitter 视觉、键盘、上限算法、各面板范围 | §1.5；上限 = 当前宽 + 相邻自适应面板可让出宽度，与表内最大值取较小者 |
| Comment 模式 | §1.11：悬停虚线框，点击取锚点，浮条，发送后 Copilot 展开、模式关闭 |
| Lock + Approve 只限当前 step，带确认气泡 | S-2 |
| 每个 step 一个 Primary；品牌蓝只用于选中和唯一 Primary | M2、S-1；面板内按钮全部中性色 |

## 4. 局部待确认

- 选中填充 `--isp-brand-blue-20` 没有语义 Token。只在 `.zq5` / `.zq5-demo` 内局部定义 `--isp-color-surface-selected-strong`（CSS 里标了"待确认"），没有改全局 Token。
- 步骤导航是否为全局导航：手册里只留一句说明，没有做成规则。
- 其余 §3.1 待确认项（Code 的 Lock 前置、Outline 让位顺序等）没有实现。

## 5. 5.0 文档自身的不一致（已按下列方式处理，需要你确认）

1. 5.0 没有 S-5（只有 S-1、S-2、S-3、S-4、S-6），所以没有写 S-5。
2. 4.0 的 S1–S6 与 5.0 的 S-1 至 S-6 编号相近但含义不同，规则表里并存（5.0 的带连字符）。建议后续把 4.0 的编号改掉。
3. S-2 写"TOC / Shell 步骤里 Lock + Approve 禁用"，§1.6 / §2.3.4 又写"三个 step 各自 Lock"。按 S-2 实现：只有 Code 步骤可点；步骤按钮的锁标记对任一 step 都支持。
4. §1.5.2 说 Head 只放图标，§2.1.1 / §2.2.3 里右侧面板（本节输出、依据）带标题。右侧面板按 §2.1.1 保留标题，其余 Head 只放图标。
5. Metadata 的上限需要 Shell 纸面最小宽，5.0 没给。取 112（Shell 最小 480 − Metadata 默认 368 推出）。
6. 管理页（Studies / Study / Event / 页面框架）的 Nav 仍是 4.0 做法（底部收起）。5.0 §1.1.1 只写了 Review 工作台。`SideBar` 新增了可选参数把收起图标放到 Logo 右侧，默认行为不变。

## 6. 没做的（范围外）

- Generate Code 面板内部：Shell 编辑、Metadata、Code、Runtime（RTF Preview、Log）都用占位。Code 步骤里只有 Run（Normal）、Saved、复制、Version History 的 Head 骨架。
- §3.2 里的 SAP 阅读器、依据面板、kv / Segmented / 小徽标、Shell 工具条与行列手柄菜单、Metadata 子卡片、Log 面板没有补进手册，只做了框架层的三项：步骤导航、Outline 行 + Filter、Comment 浮条（外加 Head、Splitter、确认气泡）。
- 画板里的 Mock（编号、Log 文本、SAP 段落、Copilot 对话）全部没带；占位文案是"输出标题""Event 名称"这类通用词。

## 7. 验证

- 在浏览器里用本地服务打开并操作过：Nav 展开 / 收起、Copilot 开关与 Outline 自动收起、Comment 模式取锚点与发送、Code 步骤视图切换与 Lock + Approve 气泡、Splitter aria 值与方向键、其余管理页的 Nav 未受影响。
- 控制台没有脚本错误。
- 没有逐像素对照画板。方向键步长在手册里的 0.8 倍缩放预览中会放大到约 ±20；这是预览缩放造成的，真实尺寸下为 ±16。
