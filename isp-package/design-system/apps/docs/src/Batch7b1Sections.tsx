import { useState, type ReactNode } from 'react';
import {
  Avatar, Button, Card, Dropdown, Popover, Search, SegmentedControl, SideBarTabs, Status, Table,
  type TableColumn, type TableRowHeight,
} from '@wiz/react';

/** 批 7b-1：试点暴露的通用缺口。规格以交付包原型 / 手册为准（Wiz 文件无设计），将来补稿后对稿 */
function Sec({ id, title, meta, cols = 320, children }: { id: string; title: string; meta: string; cols?: number; children: ReactNode }) {
  return (
    <section id={id}>
      <h2>{title}</h2>
      <p className="meta">{meta}</p>
      <div className="grid" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${cols}px, 1fr))` }}>{children}</div>
    </section>
  );
}
const Cell = ({ label, children }: { label: string; children: ReactNode }) => (<div className="cell"><code>{label}</code>{children}</div>);

const cols: TableColumn[] = [
  { key: 'id', header: 'Study ID', width: 120 },
  { key: 'name', header: 'Study Name' },
  { key: 'st', header: 'Status', width: 110, render: (v) => <Status variant="style2" tone={v === 'Active' ? 'green' : 'grey'}>{v}</Status> },
  { key: 'o', header: 'Owner', width: 140, render: (v) => <span className="row" style={{ gap: 6 }}><Avatar size={20} color="brand-blue" initials={String(v).slice(0, 2)} />{v}</span> },
];
const rows = [
  { id: 'STU-001', name: 'Phase II oncology', st: 'Active', o: 'Wang Jun' },
  { id: 'STU-002', name: 'Cardio outcomes', st: 'Closed', o: 'Olivia Reed' },
  { id: 'STU-003', name: 'Dermatology', st: 'Active', o: 'Zoe Brown' },
];

function TableDemo() {
  const [h, setH] = useState<TableRowHeight>(48);
  const [clicked, setClicked] = useState('—');
  const [sel, setSel] = useState<number[]>([1]);
  return (
    <>
      <Cell label="plain + rowHeight + onRowClick（整行可点）">
        <div className="row" style={{ marginBottom: 8 }}>
          <SegmentedControl aria-label="Row height" value={String(h)} onChange={(v) => setH(Number(v) as TableRowHeight)} items={['32', '40', '48', '56'].map((x) => ({ value: x, label: x }))} />
          <span>点击：{clicked}</span>
        </div>
        <div data-measure="table-plain" style={{ width: 640 }}><Table variant="plain" rowHeight={h} columns={cols} rows={rows} onRowClick={(r) => setClicked(r.id)} aria-label="plain table" /></div>
      </Cell>
      <Cell label="default + 受控选中（selectedRows）">
        <div style={{ width: 640 }}><Table selectable selectedRows={sel} onSelectionChange={setSel} columns={cols} rows={rows} aria-label="selectable table" /></div>
        <div className="row" style={{ marginTop: 8 }}><Button size="small" onClick={() => setSel([0, 1, 2])}>全选</Button><Button size="small" onClick={() => setSel([])}>清空</Button><span>selectedRows = [{sel.join(', ')}]</span></div>
      </Cell>
    </>
  );
}

export function Batch7b1Sections() {
  const [view, setView] = useState('list');
  const [pill, setPill] = useState('all');
  const [q, setQ] = useState('');
  return (
    <>
      <Sec id="b7-table" title="7b-1 · Table 增强" cols={680} meta="onRowClick / rowHeight（32·40·48·56）/ selectedRows 受控 / variant=plain；单元格 memo；CSS 变量钩子 --wiz-table-row-height、-head-height、-head-bg、-row-hover-bg、-edge-padding">
        <TableDemo />
      </Sec>
      <Sec id="b7-seg" title="7b-1 · SegmentedControl" cols={300} meta="原型 .seg / .segs：高 32、圆角 8、选中灰底；text（文字 + 图标）与 boxed（图标，外框计入 32）；← → 切换">
        <Cell label="boxed · 图标"><SegmentedControl variant="boxed" aria-label="View" value={view} onChange={setView} items={[{ value: 'list', icon: 'ri-list-check', 'aria-label': 'List' }, { value: 'card', icon: 'ri-layout-grid-line', 'aria-label': 'Cards' }]} /></Cell>
        <Cell label="boxed · 含禁用"><SegmentedControl variant="boxed" aria-label="V2" defaultValue="a" items={[{ value: 'a', icon: 'ri-list-check', 'aria-label': 'A' }, { value: 'b', icon: 'ri-layout-grid-line', 'aria-label': 'B', disabled: true }]} /></Cell>
        <Cell label="text · 文字"><SegmentedControl aria-label="Filter" value={pill} onChange={setPill} items={[{ value: 'all', label: 'All' }, { value: 'mine', label: 'Mine' }, { value: 'shared', label: 'Shared' }]} /></Cell>
        <Cell label="text · 图标 + 文字"><SegmentedControl aria-label="Review view" defaultValue="doc" items={[{ value: 'doc', icon: 'ri-file-text-line', label: 'Document' }, { value: 'diff', icon: 'ri-git-merge-line', label: 'Changes' }]} /></Cell>
      </Sec>
      <Sec id="b7-search" title="7b-1 · Search 展开形态" cols={300} meta="collapsible：图标按钮 → 点击展开并聚焦 → 失焦且为空收起（有内容保持展开）；size=compact 高 32">
        <Cell label="collapsible · 收起"><Search collapsible size="compact" aria-label="Find A" /></Cell>
        <Cell label="collapsible · 默认展开"><Search collapsible defaultExpanded size="compact" width={220} aria-label="Find B" placeholder="Search studies" /></Cell>
        <Cell label="collapsible · 受控（有值保持展开）"><Search collapsible size="compact" width={220} aria-label="Find C" placeholder="Search studies" value={q} onChange={(e) => setQ(e.target.value)} /></Cell>
        <Cell label="size=default 40 / compact 32"><div className="row"><Search width={160} aria-label="d" placeholder="Default" /><Search size="compact" width={160} aria-label="c" placeholder="Compact" /></div></Cell>
      </Sec>
      <Sec id="b7-popover" title="7b-1 · Popover（带箭头）" cols={360} meta="原型 .pop / .tail / .cfmb：圆角 12，箭头 10×10；arrow up / down / none；头 / 体 / 脚插槽；variant confirm = 确认气泡">
        <Cell label="panel · arrow=up（气泡在锚点下方）"><div style={{ height: 200, paddingTop: 8 }}><Popover inline arrow="up" arrowOffset={40} title="Generate Shell" extra={<Status tone="yellow">Update available</Status>} footer={<><Button variant="primary" size="small">Update</Button><Button size="small">All workflows</Button></>}><div>Inputs · TOC v2</div><div>Output · Shell</div></Popover></div></Cell>
        <Cell label="panel · arrow=down"><div style={{ height: 200, paddingBottom: 8 }}><Popover inline arrow="down" arrowOffset={40} title="Generate Shell" extra={<Status tone="green">Up to date</Status>} footer={<Button size="small">All workflows</Button>}><div>Inputs · TOC v2</div></Popover></div></Cell>
        <Cell label="panel · arrow=none · width=240"><Popover inline arrow="none" width={240} title="No arrow">body</Popover></Cell>
        <Cell label="confirm · arrow=up"><div style={{ paddingTop: 8 }}><Popover inline variant="confirm" arrow="up" arrowOffset={280} footer={<><Button size="small">Cancel</Button><Button variant="primary" size="small">Replace</Button></>}>Replacing this file will mark downstream outputs as stale. Continue?</Popover></div></Cell>
      </Sec>
      <Sec id="b7-hooks" title="7b-1 · SideBar 选中态 / Avatar 缩放 / 钩子" cols={300} meta="SideBar selectedTone solid | soft；Avatar 字号随 size 等比；Button block / shadow=none；Card interactive">
        <Cell label="SideBarTabs · solid（默认）"><div style={{ width: 170 }}><SideBarTabs icon="ri-folder-3-line" label="Studies" active /><SideBarTabs icon="ri-flow-chart" label="Events" /></div></Cell>
        <Cell label="SideBarTabs · soft"><div style={{ width: 170 }}><SideBarTabs icon="ri-folder-3-line" label="Studies" active selectedTone="soft" /><SideBarTabs icon="ri-flow-chart" label="Events" selectedTone="soft" /></div></Cell>
        <Cell label="Avatar size 20 / 24 / 32 / 40 / 56"><div className="row">{[20, 24, 32, 40, 56].map((n) => <Avatar key={n} size={n} color="brand-blue" initials="WJ" />)}</div></Cell>
        <Cell label="Button block + shadow=none（卡片内）"><Card padding={16} style={{ width: 240 }}><div style={{ display: 'grid', gap: 8 }}><Button block variant="primary">Start</Button><Button block shadow="none">Cancel</Button></div></Card></Cell>
        <Cell label="Dropdown shadow=none / default"><div className="row"><Dropdown shadow="none" label="TA: All" items={[{ label: 'All', value: 'all' }]} /><Dropdown label="TA: All" items={[{ label: 'All', value: 'all' }]} /></div></Cell>
        <Cell label="Card interactive"><Card interactive padding={16} style={{ width: 240 }}>悬停 / 聚焦可见</Card></Cell>
      </Sec>
    </>
  );
}
