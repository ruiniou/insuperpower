import { useMemo, useState } from 'react';
import { Avatar, Button, Dropdown, EmptyState, Search, Table, type TableColumn } from '@wiz/react';
import { PageToolbar } from './study/common';
import { go } from '../router';
import { hrefStudy } from '../store/actions';
import { can } from '../store/role';
import { S } from '../store/selectors';
import { useDb } from '../store/store';
import { ICON } from '../icons';
import type { Study } from '../store/types';
import { LifecycleMark } from './study/common';

const LIFE = { ACTIVE: 'Active', ARCHIVED: 'Archived', DELETED: 'Deleted' } as const;
const initials = (n: string) => n.split(' ').map((x) => x[0]).join('').toUpperCase();

/** #/studies：Studies 列表（TA 筛选、搜索、仅列表视图、生命周期只读、盲态、New Study 在页头） */
/** Studies 随租户增长，超过最小页长才出分页条 */
const STUDY_PAGE_SIZES = [10, 20, 50];

/** 多选筛选：空数组即未筛选，全部取消勾选即清除 */
const filterLabel = (sel: string[]) => (sel.length === 0 ? '' : sel.length === 1 ? sel[0] : String(sel.length));
const filterItems = (opts: string[], sel: string[]) => opts.map((o) => ({ label: o, value: o, selected: sel.includes(o) }));
const toggleFilter = (sel: string[], v: string) => (sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v]);

export function StudiesPage() {
  const db = useDb();
  const [st, setSt] = useState<string[]>([]);
  const [ta, setTa] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const sts: string[] = ['Active', 'Archived', 'Deleted'];
  const tas: string[] = Array.from(new Set(db.studies.map((s) => s.ta).filter(Boolean)));
  const needle = q.trim().toLowerCase();
  const rows = db.studies.filter((s) => (!st.length || st.includes(LIFE[s.lifecycle])) && (!ta.length || ta.includes(s.ta)) && (!needle || [s.id, s.name, s.ta].join(' ').toLowerCase().includes(needle)));

  const open = (id: string) => go(hrefStudy(id, 'events'));

  const columns = useMemo<TableColumn[]>(() => [
    { key: 'id', header: 'Study', render: (_v, s: Study) => (
      <span className="studies-study">
        <i className={ICON.study} aria-hidden="true" />
        <span className="studies-study__txt">
          <span className="studies-id">{s.id}{s.lifecycle !== 'ACTIVE' && <span className="studies-life-end"><LifecycleMark v={s.lifecycle} /></span>}</span>
          <span className="studies-name">{s.name}</span>
        </span>
      </span>
    ) },
    { key: 'ta', header: 'Therapeutic Area', width: 160, render: (v) => v || '—' },
    { key: 'admin', header: 'Study Admin', width: 170, render: (_v, s: Study) => <span className="studies-owner"><Avatar size={20} color="brand-blue" initials={initials(s.admin)} />{s.admin}</span> },
    { key: 'events', header: 'Events', width: 80, render: (_v, s: Study) => S.eventsOf(s.id).length },
    { key: 'blinding', header: 'Blinding', width: 120, render: (_v, s: Study) => <span className="studies-blind">{s.blinding}</span> },
    { key: 'updated', header: 'Updated', width: 130 },
  ], []);

  return (
    <div className="studies">
      {db.studies.length > 0 && <PageToolbar
        filters={<>
          <Dropdown multiple size="medium" shadow="none" filterName="Status" icon="ri-filter-3-line" label={filterLabel(st)} width={180} items={filterItems(sts, st)} onSelect={(v) => setSt((p) => toggleFilter(p, v))} />
          <Dropdown multiple size="medium" shadow="none" filterName="Therapeutic area" icon="ri-filter-3-line" label={filterLabel(ta)} width={220} items={filterItems(tas, ta)} onSelect={(v) => setTa((p) => toggleFilter(p, v))} />
        </>}
        search={<Search size="compact" width={220} placeholder="Search studies" aria-label="Search studies" value={q} onChange={(e) => setQ(e.target.value)} />}
        actions={can('study.create') && <Button variant="primary" leftIcon="ri-add-line" onClick={() => go('#/studies/new')}>New Study</Button>} />}
      <div className="page-scroll">
        {db.studies.length === 0 ? (
          <EmptyState title="No studies yet" description={can('study.create') ? 'Create a Study to get started.' : 'Ask an authorized administrator to create a Study.'}
            action={can('study.create') ? <Button variant="primary" leftIcon="ri-add-line" onClick={() => go('#/studies/new')}>New Study</Button> : undefined} />
        ) : rows.length === 0 ? (
          <div className="app-empty" role="status"><b>No studies match</b><span>Clear the search or the filters.</span></div>
        ) : (
          <Table key={st + '|' + ta + '|' + needle} className="studies-table" variant="plain" rowHeight={48} paginated={rows.length > STUDY_PAGE_SIZES[0]} jumpToPage pageSize={20} pageSizeOptions={STUDY_PAGE_SIZES} columns={columns} rows={rows} aria-label="Studies" onRowClick={(r: Study) => open(r.id)} />
        )}
      </div>
    </div>
  );
}
