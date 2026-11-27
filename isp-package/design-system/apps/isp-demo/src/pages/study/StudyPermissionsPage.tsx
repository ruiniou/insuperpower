import { useState, type ReactNode } from 'react';
import { Button, Checkbox, SegmentedControl, ConfirmDialog, EmptyState, Table, Textarea, Tooltip, type TableColumn } from '@wiz/react';
import { isWritable } from '../../store/role';
import {
  canViewStudyPermissions, datasetPermissions, documentPermissions, permissionActions,
  permissionRoles, permissionValue, saveStudyPermissions,
  type PermissionChange, type PermissionItem, type PermissionScope,
} from '../../store/studyPermissions';
import { toast } from '../../store/store';
import type { MemberRole } from '../../store/types';
import { PageToolbar } from './common';
import './study-permissions.css';

type Role = MemberRole | 'admin';
type Draft = Record<string, PermissionChange>;

const roles = Object.entries(permissionRoles) as [MemberRole, string][];
const roleColumns: [Role, string][] = [['admin', 'Study Admin'], ...roles];
type Action = (typeof permissionActions)[number]['key'];
const actionOptions = [{ value: 'all', label: 'All' }, ...permissionActions.map(({ key, label }) => ({ value: key, label }))];

const diffColumns: TableColumn[] = [
  { key: 'label', header: 'Policy item' },
  { key: 'current', header: 'Current value', width: 110 },
  { key: 'proposed', header: 'Proposed value', width: 120 },
];

