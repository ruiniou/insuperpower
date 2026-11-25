import { useState } from 'react';
import { Button, Dropdown, EmptyState, Search, Table, type TableColumn } from '@wiz/react';
import { Owner, PageToolbar } from './study/common';
import { go } from '../router';
import { hrefStudy } from '../store/actions';
import { can, session } from '../store/role';
import { S } from '../store/selectors';
import { useDb } from '../store/store';
import { ICON } from '../icons';
import type { Study } from '../store/types';
import { openModal } from '../store/ui';

const open = (id: string) => go(hrefStudy(id, 'events'));

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ARCHIVED', label: 'Archived' },
] as const;
type StudyStatusFilter = typeof STATUS_OPTIONS[number]['value'];

const updatedTime = (study: Study) => Date.parse(study.updated) || 0;

/** #/studies：Studies 列表（TA 筛选、搜索、仅列表视图、生命周期只读、盲态、New Study 在页头） */
/** Studies 随租户增长，超过最小页长才出分页条 */
const STUDY_PAGE_SIZES = [10, 20, 50];

/** 多选筛选：空数组即未筛选，全部取消勾选即清除 */
const filterLabel = (sel: string[]) => (sel.length === 0 ? '' : sel.length === 1 ? sel[0] : String(sel.length));
const filterItems = (opts: string[], sel: string[]) => opts.map((o) => ({ label: o, value: o, selected: sel.includes(o) }));
const toggleFilter = (sel: string[], v: string) => (sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v]);

export function StudiesPage() {
  const db = useDb();
  const duty = session.duty;
  const [status, setStatus] = useState<StudyStatusFilter>('ACTIVE');
  const [ta, setTa] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const visibleStudies = db.studies.filter((s) => s.lifecycle !== 'DELETED');
  const tas: string[] = Array.from(new Set(visibleStudies.map((s) => s.ta).filter(Boolean)));
  const needle = q.trim().toLowerCase();
  const rows = visibleStudies
    .filter((s) => s.lifecycle === status && (!ta.length || ta.includes(s.ta)) && (!needle || [s.id, s.name, s.ta].join(' ').toLowerCase().includes(needle)))
    .sort((a, b) => updatedTime(b) - updatedTime(a) || a.id.localeCompare(b.id));

  const columns: TableColumn[] = [
    { key: 'id', header: 'Study', render: (_v, s: Study) => (
      <span className="studies-study">
        {s.lifecycle === 'ARCHIVED'
          ? <i className="ri-archive-line" role="img" aria-label="Archived" />
          : <i className={ICON.study} aria-hidden="true" />}
        <span className="studies-study__txt">
          <span className="studies-id">{s.id}</span>
          <span className="studies-name">{s.name}</span>
        </span>
      </span>
    ) },
    { key: 'ta', header: 'Therapeutic Area', width: 160, render: (v) => v || '—' },
    { key: 'admin', header: 'Study Admin', width: 170, render: (_v, s: Study) => <Owner name={s.admin} /> },
    { key: 'events', header: 'Events', width: 80, render: (_v, s: Study) => S.eventsOf(s.id).length },
    { key: 'blinding', header: 'Blinding', width: 120, render: (_v, s: Study) => <span className="studies-blind">{s.blinding}</span> },
    { key: 'updated', header: 'Updated', width: 130 },
    { key: 'actions', header: '', width: 112, align: 'right', render: (_v, s: Study) => {
      if (can('study.restore', { study: s }, duty)) {
        return <Button size="small" variant="secondary" aria-label={`Restore ${s.id}`} onClick={(e) => {
          e.stopPropagation();
          openModal({ kind: 'restoreStudy', sid: s.id });
        }}>Restore</Button>;
      }
      return null;
    } },
  ];

  return (
    <div className="studies">
      {visibleStudies.length > 0 && <PageToolbar
        filters={<>
          <Dropdown size="medium" shadow="none" filterName="Status" icon="ri-filter-3-line"
            label={STATUS_OPTIONS.find((option) => option.value === status)?.label}
            width={180}
            items={STATUS_OPTIONS.map((option) => ({ ...option, selected: option.value === status }))}
            onSelect={(value) => {
              if (value === 'ACTIVE' || value === 'ARCHIVED') setStatus(value);
            }} />
          <Dropdown multiple size="medium" shadow="none" filterName="Therapeutic area" icon="ri-filter-3-line" label={filterLabel(ta)} width={220} items={filterItems(tas, ta)} onSelect={(v) => setTa((p) => toggleFilter(p, v))} />
        </>}
        search={<Search size="compact" width={220} placeholder="Search studies" aria-label="Search studies" value={q} onChange={(e) => setQ(e.target.value)} />}
        actions={can('study.create') && <Button variant="primary" leftIcon="ri-add-line" onClick={() => go('#/studies/new')}>New Study</Button>} />}
      <div className="page-scroll">
        {visibleStudies.length === 0 ? (
          <EmptyState title="No studies yet" description={can('study.create') ? 'Create a Study to get started.' : 'Ask an authorized administrator to create a Study.'}
            action={can('study.create') ? <Button variant="primary" leftIcon="ri-add-line" onClick={() => go('#/studies/new')}>New Study</Button> : undefined} />
        ) : rows.length === 0 ? (
          <div className="app-empty" role="status"><b>No studies match</b><span>Try another status or clear the search and therapeutic area filters.</span></div>
        ) : (
          <Table key={status + '|' + ta + '|' + needle} className="studies-table" variant="plain" columnLayout="fixed" rowHeight={48} paginated={rows.length > STUDY_PAGE_SIZES[0]} jumpToPage pageSize={20} pageSizeOptions={STUDY_PAGE_SIZES} columns={columns} rows={rows} aria-label="Studies" onRowClick={(r: Study) => open(r.id)} />
        )}
      </div>
    </div>
  );
}
