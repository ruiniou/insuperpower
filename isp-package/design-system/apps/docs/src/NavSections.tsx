import { useState, type ReactNode } from 'react';
import {
  Tabs, TabItem, Steps, StepItem, Status, List, ListGroup, ListDivider, ListItem, TreeList, Table, Column, Breadcrumb, SideBar, SideBarTabs,
  Logo, TopNav, SideBarToggle, TitleBar, Splitter, Avatar, AvatarGroup, Card, CodeEditor, PopoverMenu, Dropdown, MenuItem, Button, IconButton,
  type StatusTone, type ColumnType, type TableColumn, type BreadcrumbOption,
} from '@wiz/react';

const LIB = 'https://www.figma.com/design/sqCnlegZT8mTTEu7ja1Mrq/Wiz-Guideline?node-id=';
const AG = 'https://www.figma.com/design/7wcCVMH0CyyjN4XxUbcM6T/Wiz-Agent-UI-Components?node-id=';

function Sec({ id, title, nodes, meta, cols = 260, agent, children }: { id: string; title: string; nodes: string; meta: string; cols?: number; agent?: boolean; children: ReactNode }) {
  const first = nodes.split(' ')[0];
  return (
    <section id={id}>
      <h2>{title}</h2>
      <p className="meta">{meta} · <a href={(agent ? AG : LIB) + first.replace(':', '-')} target="_blank" rel="noreferrer">{agent ? 'Wiz Agent' : '主库'} {nodes}</a></p>
      <div className="grid" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${cols}px, 1fr))` }}>{children}</div>
    </section>
  );
}
const Cell = ({ label, children }: { label: string; children: ReactNode }) => (<div className="cell"><code>{label}</code>{children}</div>);

const crumbOptions: BreadcrumbOption[] = [
  { value: 'STU-001', label: 'STU-001', icon: 'ri-folder-3-line' }, { value: 'STU-002', label: 'STU-002', icon: 'ri-folder-3-line' }, { value: 'STU-003', label: 'STU-003', icon: 'ri-folder-3-line' },
];
const eventOptions: BreadcrumbOption[] = [
  { value: 'Screening', label: 'Screening', icon: 'ri-calendar-event-line' }, { value: 'Baseline', label: 'Baseline', icon: 'ri-calendar-event-line' }, { value: 'Week 4', label: 'Week 4', icon: 'ri-calendar-event-line' },
];

const tableCols: TableColumn[] = [
  { key: 'name', header: 'Name', sortable: true, filterable: true },
  { key: 'site', header: 'Site', sortable: true, filterable: true },
  { key: 'status', header: 'Status', render: (v) => <Status variant="style2" tone={v === 'Done' ? 'green' : 'blue'}>{v}</Status> },
  { key: 'actions', header: 'Actions', width: 100, render: () => (<span className="row" style={{ gap: 16 }}><IconButton icon="ri-edit-line" aria-label="Edit" size="small" /><IconButton icon="ri-delete-bin-line" aria-label="Delete" size="small" /></span>) },
];
const tableRows = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf'].map((name, i) => ({ name: `${name} subject with a long name`, site: ['Boston', 'Tokyo', 'Berlin'][i % 3], status: i % 2 ? 'Done' : 'Open' }));
const tree = [
  { id: 'a', label: 'Studies', icon: 'ri-folder-3-line', children: [{ id: 'a1', label: 'STU-001', count: 12 }, { id: 'a2', label: 'STU-002', count: 4 }] },
  { id: 'b', label: 'Reports', icon: 'ri-file-chart-line', children: [{ id: 'b1', label: 'Weekly' }] },
  { id: 'c', label: 'Archive', icon: 'ri-archive-line' },
];
const SAS = `/* demo */\nproc sql;\n  create table work.ae as\n  select usubjid, "AE" as domain, 12 as n\n  from sdtm.ae where aeser = 'Y';\nquit;\n%macro run(ds);\n  data &ds.; set work.ae; run;\n%mend;`;
const nav = [
  { icon: 'ri-home-5-line', label: 'Home' }, { icon: 'ri-code-ai-line', label: 'Manual Check' }, { icon: 'ri-file-chart-line', label: 'DVP' },
  { icon: 'ri-folder-2-line', label: 'eCRF' }, { divider: true as const }, { icon: 'ri-star-line', label: 'Favourites' },
];
const menuItems = [{ label: 'Rename', value: 'rename' }, { label: 'Duplicate', value: 'dup', shortcut: '⌘D' }, { label: 'Selected item', value: 'sel', selected: true }, { label: 'Disabled', value: 'dis', disabled: true }, { divider: true }, { label: 'Delete', value: 'del', danger: true }];

function SplitterDemo() {
  const [w, setW] = useState(200);
  const clamp = (n: number) => Math.min(320, Math.max(120, n));
  return (
    <div className="split-demo">
      <div style={{ width: w }} className="split-demo__panel">左 {w}px（120–320）</div>
      <Splitter value={w} min={120} max={320} onResize={(d) => setW((x) => clamp(x + d))} />
      <div className="split-demo__panel" style={{ flex: 1 }}>右</div>
    </div>
  );
}
function LiveTabs({ variant }: { variant: 'style-a' | 'style-b' }) { return <Tabs variant={variant} items={['Overview', 'Details', 'History', { value: 'x', label: 'Disabled', disabled: true }]} />; }
const sideItems = [
  { icon: 'ri-home-5-line', label: 'Home' }, { icon: 'ri-folder-line', label: 'Studies' }, { icon: 'ri-book-2-line', label: 'Knowledge Base' },
  { group: 'Recent events' },
  { icon: 'ri-calendar-event-line', label: 'Screening', description: 'STU-001' }, { icon: 'ri-calendar-event-line', label: 'Baseline', description: 'STU-001' }, { icon: 'ri-calendar-event-line', label: 'Week 4', description: 'STU-002' },
];
function LiveSide() {
  const [v, setV] = useState('Studies');
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="side-demo">
      <SideBar collapsible items={sideItems} value={v} onSelect={setV} logo="ISP" collapsed={collapsed} onToggle={setCollapsed} user={{ name: 'Jian Ju', email: 'jian.ju@taimei.com' }} />
      <div className="side-demo__main">
        <div className="side-demo__hdr">{collapsed && <SideBarToggle onClick={() => setCollapsed(false)} />}<span>页头（收起后展开按钮在这里）</span></div>
      </div>
    </div>
  );
}

function LiveCrumb() {
  const [study, setStudy] = useState('STU-001');
  const [ev, setEv] = useState('Baseline');
  return (
    <Breadcrumb items={[
      { label: 'Studies', onClick: () => {} },
      { label: study, onClick: () => {}, options: crumbOptions, currentValue: study, onSwitch: (v) => setStudy(v), searchPlaceholder: 'Search Study' },
      { label: ev, options: eventOptions, currentValue: ev, onSwitch: (v) => setEv(v), searchPlaceholder: 'Search Event' },
    ]} />
  );
}

export function NavSections() {
  const tones: StatusTone[] = ['purple', 'blue', 'green', 'red', 'yellow', 'grey'];
  const colTypes: ColumnType[] = ['checkbox', 'content', 'selector', 'status', 'link', 'actions'];
  return (
    <>
      <Sec id="n-tabs" title="导航 · Tabs / Tab Items" nodes="293:206 274:155 293:151" meta="Style A（轨道 40）/ Style B（32）；Tab Items Normal / Selected；可点击切换，← → Home End 键盘切换">
        <Cell label="Tabs · Style A"><LiveTabs variant="style-a" /></Cell>
        <Cell label="Tabs · Style B"><LiveTabs variant="style-b" /></Cell>
        <Cell label="Tab Items Style A · Default / Selected"><div className="row"><TabItem variant="style-a">Tab name</TabItem><TabItem variant="style-a" selected>Tab name</TabItem></div></Cell>
        <Cell label="Tab Items Style B · Normal / Selected"><div className="row"><TabItem variant="style-b">Tab name</TabItem><TabItem variant="style-b" selected>Tab name</TabItem></div></Cell>
      </Sec>
      <Sec id="n-steps" title="导航 · Step / Stepper" nodes="330:282 330:237" meta="Step：Default（active / upcoming）· Loading · Completed，各含 / 不含描述；Stepper 1 / 2；竖向" cols={720}>
        {(['active', 'upcoming', 'loading', 'completed'] as const).map((s) => (
          <Cell key={s} label={`Step · ${s}`}><div style={{ width: 180 }}><StepItem status={s} number={1} label="Step Name" description="Description" /></div></Cell>
        ))}
        {(['active', 'completed'] as const).map((s) => (<Cell key={s + 'n'} label={`Step · ${s} · 无描述`}><div style={{ width: 180 }}><StepItem status={s} number={1} label="Step Name" /></div></Cell>))}
        <Cell label="Step · Property 1=false 的 Completed"><div style={{ width: 180 }}><StepItem status="completed" selected={false} label="Step Name" description="Description" /></div></Cell>
        <Cell label="Stepper 1（current=0）"><div style={{ width: 684 }}><Steps current={0} steps={[{ label: 'Step Name', description: 'Description' }, { label: 'Step Name', description: 'Description' }, { label: 'Step Name', description: 'Description' }]} /></div></Cell>
        <Cell label="Stepper 2（current=1）"><div style={{ width: 684 }}><Steps current={1} steps={[{ label: 'Step Name', description: 'Description' }, { label: 'Step Name', description: 'Description' }, { label: 'Step Name', description: 'Description' }]} /></div></Cell>
        <Cell label="Stepper · loading"><div style={{ width: 684 }}><Steps current={1} loading steps={[{ label: 'Upload' }, { label: 'Validate' }, { label: 'Done' }]} /></div></Cell>
        <Cell label="Stepper · vertical"><Steps orientation="vertical" current={1} steps={[{ label: 'Step Name', description: 'Description' }, { label: 'Step Name', description: 'Description' }, { label: 'Step Name', description: 'Description' }]} /></Cell>
      </Sec>
      <Sec id="n-side" title="导航 · SideBar（原型外壳）+ Side Bar Tabs（主库）" nodes="14:2426 19:411" meta="外壳、折叠按钮位置、内容取自交付包原型：圆角 16 卡片、宽 170、Logo 行右侧折叠、收起后展开按钮在页头、分组 Recent events、用户在底部；导航项为主库 Side Bar Tabs（高 40、项间距 4）" cols={380}>
        <Cell label="可交互：点折叠，再点页头展开按钮"><LiveSide /></Cell>
        <Cell label="固定展开（collapsible=false，原型的非 Review 页面）"><div style={{ height: 420, display: 'flex' }}><SideBar items={nav} logo="ISP" footerItems={[{ icon: 'ri-settings-3-line', label: 'Configuration' }]} user={{ name: 'Jian Ju', email: 'jian.ju@taimei.com' }} /></div></Cell>
        {(['unselected', 'hover', 'selected'] as const).map((s) => (
          <Cell key={s} label={`Side Bar Tabs · ${s} · 带文字`}><div style={{ width: 138 }}><SideBarTabs state={s} label="Home" icon="ri-home-5-line" /></div></Cell>
        ))}
        {(['unselected', 'hover', 'selected'] as const).map((s) => (<Cell key={s + 'c'} label={`Side Bar Tabs · ${s} · 仅图标`}><SideBarTabs collapsed state={s} label="Home" icon="ri-home-5-line" /></Cell>))}
      </Sec>
      <Sec id="n-top" title="导航 · Top Nav / Logo" nodes="14:2349 11:1996" meta="Top Nav Mac / Win，Logo 用 ISP 标志（logo/ISP-Text.svg）" cols={420}>
        <Cell label="Top Nav · Mac-ProjectSelector"><div style={{ width: 718 }}><TopNav project="iTaimei- EDC_UAT" /></div></Cell>
        <Cell label="Top Nav · Win-ProjectSelector"><div style={{ width: 718 }}><TopNav platform="win" project="iTaimei- EDC_UAT" /></div></Cell>
        <Cell label="Logo · ISP（logo/ISP-Text.svg，TopNav 默认）"><Logo /></Cell>
      </Sec>
      <Sec id="n-crumb" title="导航 · Breadcrumb（▾ 同级切换）" nodes="11:2035" meta="以交付包原型 .crumb / .cmenu 为准：16/24、当前项 500；链接悬停变蓝 + 下划线；▾ 20×20 点击打开，菜单最小宽 288、圆角 12、搜索框 32、行高 32、当前项高亮打勾；点名称导航。主库无此组件，链接指向 Top Nav" cols={420}>
        <Cell label="md · 14px"><Breadcrumb size="md" items={[{ label: 'Home', href: '#n-crumb' }, { label: 'Studies', onClick: () => {} }, { label: 'STU-001' }]} /></Cell>
        <Cell label="lg · 16px（默认）+ 图标"><Breadcrumb items={[{ label: 'Home', icon: 'ri-home-5-line', onClick: () => {} }, { label: 'Studies', onClick: () => {} }, { label: 'STU-001' }]} /></Cell>
        <Cell label="Study ▾ / Event ▾ 同级切换（点 ▾，可搜索）"><div style={{ minHeight: 260 }}><LiveCrumb /></div></Cell>
      </Sec>
      <Sec id="n-menu" title="导航 · Dropdown / PopoverMenu / MenuItem" nodes="" meta="原型 .menu2 新版：圆角 12、项高 32、项圆角 8、内边距 4、选中项品牌蓝 + 500、边框 1px grey-40、shadow-popover；↑↓ Home End Esc" cols={260}>
        <Cell label="Dropdown（点击打开）"><div style={{ minHeight: 230 }}><Dropdown label="Actions" items={menuItems} /></div></Cell>
        <Cell label="Dropdown · primary · icon · align right"><div style={{ minHeight: 230 }}><Dropdown label="New" variant="primary" icon="ri-add-line" align="right" items={menuItems} /></div></Cell>
        <Cell label="Filter chip 无筛选 / 单选"><div className="row">
          <Dropdown filterName="Type" items={[{ label: 'All', selected: true }]} />
          <Dropdown filterName="Status" label="Active" items={[{ label: 'Active', selected: true }]} />
        </div></Cell>
        <Cell label="Filter chip 多选 / 窄宽度截断"><div style={{ width: 160 }}>
          <Dropdown multiple filterName="Role" label="Study Admin, System Owner" items={[
            { label: 'Study Admin', selected: true },
            { label: 'System Owner', selected: true },
          ]} />
        </div></Cell>
        <Cell label="PopoverMenu · 自定义触发（open 强制展开）"><div style={{ minHeight: 230 }}><PopoverMenu open trigger={<IconButton icon="ri-more-2-fill" aria-label="More" />} items={[{ label: 'With icon', icon: 'ri-edit-line' }, ...menuItems]} /></div></Cell>
        <Cell label="MenuItem · 默认 / 悬停 / 选中 / 危险 / 禁用"><div style={{ width: 200 }}>
          <MenuItem item={{ label: 'Default' }} /><MenuItem item={{ label: 'Hover' }} forceHover /><MenuItem item={{ label: 'Selected', selected: true }} />
          <MenuItem item={{ label: 'Danger', danger: true }} /><MenuItem item={{ label: 'Disabled', disabled: true }} />
        </div></Cell>
      </Sec>

      <Sec id="d-status" title="数据 · Status（旧包 Badge）" nodes="337:838" meta="Style1 / Style2 / Style3 / Only dot 按主库默认配色；其余为同结构换语义色阶" cols={300}>
        <Cell label="Style1 / Style2 / Style3 / Only dot（主库默认）"><div className="row"><Status variant="style1">Status</Status><Status variant="style2">Status</Status><Status variant="style3">Status</Status><Status variant="dot" /></div></Cell>
        {(['style1', 'style2', 'style3'] as const).map((v) => (
          <Cell key={v} label={`${v} · 6 色`}><div className="row">{tones.map((t) => <Status key={t} variant={v} tone={t}>{t}</Status>)}</div></Cell>
        ))}
        <Cell label="Only dot · 6 色 · 带文字"><div className="row">{tones.map((t) => <Status key={t} variant="dot" tone={t}>{t}</Status>)}</div></Cell>
      </Sec>
      <Sec id="d-list" title="数据 · List Item / List Group / List / TreeList" nodes="335:214 337:1102 335:405" meta="List Item Normal / Selected × 数字 × 展开箭头；List（标题 48 + Group + Divider）；TreeList 沿用旧包" cols={260}>
        <Cell label="List Item · Normal / Selected · 数字 · 箭头"><div style={{ width: 200 }}>
          <ListItem label="List name" count={55} expandable open /><ListItem label="List name" count={55} active /><ListItem label="List name" /><ListItem label="List name" expandable />
        </div></Cell>
        <Cell label="List（Title + Group + Divider）"><div style={{ width: 232 }}>
          <List title="Title">
            <ListGroup><ListItem label="List name" count={3} /><ListItem label="List name" count={1} active /><ListItem label="List name" count={2} /></ListGroup>
            <ListDivider label="test" />
            <ListGroup><ListItem label="List name" count={1} /><ListItem label="List name" count={1} /></ListGroup>
          </List>
        </div></Cell>
        <Cell label="ListItem 旧包扩展：图标 / 复选框 / 开关 / 描述"><div style={{ width: 260 }}>
          <ListItem icon="ri-file-line" label="With icon" /><ListItem checkbox="checked" label="Checkbox" /><ListItem label="Switch" switchOn />
          <ListItem label="With description" description="Secondary text" count={9} />
        </div></Cell>
        <Cell label="TreeList（可选中）"><div style={{ width: 240 }}><TreeList nodes={tree} defaultOpen={['a']} selectable defaultSelectedId="a1" /></div></Cell>
      </Sec>
      <Sec id="d-column" title="数据 · Column（Table 单元格）" nodes="356:875 337:1959 339:510" meta="Column Header 灰底 32、Column Body 32；6 种类型：Checkbox / Content / Selector / Status / Link / Actions" cols={200}>
        {colTypes.map((t) => <Cell key={t} label={`Column · ${t}`}><Column type={t} /></Cell>)}
      </Sec>
      <Sec id="d-table" title="数据 · Table 整表" nodes="356:875" meta="结构、排序（none→asc→desc）/ 筛选 / 勾选 / 列宽拖拽 / 分页沿用旧包；单元格用 Column 样式；溢出文字悬停显示全文" cols={640}>
        <Cell label="selectable + paginated（pageSize 5）"><div style={{ width: 600 }}><Table columns={tableCols} rows={tableRows} selectable paginated /></div></Cell>
        <Cell label="基础"><div style={{ width: 600 }}><Table columns={tableCols.slice(0, 3)} rows={tableRows.slice(0, 3)} /></div></Cell>
      </Sec>
      <Sec id="d-code" title="数据 · CodeEditor" nodes="" meta="沿用旧包结构；高亮色取 --wiz-agent-syntax-*（注释 / 字符串 / 关键字 / 宏 / 数字）；可编辑，Tab 缩进，点行号选行。主库无此组件" cols={560}>
        <Cell label="SAS"><div style={{ width: 520 }}><CodeEditor defaultValue={SAS} minHeight={240} /></div></Cell>
        <Cell label="readOnly"><div style={{ width: 520 }}><CodeEditor readOnly defaultValue={SAS} minHeight={200} /></div></Cell>
      </Sec>

      <Sec id="l-title" title="布局 · Title（旧包 TitleBar）" nodes="331:386" meta="无描述 52 / 有描述 64；有按钮 / 无按钮" cols={420}>
        <Cell label="Title · 默认（带按钮）"><div style={{ width: 684 }}><TitleBar title="Title" actions={<><Button leftIcon="ri-sparkling-2-line">Button</Button><Button variant="primary" leftIcon="ri-sparkling-2-fill">Button</Button></>} /></div></Cell>
        <Cell label="Title · 无按钮"><div style={{ width: 684 }}><TitleBar title="Title" /></div></Cell>
        <Cell label="Title · With Description（带按钮）"><div style={{ width: 684 }}><TitleBar title="Title" description="Description" actions={<><Button leftIcon="ri-sparkling-2-line">Button</Button><Button variant="primary" leftIcon="ri-sparkling-2-fill">Button</Button></>} /></div></Cell>
        <Cell label="Title · With Description 无按钮"><div style={{ width: 684 }}><TitleBar title="Title" description="Description" /></div></Cell>
      </Sec>
      <Sec id="l-split" title="布局 · Draggable Divider（旧包 Splitter）" nodes="337:1977" meta="默认 1px grey-40，悬停 / 拖动 2px 品牌蓝；10px 热区；← → 步长 16；aria-valuenow / min / max；面板上下限由父级 clamp（此处 120–320）" cols={420}>
        <Cell label="Default · 悬停 / 拖动 · 键盘"><SplitterDemo /></Cell>
        <Cell label="Default / Hover（强制）"><div className="row" style={{ height: 50, gap: 24 }}><Splitter aria-label="d" /><Splitter state="hover" aria-label="h" /></div></Cell>
      </Sec>
      <Sec id="l-card" title="布局 · Card" nodes="" meta="沿用旧包：圆角 16；elevation ring（1px 描边）/ card（--wiz-shadow-button）/ flat。主库无此组件" cols={220}>
        {(['ring', 'card', 'flat'] as const).map((e) => <Cell key={e} label={`elevation="${e}"`}><Card elevation={e} style={{ width: 200 }}>Card content</Card></Cell>)}
      </Sec>
      <Sec id="l-avatar" title="布局 · Avatar / 头像组（>4）" nodes="72:2276 82:701" agent meta="General 6 色（32，1px 白描边计入）；头像组 >4：重叠 12 + 「+N」。Agent Avatar 与 4 个以内的头像组暂不做" cols={300}>
        <Cell label="General · Black / BrandBlue / Green / Brown / Cyan / Purple"><div className="row">
          <Avatar color="black" initials="TM" /><Avatar color="brand-blue" initials="WJ" /><Avatar color="green" initials="OR" /><Avatar color="brown" initials="ZB" /><Avatar color="cyan" initials="PP" /><Avatar color="purple" initials="JJ" />
        </div></Cell>
        <Cell label="头像组 >4（共 8 个，显示 3 + +5）"><AvatarGroup items={[{ color: 'brand-blue', initials: 'WJ' }, { color: 'green', initials: 'OR' }, { color: 'purple', initials: 'JJ' }, { initials: 'A' }, { initials: 'B' }, { initials: 'C' }, { initials: 'D' }, { initials: 'E' }]} /></Cell>
        <Cell label="size=24 / 40"><div className="row"><Avatar initials="WJ" color="brand-blue" size={24} /><Avatar initials="WJ" color="brand-blue" size={40} /></div></Cell>
      </Sec>
    </>
  );
}
