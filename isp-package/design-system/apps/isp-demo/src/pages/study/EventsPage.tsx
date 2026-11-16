import { useMemo, useState } from 'react';
import { Button, Dropdown, EmptyState, SegmentedControl, Status, Table, type TableColumn } from '@wiz/react';
import { go } from '../../router';
import { hrefEvent } from '../../store/actions';
import { S } from '../../store/selectors';
import { useDb } from '../../store/store';
import { openModal } from '../../store/ui';
import type { EventRec } from '../../store/types';
import { Owner, PageHead, RowMenu, SearchBox, soon } from './common';

/** #/study/:sid/events：Events 列表（Status 筛选、搜索、列表视图；卡片视图原型标注未设计） */
export function EventsPage({ sid }: { sid: string }) {
  useDb();
  const [st, setSt] = useState('All');
  const [q, setQ] = useState('');
  const all = S.eventsOf(sid);
  const sts = ['All', ...Array.from(new Set(all.map((e) => e.status)))];
  const needle = q.trim().toLowerCase();
  const rows = all.filter((e) => (st === 'All' || e.status === st) && (!needle || (e.name + ' ' + e.owner).toLowerCase().includes(needle)));
  const open = (id: string) => go(hrefEvent(id, 'overview'));

  const columns = useMemo<TableColumn[]>(() => [
    { key: 'name', header: 'Event', render: (_v, e: EventRec) => <span className="app-nm"><i className="ri-flow-chart" aria-hidden="true" /><span className="app-ell">{e.name}</span></span> },
    { key: 'status', header: 'Status', width: 120, render: (v) => <Status variant="style1" tone="grey" textCase="normal">{v}</Status> },
    { key: 'owner', header: 'Event Owner', width: 170, render: (_v, e: EventRec) => <Owner name={e.owner} /> },
    { key: 'wfs', header: 'Workflows', width: 170, render: (_v, e: EventRec) => <span className="app-inline">{S.nWf(e)}{S.nStale(e) > 0 && <Status variant="style1" tone="yellow" textCase="normal">{S.nStale(e)} Outdated</Status>}</span> },
    { key: 'adopted', header: 'Adopted', width: 190, render: (v) => (v === '—' ? <span className="app-muted">—</span> : v) },
    { key: 'updated', header: 'Updated', width: 130, render: (v) => <span className="app-muted">{v}</span> },
    { key: 'more', header: '', width: 56, render: (_v, e: EventRec) => (
      <RowMenu label={e.name} onSelect={(v) => { if (v === 'open') open(e.id); }}
        items={[{ label: 'Open Event', value: 'open' }, ...['Manage members', 'Hand over Owner', 'Copy as branch', 'Archive Event'].map((l) => ({ label: l, value: l, disabled: true }))]} />
    ) },
  ], []);

  return (
    <div className="studies">
      <PageHead>
        <Dropdown size="medium" shadow="none" label={'Status: ' + st} width={180} items={sts.map((t) => ({ label: t, value: t, selected: t === st }))} onSelect={(v) => setSt(String(v))} />
        <span className="page-tools">
          <SearchBox value={q} onChange={setQ} placeholder="Search events" />
          <SegmentedControl variant="boxed" aria-label="View" value="list" onChange={soon('Card view')}
            items={[{ value: 'list', icon: 'ri-list-check', 'aria-label': 'List view' }, { value: 'card', icon: 'ri-layout-grid-line', 'aria-label': 'Card view', disabled: true }]} />
        </span>
      </PageHead>
      <div className="page-scroll">
        {rows.length === 0
          ? <EmptyState title={all.length ? 'No events match' : 'No events yet'} description={all.length ? 'Clear the filter or search.' : 'Create an Event to start an analysis.'}
              action={all.length ? undefined : <Button variant="primary" leftIcon="ri-add-line" onClick={() => openModal({ kind: 'createEvent', sid })}>New Event</Button>} />
          : <Table variant="plain" columnLayout="fixed" rowHeight={48} columns={columns} rows={rows} aria-label="Events" onRowClick={(r: EventRec) => open(r.id)} />}
      </div>
    </div>
  );
}
