import { useMemo, useState } from 'react';
import { Button, Dropdown, EmptyState, Table, type TableColumn } from '@wiz/react';
import { systemTimeZone, ValidityPicker, type Validity } from '@wiz/isp';
import { auditOf } from '../../store/audit';
import { dTime } from '../../store/dates';
import { useDb } from '../../store/store';
import type { AuditEvent } from '../../store/types';
import { Owner, PageToolbar, SearchBox } from './common';

const ALL = 'All';
const PAGE_SIZES = [10, 20, 50];
const NO_RANGE: Validity = { start: '', end: null };
const uniq = (xs: string[]) => [ALL, ...Array.from(new Set(xs)).sort((a, b) => a.localeCompare(b))];

/**
 * #/study/:sid/audit：Study 的审计记录，只读。时间倒序固定，不提供排序；
 * 筛选 Operator、Action（选项来自本 Study 出现过的记录）、时间范围 [开始, 结束)，搜索匹配 Action、Changes、Reason
 */
export function AuditTrailPage({ sid }: { sid: string }) {
  useDb();
  const all = auditOf(sid);
  const [op, setOp] = useState(ALL);
  const [act, setAct] = useState(ALL);
  const [range, setRange] = useState<Validity>(NO_RANGE);
  const [q, setQ] = useState('');
  const tz = systemTimeZone().label;
  const needle = q.trim().toLowerCase();
  const dirty = op !== ALL || act !== ALL || !!range.start || !!needle;
  const reset = () => { setOp(ALL); setAct(ALL); setRange(NO_RANGE); setQ(''); };
  const rows = all.filter((a) => (op === ALL || a.actor === op) && (act === ALL || a.action === act)
    && (!range.start || a.time >= range.start) && (!range.end || a.time < range.end)
    && (!needle || [a.action, a.changes, a.reason ?? ''].join('\n').toLowerCase().includes(needle)));

  const columns = useMemo<TableColumn[]>(() => [
    { key: 'time', header: 'Time (' + tz + ')', width: 190, render: (v: string) => <span className="audit-time">{dTime(v)}</span> },
    { key: 'actor', header: 'Operator', width: 170, render: (v: string) => <Owner name={v} /> },
    { key: 'action', header: 'Action', width: 200 },
    { key: 'changes', header: 'Changes', render: (_v, a: AuditEvent) => (
      <span className="audit-changes">
        <span>{a.changes}</span>
        {a.reason && <span className="audit-reason">{a.reason}</span>}
      </span>
    ) },
    { key: 'result', header: 'Result', width: 120, render: () => 'Completed' },
  ], [tz]);

  const pick = (opts: string[], v: string, set: (x: string) => void, name: string, width: number) => (
    <Dropdown size="medium" shadow="none" filterName={name} label={v} width={width} items={opts.map((o) => ({ label: o, value: o, selected: o === v }))} onSelect={(x) => set(String(x))} />
  );

  return (
    <div className="studies audit">
      {all.length > 0 && <PageToolbar
        filters={<>
          {pick(uniq(all.map((a) => a.actor)), op, setOp, 'Operator', 180)}
          {pick(uniq(all.map((a) => a.action)), act, setAct, 'Action', 220)}
          <ValidityPicker className="audit-range" aria-label="Time range" placeholder="Time range" endable defaultEnd clearable value={range} onChange={setRange} />
          {dirty && <Button variant="link" onClick={reset}>Reset</Button>}
        </>}
        search={<SearchBox value={q} onChange={setQ} placeholder="Search audit trail" />} />}
      <div className="page-scroll">
        {all.length === 0 ? (
          <EmptyState title="No records yet" description="Changes to this study, its members and its files are recorded here." />
        ) : rows.length === 0 ? (
          <EmptyState title="No records match" description="Clear the search or the filters." />
        ) : (
          <Table key={[op, act, range.start, range.end, needle].join('|')} className="audit-table" variant="plain" columnLayout="fixed" rowHeight={48} paginated={rows.length > PAGE_SIZES[0]} jumpToPage pageSize={20} pageSizeOptions={PAGE_SIZES} columns={columns} rows={rows} aria-label="Audit trail" />
        )}
      </div>
    </div>
  );
}
