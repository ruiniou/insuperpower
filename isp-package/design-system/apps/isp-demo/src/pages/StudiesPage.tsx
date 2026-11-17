import { useMemo, useState } from 'react';
import { Avatar, Card, Dropdown, Search, SegmentedControl, Table, type TableColumn } from '@wiz/react';
import { go } from '../router';
import { hrefStudy } from '../store/actions';
import { S } from '../store/selectors';
import { useDb } from '../store/store';
import type { Study } from '../store/types';
import { BlindTag, LifecycleTag } from './study/common';

const initials = (n: string) => n.split(' ').map((x) => x[0]).join('').toUpperCase();

/** #/studies：Studies 列表（TA 筛选、搜索、列表 / 卡片、生命周期只读、盲态、New Study 在页头） */
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
    { key: 'admin', header: 'Study Admin', width: 170, render: (_v, s: Study) => <span className="studies-owner"><Avatar size={20} color="brand-blue" initials={initials(s.admin)} />{s.admin}</span> },
    { key: 'events', header: 'Events', width: 80, render: (_v, s: Study) => S.eventsOf(s.id).length },
    { key: 'lifecycle', header: 'Lifecycle', width: 120, render: (_v, s: Study) => <LifecycleTag v={s.lifecycle} /> },
    { key: 'blinding', header: 'Blinding', width: 120, render: (_v, s: Study) => <BlindTag v={s.blinding} /> },
    { key: 'updated', header: 'Updated', width: 130 },
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
                    <div className="studies-card__top"><span className="studies-id"><i className="ri-folder-line" aria-hidden="true" />{st.id}</span><LifecycleTag v={st.lifecycle} /></div>
                    <div className="studies-card__name">{st.name}</div>
                    <div className="studies-card__meta"><span className="studies-owner"><Avatar size={20} color="brand-blue" initials={initials(st.admin)} />{st.admin}</span><span><BlindTag v={st.blinding} /></span></div>
                  </Card>
                ))}
              </div>
            )
        )}
      </div>
    </div>
  );
}
