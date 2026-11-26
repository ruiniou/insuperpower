import { useState } from 'react';
import { Button, Checkbox, ConfirmDialog, EmptyState, SideBarTabs, Table, Tabs, Textarea, Tooltip, type TableColumn } from '@wiz/react';
import { go } from '../../router';
import { hrefStudy } from '../../store/actions';
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
interface MatrixRow { group: string; label: string; items: PermissionItem[] }

const roles = Object.entries(permissionRoles) as [MemberRole, string][];
const scopes = [{ value: 'document', label: 'Document' }, { value: 'dataset', label: 'Dataset' }];
const permissionIcons = {
  W: 'ri-edit-line',
  P: 'ri-eye-line',
  D: 'ri-download-2-line',
} as const;

const diffColumns: TableColumn[] = [
  { key: 'label', header: 'Policy item' },
  { key: 'current', header: 'Current value', width: 110 },
  { key: 'proposed', header: 'Proposed value', width: 120 },
];

export function StudyPermissionsPage({ sid, origin, space }: {
  sid: string; origin: PermissionScope; space?: string;
}) {
  const [scope, setScope] = useState(origin);
  const [role, setRole] = useState<Role>('STAT');
  const [drafts, setDrafts] = useState<Record<PermissionScope, Draft>>({ document: {}, dataset: {} });
  const [dialog, setDialog] = useState<'review' | 'discard' | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const allowed = canViewStudyPermissions(sid);
  const writable = allowed && isWritable(sid);
  const resource = origin === 'document' ? 'asset' : 'dataset';
  const back = <Button variant="link" leftIcon="ri-arrow-left-line" onClick={() => go(hrefStudy(sid, resource, space))}>
    {origin === 'document' ? 'Back to assets' : 'Back to datasets'}
  </Button>;

  if (!allowed) return <div className="studies"><PageToolbar start={back} />
    <EmptyState title="Study permissions unavailable" description="A current Study Admin can access these policies." />
  </div>;

  const draft = drafts[scope];
  const changes = Object.values(draft);
  const updateDraft = (next: Draft) => setDrafts({ ...drafts, [scope]: next });
  const keyOf = (role: MemberRole, item: PermissionItem) => role + ':' + item.code;
  const diff = changes.flatMap(({ item, proposed, role }) => {
    const { current } = permissionValue(sid, scope, role, item);
    return permissionActions.filter(({ key }) => current.includes(key) !== proposed.includes(key))
      .map(({ key, label }) => ({
        label: [permissionRoles[role], scope === 'dataset' ? item.group : '', item.label, item.track, label].filter(Boolean).join(' / '),
        current: current.includes(key) ? 'On' : 'Off',
        proposed: proposed.includes(key) ? 'On' : 'Off',
      }));
  });

  const renderActions = (item: PermissionItem) => {
    const name = [scope === 'dataset' ? item.group : '', item.label, item.track].filter(Boolean).join(' ');
    if (role === 'admin') return <div className="study-permissions__grant" role="group" aria-label={name + ': Maintain, Preview and Download inherited'}>
      {item.track && <span>{item.track}</span>}
      {permissionActions.map(({ key, label }) => <Tooltip key={key} content={label + ' (Inherited)'}>
        <i className={`study-permissions__icon ${permissionIcons[key]}`} aria-hidden="true" />
      </Tooltip>)}
    </div>;
    const { ceiling, current } = permissionValue(sid, scope, role, item);
    const key = keyOf(role, item);
    const value = draft[key]?.proposed ?? current;
    return <div className="study-permissions__grant" role="group" aria-label={name}>
      {item.track && <span className="wiz-text-body-2">{item.track}</span>}
      {permissionActions.map(({ key: action, label }) => {
        const blocked = !ceiling.includes(action);
        const hint = blocked ? label + ' is outside the system ceiling.' : label;
        return <Tooltip key={action} content={hint}>
          <span className="study-permissions__permission"
            tabIndex={blocked ? 0 : undefined}
            role={blocked ? 'group' : undefined}
            aria-label={blocked ? name + ': ' + hint : undefined}>
            <Checkbox label={<i className={`study-permissions__icon ${permissionIcons[action]}`} aria-hidden="true" />}
              aria-label={name + ' ' + label + (blocked ? ', outside system ceiling' : '')}
              checked={value.includes(action)} disabled={!writable || blocked}
              onChange={(checked) => {
                const proposed = permissionActions.map(({ key }) => key)
                  .filter((key) => key === action ? checked : value.includes(key)).join('');
                const next = { ...draft };
                if (proposed === current) delete next[key];
                else next[key] = { role, item, proposed };
                updateDraft(next);
              }} />
          </span>
        </Tooltip>;
      })}
    </div>;
  };

  const items = scope === 'document' ? documentPermissions : datasetPermissions;
  const groups = [...new Set(items.map(({ group }) => group))];
  const columns: TableColumn[] = [
    { key: 'label', header: scope === 'document' ? 'Document type' : 'Mode', width: 180 },
    { key: 'actions', header: 'Permissions', render: (_value, row: MatrixRow) => (
      <div className={row.items.length > 1 ? "study-permissions__tracks study-permissions__tracks--paired" : "study-permissions__tracks"}>{row.items.map((item) => <div key={item.code}>{renderActions(item)}</div>)}</div>
    ) },
  ];

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
    updateDraft({});
    closeDialog();
    toast('Permissions updated.', { type: 'success' });
  };

  return <div className="studies study-permissions">
    <PageToolbar start={back} actions={<div className="study-permissions__legend wiz-text-caption" aria-label="Permission legend">
      {permissionActions.map(({ key, label }) => <span key={key}>
        <i className={`study-permissions__icon ${permissionIcons[key]}`} aria-hidden="true" /> {label}
      </span>)}
    </div>} />
    <Tabs variant="underline" className="study-permissions__tabs" aria-label="Permission scope" items={scopes} value={scope}
      onChange={(value) => setScope(value === 'dataset' ? 'dataset' : 'document')} />
    <div className="study-permissions__workspace">
      <nav className="study-permissions__roles" aria-label="Policy roles">
        {([['admin', 'Study Admin'], ...roles] as [Role, string][]).map(([value, label]) => (
          <SideBarTabs key={value} icon={null} label={label} active={value === role} selectedTone="soft" onClick={() => setRole(value)} />
        ))}
      </nav>
      <div className="study-permissions__content">
        <div className="study-permissions__summary">
          <h2 className="wiz-text-subtitle-2">{role === 'admin' ? 'Study Admin' : permissionRoles[role]}</h2>
          {role === 'admin' && <p className="wiz-text-body-2">Inherited from the current Study Admin responsibility.</p>}
          {!writable && <p className="wiz-text-body-2">This Study is read-only.</p>}
        </div>
        <Table aria-label={scope === 'document' ? 'Document permissions' : 'Dataset permissions'}
          variant="plain" columnLayout="fixed" rowHeight={48} columns={columns}
          rows={groups.flatMap((group) => {
            const grouped = items.filter((item) => item.group === group);
            return [...new Set(grouped.map(({ label }) => label))].map((label) => ({
              group, label, items: grouped.filter((item) => item.label === label),
            }));
          })}
          groupBy={(row: MatrixRow) => row.group} renderGroup={(group) => group} />
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
      description="This discards all unsaved changes in the current tab."
      confirmLabel="Discard Changes" cancelLabel="Keep Editing" tone="danger" onCancel={closeDialog}
      onConfirm={() => { updateDraft({}); closeDialog(); }} />}
  </div>;
}
