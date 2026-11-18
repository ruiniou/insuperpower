import { useMemo, useState } from 'react';
import { Button, Dropdown, Status, Table, type TableColumn } from '@wiz/react';
import { baselinesOf, baselineAsset, BL_CODES, BL_NAME, slotCarriedFrom } from '../../store/baseline';
import { S } from '../../store/selectors';
import { useDb } from '../../store/store';
import { openDrawer, openModal, ui } from '../../store/ui';
import type { Asset, BaselineCode } from '../../store/types';
import { eventsLbl, PageToolbar, RowMenu, SearchBox } from './common';
import { AssetVersionDrawer } from './VersionDrawer';

const ICON: Record<string, string> = { doc: 'ri-file-text-line', list: 'ri-list-check', shell: 'ri-table-line', code: 'ri-code-s-slash-line' };
const BL = 'Study Baseline', OTHER = 'Other assets';

/** 行类型：bh 当前 Baseline 标题；slot / slotph Protocol 与 SAP 槽位；earlier 折叠开关；eb 更早的 Baseline（只读）；asset / assetph 其他资产；none 筛选无结果 */
interface Row {
  grp: string; kind: 'bh' | 'slot' | 'slotph' | 'earlier' | 'eb' | 'asset' | 'assetph' | 'none';
  a?: Asset; n?: number; code?: string; label?: string; by?: string; date?: string; summary?: string; from?: string | null; count?: number; open?: boolean;
}

const nameCell = (r: Row, indent = false) => {
  const cls = 'app-nm' + (indent ? ' app-indent' : '');
  if (r.kind === 'slotph' || r.kind === 'assetph') return <span className={cls + ' app-muted'}><i className={ICON.doc} aria-hidden="true" /><span className="app-ell">Not uploaded</span></span>;
  return <span className={cls}><i className={ICON[r.a!.icon] || ICON.doc} aria-hidden="true" /><span className="app-ell">{r.a!.name}</span></span>;
};

