import { useMemo, useState } from 'react';
import { Button, Dropdown, EmptyState, MemberSelect, Status, Table, type TableColumn } from '@wiz/react';
import { ICON } from '../../icons';
import { go } from '../../router';
import { hrefEvent } from '../../store/actions';
import { S } from '../../store/selectors';
import { can, session } from '../../store/role';
import { useDb } from '../../store/store';
import { peopleOf, transferEventOwner } from '../../store/study';
import { openModal } from '../../store/ui';
import type { EventRec } from '../../store/types';
import { initials, Owner, PageHead, RowMenu, SearchBox, soon } from './common';

/** #/study/:sid/events：Events 列表（Status 筛选、搜索、列表视图；卡片视图原型标注未设计） */
export function EventsPage({ sid }: { sid: string }) {
  useDb();
  const canCreate = can('event.create', { study: S.study(sid) });
  const duty = session.duty;
  const [st, setSt] = useState('All');
  const [q, setQ] = useState('');
  const all = S.eventsOf(sid);
  const sts = ['All', ...Array.from(new Set(all.map((e) => e.status)))];
  const needle = q.trim().toLowerCase();
  const rows = all.filter((e) => (st === 'All' || e.status === st) && (!needle || (e.name + ' ' + e.owner).toLowerCase().includes(needle)));
  const open = (id: string) => go(hrefEvent(id, 'overview'));

  const columns = useMemo<TableColumn[]>(() => [
    { key: 'name', header: 'Event', render: (_v, e: EventRec) => <span className="app-nm"><i className={ICON.event} aria-hidden="true" /><span className="app-ell">{e.name}</span></span> },
    { key: 'status', header: 'Status', width: 120, render: (v) => <Status variant="style1" tone="grey" textCase="normal">{v}</Status> },
    { key: 'owner', header: 'Event Owner', width: 170, render: (_v, e: EventRec) => (can('event.owner.transfer', { event: e })
      ? <MemberSelect variant="inline" size="small" aria-label={`Event Owner of ${e.name}`} value={e.owner} options={peopleOf(sid).map((n) => ({ value: n, name: n, initials: initials(n) }))} onChange={(v) => transferEventOwner(e.id, v)} />
      : <Owner name={e.owner} />) },
    { key: 'wfs', header: 'Workflows', width: 170, render: (_v, e: EventRec) => <span className="app-inline">{S.nWf(e)}{S.nStale(e) > 0 && <Status variant="style1" tone="yellow" textCase="normal">{S.nStale(e)} Outdated</Status>}</span> },
    { key: 'adopted', header: 'Adopted', width: 190, render: (v) => (v === '—' ? <span className="app-muted">—</span> : v) },
    { key: 'updated', header: 'Updated', width: 130, render: (v) => <span className="app-muted">{v}</span> },
    { key: 'more', header: '', width: 56, align: 'right', render: (_v, e: EventRec) => {
      const extra = ([['event.member.manage', 'Manage Members'], ['event.duplicate', 'Duplicate'], ['event.archive', 'Archive Event']] as const).filter(([p]) => can(p, { event: e }));
      return (
        <RowMenu label={e.name} onSelect={(v) => { if (v === 'open') open(e.id); else soon(v)(); }}
          items={[{ label: 'Open Event', value: 'open' }, ...extra.map(([, l]) => ({ label: l, value: l }))]} />
      );
    } },
  ], [duty, sid]);

  return (
    <div className="studies">
      {all.length > 0 && <PageHead>
        <Dropdown size="medium" shadow="none" label={'Status: ' + st} width={180} items={sts.map((t) => ({ label: t, value: t, selected: t === st }))} onSelect={(v) => setSt(String(v))} />
        <span className="page-tools">
          <SearchBox value={q} onChange={setQ} placeholder="Search events" />
          {canCreate && <Button variant="primary" leftIcon="ri-add-line" onClick={() => openModal({ kind: 'createEvent', sid })}>New Event</Button>}
        </span>
      </PageHead>}
      <div className="page-scroll">
        {rows.length === 0
          ? <EmptyState title={all.length ? 'No events match' : 'No events yet'} description={all.length ? 'Clear the filter or search.' : canCreate ? 'Create an Event to start an analysis.' : undefined}
              action={all.length || !canCreate ? undefined : <Button variant="primary" leftIcon="ri-add-line" onClick={() => openModal({ kind: 'createEvent', sid })}>New Event</Button>} />
          : <Table variant="plain" columnLayout="fixed" rowHeight={48} columns={columns} rows={rows} aria-label="Events" onRowClick={(r: EventRec) => open(r.id)} />}
      </div>
    </div>
  );
}