export function StudyPermissionsPage({ sid, scope }: {
  sid: string; scope: PermissionScope;
}) {
  const [action, setAction] = useState<Action | 'all'>('P');
  const [roleFilter, setRoleFilter] = useState<Role | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState<Draft>({});
  const [dialog, setDialog] = useState<'review' | 'discard' | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const allowed = canViewStudyPermissions(sid);
  const writable = allowed && isWritable(sid);
  if (!allowed) return <div className="studies">
    <EmptyState title="Study permissions unavailable" description="A current Study Admin can access these policies." />
  </div>;

  const changes = Object.values(draft);
  const keyOf = (role: MemberRole, item: PermissionItem) => role + ':' + item.code;
  const diff = changes.map(({ item, proposed, role }) => {
    const { current } = permissionValue(sid, scope, role, item);
    return {
      label: [permissionRoles[role], scope === 'dataset' ? item.group : '', item.label, item.track].filter(Boolean).join(' / '),
      current: current || '—',
      proposed: proposed || '—',
    };
  });

  const stage = (role: MemberRole, item: PermissionItem, proposed: string, current: string) => {
    const key = keyOf(role, item);
    const next = { ...draft };
    if (proposed === current) delete next[key];
    else next[key] = { role, item, proposed };
    setDraft(next);
  };

  const renderCheckbox = (role: Role, item: PermissionItem, permission: Action) => {
    const label = permissionActions.find(({ key }) => key === permission)!.label;
    const name = [scope === 'dataset' ? item.group : '', item.label, item.track,
      role === 'admin' ? 'Study Admin' : permissionRoles[role], label].filter(Boolean).join(' / ');
    if (role === 'admin') return <Checkbox checked disabled aria-label={name + ', read-only'} />;

    const { ceiling, current } = permissionValue(sid, scope, role, item);
    const value = draft[keyOf(role, item)]?.proposed ?? current;
    const checked = value.includes(permission);
    const blocked = !ceiling.includes(permission);
    const checkbox = <Checkbox checked={checked} disabled={!writable || blocked}
      aria-label={name + (blocked ? ', outside system ceiling' : '')}
      onChange={(next) => stage(role, item, permissionActions.map(({ key }) => key)
        .filter((key) => key === permission ? next : value.includes(key)).join(''), current)} />;

    if (blocked) return <Tooltip content={label + ' is outside the system ceiling.'}>
      <span className="study-permissions__checkbox" role="group" tabIndex={0}
        aria-label={name + ', outside system ceiling'}>{checkbox}</span>
    </Tooltip>;

    return <span className={checked !== current.includes(permission)
      ? 'study-permissions__checkbox study-permissions__changed' : 'study-permissions__checkbox'}>{checkbox}</span>;
  };

  const items = scope === 'document' ? documentPermissions : datasetPermissions;
  const groups = [...new Set(items.map(({ group }) => group))];
  const visibleRoles = roleFilter ? roleColumns.filter(([role]) => role === roleFilter) : roleColumns;
  const visibleActions = permissionActions.filter(({ key }) => action === 'all' || key === action);
  const columnCount = visibleRoles.length;

  const closeDialog = () => { setDialog(null); setError(''); };
  const openReview = () => { setReason(''); setError(''); setDialog('review'); };
  const save = () => {
    if (!reason.trim() || reason.trim().length > 1000) {
      setError('Enter a reason for the change (1–1,000 characters).');
      return;
    }
    if (!saveStudyPermissions(sid, scope, reason, changes)) {
      toast('Permissions could not be saved. Check your access and the system ceiling.', { type: 'error' });
      return;
    }
    setDraft({});
    closeDialog();
    toast('Permissions updated.', { type: 'success' });
  };

  return <div className="studies study-permissions">
    <PageToolbar actions={<SegmentedControl aria-label="Permission action" items={actionOptions} value={action}
        onChange={(value) => setAction(value as Action | 'all')} />} />
    <div className="study-permissions__workspace">
      <div className="study-permissions__content wiz-table wiz-table--plain">
        {!writable && <p className="study-permissions__summary wiz-text-body-2">This Study is read-only.</p>}
        <table className={'wiz-table__grid is-fixed study-permissions__matrix' + (roleFilter ? ' study-permissions__matrix--filtered' : action === 'all' ? ' study-permissions__matrix--all-actions' : '')}
          aria-label={(scope === 'document' ? 'Document' : 'Dataset') + ' permissions, ' + (action === 'all' ? 'all actions' : visibleActions[0].label)}>
          <colgroup>
            <col className="study-permissions__resource-col" />
            {visibleRoles.map(([role]) => <col key={role}
              className={!roleFilter && role === 'admin' && action !== 'all' ? 'study-permissions__admin-col' : undefined} />)}
          </colgroup>
          <thead>
            <tr className={action === 'all' ? 'study-permissions__main-head' : undefined}>
              <th scope="col" className="wiz-table__th">{scope === 'document' ? 'Document type' : 'Mode'}</th>
              {visibleRoles.map(([role, label]) => (
                <th key={role} scope="col" className={role === 'admin' ? 'wiz-table__th study-permissions__admin-head' : 'wiz-table__th'}>
                  <Tooltip content={roleFilter === role ? 'Clear filter' : 'Filter by role'}>
                    <button type="button" className="study-permissions__text-action study-permissions__role-filter"
                      aria-label={label + ', filter by role'} aria-pressed={roleFilter === role}
                      onClick={() => setRoleFilter((current) => current === role ? null : role)}>
                      <span>{label}</span>
                      <i className="ri-filter-3-line" aria-hidden="true" />
                    </button>
                  </Tooltip>
                </th>
              ))}
            </tr>
            {action === 'all' && <tr className="study-permissions__action-head" aria-hidden="true">
              <td className="wiz-table__th" />
              {visibleRoles.map(([role]) => <td key={role} className="wiz-table__th">
                <span className="study-permissions__checks">
                  {visibleActions.map(({ key, label }) => <span key={key} title={label}>{key}</span>)}
                </span>
              </td>)}
            </tr>}
          </thead>
          {groups.map((group) => {
            const groupKey = scope + '/' + group;
            const expanded = !collapsed[groupKey];
            const grouped = items.filter((item) => item.group === group);
            return <tbody key={groupKey}>
              <tr className="study-permissions__section">
                <th scope="rowgroup" className="wiz-table__th">
                  <button type="button" className="study-permissions__text-action" aria-expanded={expanded}
                    onClick={() => setCollapsed({ ...collapsed, [groupKey]: expanded })}>
                    <i className={expanded ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'} aria-hidden="true" />
                    {group}
                  </button>
                </th>
                <td colSpan={columnCount} />
              </tr>
              {expanded && grouped.map((item, index) => {
                const packageStart = item.track && grouped[index - 1]?.label !== item.label;
                return <StudyPermissionRows key={item.code} packageLabel={packageStart ? item.label : undefined}
                  item={item} columnCount={columnCount}>
                  {visibleRoles.map(([role]) => (
                    <td key={role} className="wiz-table__td">
                      {action === 'all' ? <div className="study-permissions__checks">
                        {visibleActions.map(({ key }) => <span key={key}>{renderCheckbox(role, item, key)}</span>)}
                      </div> : renderCheckbox(role, item, action)}
                    </td>
                  ))}
                </StudyPermissionRows>;
              })}
            </tbody>;
          })}
        </table>
      </div>
    </div>
    {writable && <footer className="study-permissions__footer">
      <Button disabled={!diff.length} onClick={() => setDialog('discard')}>Discard changes</Button>
      <Button variant="primary" disabled={!diff.length} onClick={openReview}>Review changes{diff.length ? ' (' + diff.length + ')' : ''}</Button>
    </footer>}
    {dialog === 'review' && <ConfirmDialog title="Review Permission Changes"
      description="Saving applies these permissions to members with the affected roles."
      confirmLabel="Save Changes" cancelLabel="Keep Editing" width={680} onCancel={closeDialog} onConfirm={save}>
      <div className="study-permissions__diff">
        <Table aria-label="Permission changes" variant="plain" columnLayout="fixed" columns={diffColumns} rows={diff} />
      </div>
      <Textarea label="Reason for change" required value={reason} onChange={(event) => { setReason(event.target.value); setError(''); }} error={error} />
    </ConfirmDialog>}
    {dialog === 'discard' && <ConfirmDialog title="Discard Permission Changes?"
      description="This discards all unsaved changes in this permission matrix."
      confirmLabel="Discard Changes" cancelLabel="Keep Editing" tone="danger" onCancel={closeDialog}
      onConfirm={() => { setDraft({}); closeDialog(); }} />}
  </div>;
}

function StudyPermissionRows({ packageLabel, item, columnCount, children }: {
  packageLabel?: string;
  item: PermissionItem;
  columnCount: number;
  children: ReactNode;
}) {
  return <>
    {packageLabel && <tr className="study-permissions__package">
      <th scope="row" className="wiz-table__td">{packageLabel}</th><td colSpan={columnCount} />
    </tr>}
    <tr>
      <th scope="row" className="wiz-table__td">{item.track ?? item.label}</th>
      {children}
    </tr>
  </>;
}
