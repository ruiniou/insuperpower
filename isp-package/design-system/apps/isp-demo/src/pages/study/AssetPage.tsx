import { useMemo, useState } from 'react';
import { Button, Dropdown, EmptyState, Status, Table, type TableColumn } from '@wiz/react';
import { CAT_ORDER } from '../../store/assets';
import { catOf, S } from '../../store/selectors';
import { useDb } from '../../store/store';
import { openDrawer, openModal, ui } from '../../store/ui';
import type { Asset } from '../../store/types';
import { eventsLbl, PageHead, RowMenu, SearchBox } from './common';
import { AssetVersionDrawer } from './VersionDrawer';

const ICON: Record<string, string> = { doc: 'ri-file-text-line', list: 'ri-list-check', shell: 'ri-table-line', code: 'ri-code-s-slash-line' };
interface Row { a: Asset; cat: string; ph: boolean }

/** #/study/:sid/asset：按 Category 分组的 Asset 表，含 Not uploaded · Required 占位行；点行开版本抽屉 */
export function AssetPage({ sid }: { sid: string }) {
  useDb();
  const [cat, setCat] = useState('All');
  const [tp, setTp] = useState('All');
  const [q, setQ] = useState('');
  const real = S.assetsOf(sid), ph = S.placeholdersOf(sid);
  const cats = ['All', ...CAT_ORDER.filter((c) => real.some((a) => catOf(a) === c))];
  const types = ['All', ...Array.from(new Set(real.map((a) => a.tl)))];
  const needle = q.trim().toLowerCase();
  const vis = real.filter((a) => (cat === 'All' || catOf(a) === cat) && (tp === 'All' || a.tl === tp) && (!needle || (a.name + ' ' + a.tl).toLowerCase().includes(needle)));
  const phVis = (tp === 'All' || ph.some((p) => p.tl === tp)) ? ph.filter((p) => (cat === 'All' || catOf(p) === cat) && (tp === 'All' || p.tl === tp) && !needle) : [];
  const rows: Row[] = CAT_ORDER.flatMap((c) => [
    ...vis.filter((a) => catOf(a) === c).map((a) => ({ a, cat: c, ph: false })),
    ...phVis.filter((p) => catOf(p) === c).map((p) => ({ a: p, cat: c, ph: true })),
  ]);

  const columns = useMemo<TableColumn[]>(() => [
    { key: 'name', header: 'Name', render: (_v, r: Row) => r.ph
      ? <span className="app-nm app-muted"><i className={ICON[r.a.icon] || ICON.doc} aria-hidden="true" /><span className="app-ell">Not uploaded</span></span>
      : <span className="app-nm"><i className={ICON[r.a.icon] || ICON.doc} aria-hidden="true" /><span className="app-ell">{r.a.name}</span></span> },
    { key: 'tl', header: 'Type', width: 100, render: (_v, r: Row) => r.a.tl },
    { key: 'ver', header: 'Version', width: 160, render: (_v, r: Row) => {
      if (r.ph) return <span className="app-muted">—</span>;
      const lv = S.latest(r.a);
      return <span className="app-inline">{lv.label}{lv.status === 'Official' && <Status variant="style1" tone="blue" textCase="normal">Official</Status>}{lv.status === 'Draft' && <Status variant="style1" tone="grey" textCase="normal">Draft</Status>}</span>;
    } },
    { key: 'source', header: 'Source', width: 220, render: (_v, r: Row) => (r.ph ? 'Required' : r.a.source) },
    { key: 'used', header: 'Used by', width: 220, render: (_v, r: Row) => {
      if (r.ph) return <span className="app-muted">—</span>;
      const lv = S.latest(r.a), users = S.assetUsers(r.a), behind = users.filter((e) => e.refs.assets[r.a.id].v < lv.n).length;
      return <span className="app-inline">{users.length ? eventsLbl(users.length) : '—'}{behind > 0 && <Status variant="style1" tone="yellow" textCase="normal">{behind} behind</Status>}</span>;
    } },
    { key: 'upd', header: 'Updated', width: 80, render: (_v, r: Row) => (r.ph ? <span className="app-muted">—</span> : S.latest(r.a).date) },
    { key: 'more', header: '', width: 96, align: 'right', render: (_v, r: Row) => r.ph
      ? <Button variant="link" size="small" leftIcon="ri-upload-2-line" onClick={() => openModal({ kind: 'uploadAsset', sid, assetId: null, code: r.a.code })}>Upload</Button>
      : <RowMenu label={r.a.name} items={[{ label: 'Open Versions', value: 'open' }, { label: 'Upload New Version', value: 'up' }, { label: 'Download…', value: 'dl', disabled: true }]}
          onSelect={(v) => { if (v === 'open') openDrawer({ kind: 'assetV', id: r.a.id }); if (v === 'up') openModal({ kind: 'uploadAsset', sid, assetId: r.a.id, code: r.a.code }); }} /> },
  ], [sid]);

  return (
    <div className="studies">
      <PageHead>
        <span className="page-tools">
          <Dropdown size="medium" shadow="none" label={'Category: ' + cat} width={200} items={cats.map((t) => ({ label: t, value: t, selected: t === cat }))} onSelect={(v) => setCat(String(v))} />
          <Dropdown size="medium" shadow="none" label={'Type: ' + tp} width={180} items={types.map((t) => ({ label: t, value: t, selected: t === tp }))} onSelect={(v) => setTp(String(v))} />
        </span>
        <SearchBox value={q} onChange={setQ} placeholder="Search assets" />
      </PageHead>
      <div className="page-scroll">
        {rows.length === 0
          ? <EmptyState title={real.length ? 'No assets match' : 'No assets yet'} description={real.length ? 'Clear the filters or search.' : 'Upload a Protocol, SAP, CRF or other study file to get started.'}
              action={real.length ? undefined : <Button leftIcon="ri-upload-2-line" onClick={() => openModal({ kind: 'uploadAsset', sid, assetId: null, code: '' })}>Upload File</Button>} />
          : <Table variant="plain" columnLayout="fixed" rowHeight={48} columns={columns} rows={rows} aria-label="Assets" groupBy={(r: Row) => r.cat}
              onRowClick={(r: Row) => openDrawer({ kind: 'assetV', id: r.a.id })} rowClickable={(r: Row) => !r.ph}
              activeRow={(r: Row) => !r.ph && ui.drawer?.kind === 'assetV' && ui.drawer.id === r.a.id} />}
      </div>
      {ui.drawer?.kind === 'assetV' && <AssetVersionDrawer id={ui.drawer.id} />}
    </div>
  );
}
