import { useMemo, useState } from 'react';
import { Button, EmptyState, IconButton, SegmentedControl, Table, type TableColumn } from '@wiz/react';
import { go } from '../../router';
import { hrefStudy } from '../../store/actions';
import { DS_CATS } from '../../store/assets';
import { cutOf, SPACES, S } from '../../store/selectors';
import { isWritable } from '../../store/role';
import { canViewStudyPermissions } from '../../store/studyPermissions';
import { useDb } from '../../store/store';
import { openDrawer, openModal, ui } from '../../store/ui';
import type { Dataset } from '../../store/types';
import { eventsLbl, PageToolbar, RowMenu, SearchBox } from './common';
import { DatasetVersionDrawer } from './VersionDrawer';

const usedTxt = (d: Dataset) => { const n = S.dsUsers(d).length; return n ? eventsLbl(n) : '—'; };
const match = (d: Dataset, q: string) => { const n = q.trim().toLowerCase(); return !n || (d.name + ' ' + d.label).toLowerCase().includes(n); };

/** #/study/:sid/dataset[/:space]：一张列表页，Mode 是工具栏分段切换（路由里的 space 决定当前值，默认 Dummy），Type 作分组 */
export function DatasetPage({ sid, space }: { sid: string; space: string | null }) {
  useDb();
  const writable = isWritable(sid);
  const [q, setQ] = useState('');
  const sp = SPACES.find((s) => s.key === space) ?? SPACES[0];
  const total = S.datasetsOf(sid).length;
  const rows = DS_CATS.flatMap((c) => S.datasetsOf(sid, sp.key).filter((d) => d.cat === c && match(d, q)));
  const upload = (dsId: string | null) => openModal({ kind: 'uploadDataset', sid, dsId, mode: sp.mode });
  const columns = useMemo<TableColumn[]>(() => [
    { key: 'name', header: 'Dataset', render: (_v, d: Dataset) => (
      <span className="app-nm"><i className="ri-database-2-line" aria-hidden="true" /><span className="ds-name"><span className="app-mono app-ell">{d.name}</span><small className="app-ell">{d.label}</small></span></span>
    ) },
    { key: 'ver', header: 'Version', width: 140, render: (_v, d: Dataset) => S.latest(d).label },
    { key: 'cut', header: 'Cut', width: 140, render: (_v, d: Dataset) => cutOf(S.latest(d)) || '—' },
    { key: 'used', header: 'Used by', width: 190, render: (_v, d: Dataset) => <span className="app-sm">{usedTxt(d)}</span> },
    { key: 'upd', header: 'Updated', width: 110, render: (_v, d: Dataset) => <span className="app-sm">{S.latest(d).date}</span> },
    { key: 'more', header: '', width: 56, align: 'right', render: (_v, d: Dataset) => writable
      ? <RowMenu label={d.name} items={[{ label: 'Open versions', value: 'open' }, { label: 'Upload new version', value: 'up' }]}
          onSelect={(v) => { if (v === 'open') openDrawer({ kind: 'dsV', id: d.id }); if (v === 'up') upload(d.id); }} />
      : <RowMenu label={d.name} items={[{ label: 'Open versions', value: 'open' }]}
          onSelect={(v) => { if (v === 'open') openDrawer({ kind: 'dsV', id: d.id }); }} /> },
  ], [sid, sp.mode, writable]);
  const here = S.datasetsOf(sid, sp.key).length;
  const uploadDatasetButton = writable && <Button variant="primary" leftIcon="ri-upload-2-line" onClick={() => upload(null)}>Upload Dataset</Button>;
  const permissions = canViewStudyPermissions(sid) && <IconButton icon="ri-shield-user-line" variant="outline"
    aria-label="Study Permissions" onClick={() => go(hrefStudy(sid, 'dataset', 'permissions:' + sp.key))} />;
  return (
    <div className="studies">
      {(total > 0 || permissions) && <PageToolbar
        filters={total > 0 && <SegmentedControl aria-label="Dataset mode" items={SPACES.map((s) => ({ value: s.key, label: s.name }))} value={sp.key} onChange={(v) => go(hrefStudy(sid, 'dataset', v))} />}
        search={here > 0 && <SearchBox value={q} onChange={setQ} placeholder="Search datasets" />}
        actions={<>{here > 0 && uploadDatasetButton}{permissions}</>} />}
      <div className="page-scroll">
        {rows.length === 0
          ? <EmptyState title={total === 0 ? 'No datasets yet' : here ? 'No datasets match' : `No ${sp.name} datasets yet`}
              description={total === 0 ? 'Upload a dataset and pick its mode explicitly.' : here ? 'Clear the search.' : 'Upload a dataset in this mode.'}
              action={here === 0 ? uploadDatasetButton || undefined : undefined} />
          : <Table variant="plain" columnLayout="fixed" rowHeight={48} columns={columns} rows={rows} aria-label={sp.name + ' datasets'} groupBy={(d: Dataset) => d.cat}
              onRowClick={(d: Dataset) => openDrawer({ kind: 'dsV', id: d.id })} activeRow={(d: Dataset) => ui.drawer?.kind === 'dsV' && ui.drawer.id === d.id} />}
      </div>
      {ui.drawer?.kind === 'dsV' && <DatasetVersionDrawer id={ui.drawer.id} />}
    </div>
  );
}
