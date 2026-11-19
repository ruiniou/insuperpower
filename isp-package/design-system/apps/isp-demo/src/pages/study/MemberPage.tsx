import { useMemo, useState } from 'react';
import { Avatar, Button, Dropdown, Search, Status, Table, type TableColumn } from '@wiz/react';
import { formatRange, systemTimeZone } from '@wiz/isp';
import { attrLabel, membersOf, roleLabel, sortMembers } from '../../store/members';
import { ROLES } from '../../store/people';
import { can, session } from '../../store/role';
import { S } from '../../store/selectors';
import { useDb } from '../../store/store';
import { openModal } from '../../store/ui';
import type { StudyMember } from '../../store/types';
import { initials, PageToolbar, RowMenu } from './common';

const STATUS_OPTS = ['Active', 'Removed', 'All'] as const;
type StatusFilter = (typeof STATUS_OPTS)[number];
const PAGE_SIZES = [10, 20, 50];
const filterLabel = (sel: string[]) => (sel.length === 0 ? '' : sel.length === 1 ? ROLES.find((r) => r.value === sel[0])?.label ?? sel[0] : String(sel.length));

/** #/study/:sid/member：Study 成员列表。默认只显示 Active；Study Admin 置顶。Add members、行 More 需要 study.member.manage */
export function MemberPage({ sid }: { sid: string }) {
  useDb();
  const study = S.study(sid);
  const manage = can('study.member.manage', { study });
  const duty = session.duty;
  const [q, setQ] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [status, setStatus] = useState<StatusFilter>('Active');
  const all = membersOf(sid);
  const needle = q.trim().toLowerCase();
  const rows = sortMembers(all.filter((m) => (status === 'All' || (status === 'Active') === (m.status === 'ACTIVE'))
    && (!roles.length || roles.includes(m.role)) && (!needle || m.name.toLowerCase().includes(needle))));

  const tz = systemTimeZone().label;
  const columns = useMemo<TableColumn[]>(() => {
    const dim = (m: StudyMember, node: React.ReactNode) => (m.status === 'REMOVED' ? <span className="mem-dim">{node}</span> : node);
    const cols: TableColumn[] = [
      { key: 'name', header: 'Name', render: (_v, m: StudyMember) => (
        <span className="mem-who">
          <Avatar size={20} color="brand-blue" initials={initials(m.name)} />
          <span className="mem-who__txt">
            <span className="mem-who__name"><span className={m.status === 'REMOVED' ? 'app-ell mem-dim' : 'app-ell'}>{m.name}</span>{m.isAdmin && <Status variant="style1" tone="blue" textCase="normal">Admin</Status>}</span>
          </span>
        </span>
      ) },
      { key: 'role', header: 'Role', width: 180, render: (_v, m: StudyMember) => dim(m, roleLabel(m.role)) },
      { key: 'attr', header: 'Blinding', width: 160, render: (_v, m: StudyMember) => (m.status === 'REMOVED' || m.attr === 'UNSET' ? <span className={m.status === 'REMOVED' ? 'mem-dim' : 'app-muted'}>{attrLabel(m.attr)}</span> : attrLabel(m.attr)) },
      { key: 'validity', header: 'Validity · ' + tz, width: 340, render: (_v, m: StudyMember) => dim(m, formatRange(m.validFrom, m.validUntil)) },
      { key: 'status', header: 'Status', width: 120, render: (_v, m: StudyMember) => dim(m, m.status === 'ACTIVE' ? 'Active' : 'Removed') },
    ];
    if (manage) {
      cols.push({ key: 'more', header: '', width: 56, align: 'right', render: (_v, m: StudyMember) => (
        <RowMenu label={m.name} onSelect={(v) => {
          if (v === 'edit') openModal({ kind: 'editMember', sid, memberId: m.id });
          else if (v === 'remove') openModal({ kind: 'removeMember', sid, memberId: m.id });
          else openModal({ kind: 'addMembers', sid, userId: m.userId });
        }} items={m.status === 'REMOVED' ? [{ label: 'Re-add', value: 're-add' }]
          : [{ label: 'Edit role and validity', value: 'edit' }, ...(m.isAdmin ? [] : [{ label: 'Remove member', value: 'remove', danger: true }])]} />
      ) });
    }
    return cols;
  }, [duty, sid, manage]);

  return (
    <div className="studies">
      <PageToolbar
        filters={<>
          <Dropdown multiple size="medium" shadow="none" filterName="Role" icon="ri-filter-3-line" label={filterLabel(roles)} width={160}
            items={ROLES.map((r) => ({ label: r.label, value: r.value, selected: roles.includes(r.value) }))}
            onSelect={(v) => setRoles((p) => (p.includes(String(v)) ? p.filter((x) => x !== v) : [...p, String(v)]))} />
          <Dropdown size="medium" shadow="none" filterName="Status" label={status} width={160} items={STATUS_OPTS.map((t) => ({ label: t, value: t, selected: t === status }))} onSelect={(v) => setStatus(String(v) as StatusFilter)} />
        </>}
        search={<Search size="compact" width={220} placeholder="Search members" aria-label="Search members" value={q} onChange={(e) => setQ(e.target.value)} />}
        actions={manage && <Button variant="primary" leftIcon="ri-add-line" onClick={() => openModal({ kind: 'addMembers', sid, userId: null })}>Add members</Button>} />
      <div className="page-scroll">
        {rows.length === 0
          ? <div className="app-empty" role="status"><b>No members match</b><span>Clear the search or the filters.</span></div>
          : <Table key={status + '|' + roles + '|' + needle} variant="plain" columnLayout="fixed" rowHeight={48} paginated={rows.length > PAGE_SIZES[0]} jumpToPage pageSize={20} pageSizeOptions={PAGE_SIZES} columns={columns} rows={rows} aria-label="Members" />}
      </div>
    </div>
  );
}
