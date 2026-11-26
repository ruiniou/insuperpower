import { nowIso } from '@wiz/isp';
import { diff, logAudit } from './audit';
import { DEMO_TENANT, ME_USER } from './people';
import { effectiveDuty } from './role';
import { S } from './selectors';
import { emit, getDb } from './store';
import type { MemberRole } from './types';

export const permissionActions = [
  { key: 'W', label: 'Maintain' },
  { key: 'P', label: 'Preview' },
  { key: 'D', label: 'Download' },
] as const;
export type PermissionScope = 'document' | 'dataset';
export const permissionRoles = {
  STAT: 'Statistician', DEV: 'Statistical Programmer', QC: 'QC Programmer',
  DM: 'Data management', VIEW: 'View and comment',
} satisfies Record<MemberRole, string>;

export interface PermissionItem {
  code: string;
  label: string;
  group: string;
  track?: 'DEV' | 'QC';
  values: string[];
}

export const documentPermissions: PermissionItem[] = [
  { code: 'PROTOCOL', label: 'Protocol', group: 'Study Design', values: ['WPD', 'P', 'P', 'P', 'P'] },
  { code: 'SAP', label: 'SAP', group: 'Study Design', values: ['WPD', 'P/PD', 'P', 'P', 'P'] },
  { code: 'RAW_SCHEMA', label: 'Raw Data Spec', group: 'Study Spec', values: ['P', 'P', 'P', 'WPD', ''] },
  { code: 'SDTM_SPEC', label: 'SDTM Spec', group: 'Study Spec', values: ['PD', 'WPD', 'PD', 'WPD', ''] },
  { code: 'ADAM_SPEC', label: 'ADaM Spec', group: 'Study Spec', values: ['PD', 'WPD', 'PD', 'WPD', ''] },
  { code: 'TFL_MOCKSHELL', label: 'Mock Shell', group: 'Study Spec', values: ['WPD', 'WPD', 'PD', 'P', 'P'] },
  ...[
    ['SDTM', 'SDTM_PROGRAM', 'SDTM_QC_PROGRAM'],
    ['ADaM', 'ADAM_PROGRAM', 'ADAM_QC_PROGRAM'],
    ['TFL', 'TFL_PRODUCTION_CODE', 'TFL_QC_CODE'],
  ].flatMap(([name, dev, qc]): PermissionItem[] => [
    { code: dev, label: name + ' Code Package', group: 'Code', track: 'DEV', values: ['P', 'WPD', '/PD', '', ''] },
    { code: qc, label: name + ' Code Package', group: 'Code', track: 'QC', values: ['P', '', 'WPD', '', ''] },
  ]),
];

const documentAliases: Record<string, string> = {
  RAW_DATA_SPEC: 'RAW_SCHEMA', TABLE_SHELL: 'TFL_MOCKSHELL',
  FIGURE_SHELL: 'TFL_MOCKSHELL', LISTING_SHELL: 'TFL_MOCKSHELL',
};

export const documentPermission = (code: string) =>
  documentPermissions.find((item) => item.code === (documentAliases[code] ?? code));

export const datasetPermissions: PermissionItem[] = ['RawData', 'SDTM', 'ADaM'].flatMap((group) =>
  ['DUMMY', 'PROD'].map((label) => ({
    code: group + '/' + label, group, label,
    values: ['PD', 'WPD', label === 'PROD' ? 'PD' : 'WPD', group === 'ADaM' ? 'PD' : 'WPD', 'P'],
  })));

export function permissionValue(sid: string, scope: PermissionScope, role: MemberRole, item: PermissionItem) {
  const [initial, ceiling = initial] = item.values[Object.keys(permissionRoles).indexOf(role)].split('/');
  const current = getDb().studyPolicies?.[sid]?.[scope]?.[role + ':' + item.code] ?? initial;
  return { ceiling, current };
}

export function activeStudyMember(sid: string, userId = ME_USER.id) {
  const now = nowIso();
  return getDb().members.find((m) => m.studyId === sid && m.userId === userId && m.status === 'ACTIVE'
    && m.validFrom <= now && (!m.validUntil || now < m.validUntil));
}

export function canViewStudyPermissions(sid: string) {
  const study = S.study(sid);
  return Boolean(study && study.tenant === DEMO_TENANT && study.lifecycle !== 'DELETED'
    && getDb().me.name === ME_USER.name && activeStudyMember(sid)?.isAdmin
    && effectiveDuty({ study }) === 'Study Admin');
}

export interface PermissionChange {
  role: MemberRole;
  item: PermissionItem;
  proposed: string;
}

export function saveStudyPermissions(sid: string, scope: PermissionScope, reason: string, changes: PermissionChange[]) {
  if (!canViewStudyPermissions(sid) || S.study(sid)?.lifecycle !== 'ACTIVE') return false;
  if (!reason.trim() || reason.trim().length > 1000 || !changes.length) return false;
  const catalog = scope === 'document' ? documentPermissions : datasetPermissions;
  if (changes.some(({ role, item, proposed }) => {
    const target = catalog.find(({ code }) => code === item.code);
    return !target || !Object.hasOwn(permissionRoles, role)
      || [...proposed].some((action) => !permissionValue(sid, scope, role, target).ceiling.includes(action));
  })) return false;
  const details = changes.map(({ role, item, proposed }) => {
    const label = [permissionRoles[role], item.group, item.label, item.track].filter(Boolean).join(' / ');
    return diff(label, permissionValue(sid, scope, role, item).current, proposed);
  });
  const db = getDb();
  const all = db.studyPolicies ??= {};
  const study = all[sid] ??= {};
  const policy = study[scope] ??= {};
  for (const { role, item, proposed } of changes) policy[role + ':' + item.code] = proposed;
  logAudit({ studyId: sid, action: 'Study permissions updated', changes: details.join(' | '), reason });
  emit();
  return true;
}
