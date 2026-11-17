import { useMemo, useState } from 'react';
import { Button, Dropdown, EmptyState, Status, Table, TitleBar, type TableColumn } from '@wiz/react';
import { DatasetCard, DatasetCardMore } from '@wiz/isp';
import { go } from '../../router';
import { hrefStudy } from '../../store/actions';
import { DS_CATS } from '../../store/assets';
import { SPACES, S } from '../../store/selectors';
import { useDb } from '../../store/store';
import { openDrawer, openModal, ui } from '../../store/ui';
import type { Dataset } from '../../store/types';
import { eventsLbl, PageHead, plural, RowMenu, SearchBox } from './common';
import { DatasetVersionDrawer } from './VersionDrawer';

const usedTxt = (d: Dataset) => { const n = S.dsUsers(d).length; return n ? eventsLbl(n) : '—'; };
const match = (d: Dataset, q: string) => { const n = q.trim().toLowerCase(); return !n || (d.name + ' ' + d.label).toLowerCase().includes(n); };

/** #/study/:sid/dataset：三个空间（Dummy / Synthetic / Prod）各显示前 3 个数据集卡 */
export function DatasetOverviewPage({ sid }: { sid: string }) {
  useDb();
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const cats = ['All', ...DS_CATS.filter((c) => S.datasetsOf(sid).some((d) => d.cat === c))];
  const open = (sp: string, id?: string) => go(hrefStudy(sid, 'dataset', sp), id ? { drawer: { kind: 'dsV', id } } : undefined);
  return (
    <div className="studies">
      <PageHead>
        <span className="page-title">Dataset</span>
        <span className="page-tools">
          <Dropdown size="medium" shadow="none" label={'Category: ' + cat} width={180} items={cats.map((t) => ({ label: t, value: t, selected: t === cat }))} onSelect={(v) => setCat(String(v))} />
          <SearchBox value={q} onChange={setQ} placeholder="Search datasets" />
          <Button variant="primary" leftIcon="ri-upload-2-line" onClick={() => openModal({ kind: 'uploadDataset', sid, dsId: null, mode: '' })}>Upload Dataset</Button>
        </span>
      </PageHead>
      <div className="page-scroll">
        {SPACES.map((sp) => {
          const all = S.datasetsOf(sid, sp.key), vis = all.filter((d) => (cat === 'All' || d.cat === cat) && match(d, q));
          return (
            <section key={sp.key} className="ds-sec" aria-label={sp.name + ' space'}>
              <div className="ds-sec__head">
                <i className="ri-database-2-line" aria-hidden="true" />{sp.name}
                <Status variant="style1" tone="grey" textCase="normal">{sp.badge}</Status>
                <span className="app-sm">{plural(all.length, 'dataset')}</span>
                <Button variant="link" size="small" rightIcon="ri-arrow-right-s-line" className="ds-sec__go" onClick={() => open(sp.key)}>Open</Button>
              </div>
              <div className="ds-grid">
                {vis.slice(0, 3).map((d) => (
                  <DatasetCard key={d.id} name={d.name} version={S.latest(d).label} description={d.label} footerLeft={`${d.cat}, ${plural(d.versions.length, 'version')}`} footerRight={usedTxt(d)} onOpen={() => open(sp.key, d.id)} />
                ))}
                {vis.length > 3 && <DatasetCardMore onOpen={() => open(sp.key)}>+ {vis.length - 3} more</DatasetCardMore>}
                {!vis.length && <DatasetCardMore height={44}>{all.length ? 'No datasets match' : 'No datasets in this space yet'}</DatasetCardMore>}
              </div>
            </section>
          );
        })}
      </div>
      {ui.drawer?.kind === 'dsV' && <DatasetVersionDrawer id={ui.drawer.id} />}
    </div>
  );
}

interface Row extends Dataset { }
/** #/study/:sid/dataset/:space：空间下钻，SDTM / ADaM 等按类别分组 */
export function DatasetSpacePage({ sid, space }: { sid: string; space: string }) {
  useDb();
  const sp = SPACES.find((s) => s.key === space);
  const [q, setQ] = useState('');
  const all = sp ? S.datasetsOf(sid, sp.key) : [];
  const rows: Row[] = DS_CATS.flatMap((c) => all.filter((d) => d.cat === c && match(d, q)));
  const columns = useMemo<TableColumn[]>(() => [
    { key: 'name', header: 'Dataset', render: (_v, d: Row) => (
      <span className="app-nm"><i className="ri-database-2-line" aria-hidden="true" /><span className="ds-name"><span className="app-mono app-ell">{d.name}</span><small className="app-ell">{d.label}</small></span></span>
    ) },
    { key: 'latest', header: 'Latest', width: 100, render: (_v, d: Row) => S.latest(d).label },
    { key: 'used', header: 'Used by', width: 190, render: (_v, d: Row) => <span className="app-sm">{usedTxt(d)}</span> },
    { key: 'upd', header: 'Updated', width: 90, render: (_v, d: Row) => <span className="app-sm">{S.latest(d).date}</span> },
    { key: 'more', header: '', width: 56, align: 'right', render: (_v, d: Row) => (
      <RowMenu label={d.name} items={[{ label: 'Open Versions', value: 'open' }, { label: 'Upload New Version', value: 'up' }, { label: 'Download…', value: 'dl', disabled: true }]}
        onSelect={(v) => { if (v === 'open') openDrawer({ kind: 'dsV', id: d.id }); if (v === 'up') openModal({ kind: 'uploadDataset', sid, dsId: d.id, mode: sp!.mode }); }} />
    ) },
  ], [sid, sp]);
  if (!sp) return <EmptyState title="Space not found" description={space} action={<Button onClick={() => go(hrefStudy(sid, 'dataset'))}>Back to Dataset</Button>} />;
  return (
    <div className="studies">
      <TitleBar title={<span className="app-inline">{sp.name}<Status variant="style1" tone="grey" textCase="normal">{sp.badge}</Status></span>} description="Add a description…" divider={false} />
      {all.length > 0 && <PageHead>
        <Button variant="link" leftIcon="ri-arrow-left-s-line" onClick={() => go(hrefStudy(sid, 'dataset'))}>Overview</Button>
        <span className="page-tools">
          <SearchBox value={q} onChange={setQ} placeholder="Search datasets" />
          <Button variant="primary" leftIcon="ri-upload-2-line" onClick={() => openModal({ kind: 'uploadDataset', sid, dsId: null, mode: sp.mode })}>Upload Dataset</Button>
        </span>
      </PageHead>}
      <div className="page-scroll">
        {rows.length === 0
          ? <EmptyState title={all.length ? 'No datasets match' : `No datasets in ${sp.name} yet`} description={all.length ? 'Clear the search.' : 'Upload a dataset and pick this mode explicitly.'}
              action={all.length ? undefined : <Button leftIcon="ri-upload-2-line" onClick={() => openModal({ kind: 'uploadDataset', sid, dsId: null, mode: sp.mode })}>Upload Dataset</Button>} />
          : <Table variant="plain" columnLayout="fixed" rowHeight={48} columns={columns} rows={rows} aria-label={sp.name + ' datasets'} groupBy={(d: Row) => d.cat}
              onRowClick={(d: Row) => openDrawer({ kind: 'dsV', id: d.id })} activeRow={(d: Row) => ui.drawer?.kind === 'dsV' && ui.drawer.id === d.id} />}
      </div>
      {ui.drawer?.kind === 'dsV' && <DatasetVersionDrawer id={ui.drawer.id} />}
    </div>
  );
}
