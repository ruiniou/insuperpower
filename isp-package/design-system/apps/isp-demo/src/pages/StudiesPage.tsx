import { useMemo, useState } from 'react';
import { Avatar, Card, Dropdown, IconButton, PopoverMenu, Search, SegmentedControl, Switch, Table, type TableColumn } from '@wiz/react';
import { go } from '../router';
import { hrefStudy, toggleStudy } from '../store/actions';
import { S } from '../store/selectors';
import { useDb } from '../store/store';
import type { Study } from '../store/types';

const initials = (n: string) => n.split(' ').map((x) => x[0]).join('').toUpperCase();

function StudyMore({ s }: { s: Study }) {
  return (
    <PopoverMenu align="right" width={160}
      trigger={<IconButton icon="ri-more-2-fill" size="small" aria-label={`More actions for ${s.id}`} />}
      items={[{ label: 'Open study', value: 'open' }, { label: 'Archive…', value: 'archive', disabled: true }]}
      onSelect={(v) => { if (v === 'open') go(hrefStudy(s.id, 'events')); }} />
  );
}

const statusSwitch = (s: Study) => (
  <Switch size="small" checked={s.status === 'Active'} label={s.status} aria-label={`${s.id} status`} onChange={() => toggleStudy(s.id)} />
);

/** #/studies：Studies 列表（TA 筛选、搜索、列表 / 卡片、状态开关、More、New Study 在页头） */
export function StudiesPage() {
  const db = useDb();
  const [ta, setTa] = useState('All');
  const [q, setQ] = useState('');
  const [view, setView] = useState('list');
  const tas = ['All', ...Array.from(new Set(db.studies.map((s) => s.ta).filter(Boolean)))];
  const needle = q.trim().toLowerCase();
  const rows = db.studies.filter((s) => (ta === 'All' || s.ta === ta) && (!needle || [s.id, s.name, s.ta].join(' ').toLowerCase().includes(needle)));

  const open = (id: string) => go(hrefStudy(id, 'events'));

  const columns = useMemo<TableColumn[]>(() => [
    { key: 'id', header: 'Study ID', width: 150, render: (_v, s: Study) => <span className="studies-id"><i className="ri-folder-line" aria-hidden="true" />{s.id}</span> },
    { key: 'name', header: 'Study Name' },
    { key: 'ta', header: 'TA', width: 120, render: (v) => v || '—' },
    { key: 'owner', header: 'Study Owner', width: 170, render: (_v, s: Study) => <span className="studies-owner"><Avatar size={20} color="brand-blue" initials={initials(s.owner)} />{s.owner}</span> },
    { key: 'events', header: 'Events', width: 80, render: (_v, s: Study) => S.eventsOf(s.id).length },
    { key: 'status', header: 'Status', width: 140, render: (_v, s: Study) => statusSwitch(s) },
    { key: 'updated', header: 'Updated', width: 130 },
    { key: 'more', header: '', width: 48, render: (_v, s: Study) => <StudyMore s={s} /> },
  ], []);

  return (
    <div className="studies">
      <div className="page-head">
        <span className="page-title">Studies <i>{rows.length}</i></span>
        <span className="page-tools">
          <Search collapsible size="compact" width={220} placeholder="Search studies" aria-label="Search studies" value={q} onChange={(e) => setQ(e.target.value)} />
          <SegmentedControl variant="boxed" aria-label="View" value={view} onChange={setView}
            items={[{ value: 'list', icon: 'ri-list-check', 'aria-label': 'List view' }, { value: 'card', icon: 'ri-layout-grid-line', 'aria-label': 'Card view' }]} />
          <Dropdown size="medium" shadow="none" label={'TA: ' + ta} width={180} items={tas.map((t) => ({ label: t, value: t, selected: t === ta }))} onSelect={(v) => setTa(v)} />
        </span>
      </div>
      <div className="page-scroll">
        {rows.length === 0 ? (
          <div className="app-empty" role="status"><b>No studies match</b><span>Clear the search or the TA filter.</span></div>
        ) : (
          view === 'list'
            ? <Table className="studies-table" variant="plain" rowHeight={48} columns={columns} rows={rows} aria-label="Studies" onRowClick={(r: Study) => open(r.id)} />
            : (
              <div className="studies-cards">
                {rows.map((st) => (
                  <Card key={st.id} interactive elevation="ring" padding={16} role="button" aria-label={`Open ${st.id}`} onClick={() => open(st.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') open(st.id); }}>
                    <div className="studies-card__top"><span className="studies-id"><i className="ri-folder-line" aria-hidden="true" />{st.id}</span>{statusSwitch(st)}</div>
                    <div className="studies-card__name">{st.name}</div>
                    <div className="studies-card__meta"><span className="studies-owner"><Avatar size={20} color="brand-blue" initials={initials(st.owner)} />{st.owner}</span><span>{S.eventsOf(st.id).length} events · {st.ta || '—'}</span></div>
                  </Card>
                ))}
              </div>
            )
        )}
      </div>
    </div>
  );
}