/** #/study/:sid/asset：Study Baseline（Protocol 与 SAP 的版本组合）+ Other assets 表；点资产行开版本抽屉 */
export function AssetPage({ sid }: { sid: string }) {
  useDb();
  const [tp, setTp] = useState('All');
  const [q, setQ] = useState('');
  const [earlierOpen, setEarlierOpen] = useState(false);
  const isOther = (a: Asset) => !BL_CODES.includes(a.code as BaselineCode);
  const real = S.assetsOf(sid).filter(isOther), ph = S.placeholdersOf(sid).filter(isOther);
  const types = ['All', ...Array.from(new Set(real.map((a) => a.tl)))];
  const needle = q.trim().toLowerCase();
  const vis = real.filter((a) => (tp === 'All' || a.tl === tp) && (!needle || (a.name + ' ' + a.tl).toLowerCase().includes(needle)));
  const phVis = ph.filter((p) => (tp === 'All' || p.tl === tp) && !needle);

  const list = baselinesOf(sid), cur = list[0], earlier = list.slice(1);
  const rows: Row[] = [];
  if (cur) rows.push({ grp: BL, kind: 'bh', label: cur.label, by: cur.by, date: cur.date });
  BL_CODES.forEach((code) => {
    const slot = cur?.slots[code], a = slot ? S.asset(slot.assetId) : undefined;
    if (cur && slot && a) rows.push({ grp: BL, kind: 'slot', a, n: slot.n, code, from: slotCarriedFrom(list, 0, code) });
    else rows.push({ grp: BL, kind: 'slotph', a: baselineAsset(sid, code) ?? ({ code, tl: BL_NAME[code] } as Asset), code });
  });
  if (earlier.length) {
    rows.push({ grp: BL, kind: 'earlier', count: earlier.length, open: earlierOpen });
    if (earlierOpen) earlier.forEach((b) => rows.push({ grp: BL, kind: 'eb', label: b.label, date: b.date, by: b.by,
      summary: BL_CODES.filter((c) => b.slots[c]).map((c) => { const s = b.slots[c]!; return BL_NAME[c] + ' ' + (S.vOf(S.asset(s.assetId)!, s.n)?.label ?? ''); }).join(', ') }));
  }
  if (real.length) {
    if (vis.length + phVis.length) { vis.forEach((a) => rows.push({ grp: OTHER, kind: 'asset', a })); phVis.forEach((p) => rows.push({ grp: OTHER, kind: 'assetph', a: p, code: p.code })); }
    else rows.push({ grp: OTHER, kind: 'none' });
  } else phVis.forEach((p) => rows.push({ grp: OTHER, kind: 'assetph', a: p, code: p.code }));

  const upload = (code: string, assetId: string | null = null) => openModal({ kind: 'uploadAsset', sid, assetId, code });
  const columns = useMemo<TableColumn[]>(() => [
    { key: 'name', header: 'Name', render: (_v, r: Row) => {
      if (r.kind === 'bh') return <span className="app-inline"><span className="app-nm">{r.label}</span><Status variant="style1" tone="blue" textCase="normal">Current</Status></span>;
      if (r.kind === 'earlier') return <Button variant="link" size="small" leftIcon={r.open ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'} aria-expanded={r.open} onClick={() => setEarlierOpen((o) => !o)}>Earlier baselines ({r.count})</Button>;
      if (r.kind === 'eb') return <span className="app-inline app-indent"><span className="app-nm">{r.label}</span><span className="app-muted app-ell">{r.summary}</span></span>;
      if (r.kind === 'none') return <span className="app-muted">No assets match</span>;
      return nameCell(r, r.kind === 'slot' || r.kind === 'slotph');
    } },
    { key: 'tl', header: 'Type', width: 100, render: (_v, r: Row) => (r.a && (r.kind === 'slot' || r.kind === 'slotph' || r.kind === 'asset' || r.kind === 'assetph') ? r.a.tl : '') },
    { key: 'ver', header: 'Version', width: 200, render: (_v, r: Row) => {
      if (r.kind === 'slotph' || r.kind === 'assetph') return <span className="app-muted">—</span>;
      if (r.kind === 'slot') { const v = S.vOf(r.a!, r.n!)!; return r.from ? <span className="app-muted app-ell">{v.label} from {r.from}</span> : <span className="app-ell">{v.label}</span>; }
      if (r.kind === 'asset') return S.latest(r.a!).label;
      return '';
    } },
    { key: 'source', header: 'Source', width: 220, render: (_v, r: Row) => (r.kind === 'bh' || r.kind === 'eb' ? <span className="app-muted">{r.by}</span> : r.kind === 'slotph' || r.kind === 'assetph' ? 'Required' : r.kind === 'slot' || r.kind === 'asset' ? r.a!.source : '') },
    { key: 'used', header: 'Used by', width: 220, render: (_v, r: Row) => {
      if (r.kind === 'slotph' || r.kind === 'assetph') return <span className="app-muted">—</span>;
      if (r.kind === 'slot') { const c = S.assetUsers(r.a!, r.n).length; return c ? eventsLbl(c) : '—'; }
      if (r.kind === 'asset') {
        const lv = S.latest(r.a!), users = S.assetUsers(r.a!), behind = users.filter((e) => e.refs.assets[r.a!.id].v < lv.n).length;
        return <span className="app-inline">{users.length ? eventsLbl(users.length) : '—'}{behind > 0 && <Status variant="style1" tone="yellow" textCase="normal">{behind} behind</Status>}</span>;
      }
      return '';
    } },
    { key: 'upd', header: 'Updated', width: 80, render: (_v, r: Row) => {
      if (r.kind === 'slotph' || r.kind === 'assetph') return <span className="app-muted">—</span>;
      if (r.kind === 'bh' || r.kind === 'eb') return r.date;
      if (r.kind === 'slot') return S.vOf(r.a!, r.n!)!.date;
      if (r.kind === 'asset') return S.latest(r.a!).date;
      return '';
    } },
    { key: 'more', header: '', width: 96, align: 'right', render: (_v, r: Row) => {
      if (r.kind === 'slotph' || r.kind === 'assetph') return <Button variant="link" size="small" leftIcon="ri-upload-2-line" onClick={() => upload(r.code!)}>Upload</Button>;
      if (r.kind === 'slot') return <RowMenu label={r.a!.name} items={[{ label: 'Open Versions', value: 'open' }, { label: 'Upload New Version', value: 'up' }]}
        onSelect={(v) => { if (v === 'open') openDrawer({ kind: 'assetV', id: r.a!.id, n: r.n }); if (v === 'up') upload(r.a!.code, r.a!.id); }} />;
      if (r.kind === 'asset') return <RowMenu label={r.a!.name} items={[{ label: 'Open Versions', value: 'open' }, { label: 'Upload New Version', value: 'up' }, { label: 'Download…', value: 'dl', disabled: true }]}
        onSelect={(v) => { if (v === 'open') openDrawer({ kind: 'assetV', id: r.a!.id }); if (v === 'up') upload(r.a!.code, r.a!.id); }} />;
      return null;
    } },
  ], [sid]);

  const clickable = (r: Row) => r.kind === 'slot' || r.kind === 'asset';
  const isActive = (r: Row) => clickable(r) && ui.drawer?.kind === 'assetV' && ui.drawer.id === r.a!.id && (r.kind === 'asset' || ui.drawer.n == null || ui.drawer.n === r.n);
  return (
    <div className="studies">
      <PageToolbar
        filters={<Dropdown size="medium" shadow="none" filterName="Type" label={tp} width={180} items={types.map((t) => ({ label: t, value: t, selected: t === tp }))} onSelect={(v) => setTp(String(v))} />}
        search={<SearchBox value={q} onChange={setQ} placeholder="Search assets" />}
        actions={<Button variant="primary" leftIcon="ri-upload-2-line" onClick={() => upload('')}>Upload File</Button>} />
      <div className="page-scroll">
        <Table variant="plain" columnLayout="fixed" rowHeight={48} columns={columns} rows={rows} aria-label="Assets" groupBy={(r: Row) => r.grp} renderGroup={(g) => g}
          onRowClick={(r: Row) => openDrawer({ kind: 'assetV', id: r.a!.id, n: r.kind === 'slot' ? r.n : undefined })} rowClickable={clickable} activeRow={isActive} />
      </div>
      {ui.drawer?.kind === 'assetV' && <AssetVersionDrawer id={ui.drawer.id} n={ui.drawer.n} />}
    </div>
  );
}
