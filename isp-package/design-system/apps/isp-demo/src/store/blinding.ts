import { dLong } from './dates';
import { logAudit } from './audit';
import { activeMembers } from './members';
import { can } from './role';
import { S } from './selectors';
import { emit, getDb, toast } from './store';

export type BlindingErrors = Record<string, string>;
export const unspecifiedMembers = (sid: string) => activeMembers(sid).filter((m) => m.attr === 'UNSET');
export const protectionsOf = (sid: string) => getDb().protections.filter((p) => p.studyId === sid);

function check(sid: string, expected: 'Unblinded' | 'Blinded', reasonRaw: string): { errors: BlindingErrors } | { reason: string } {
  const study = S.study(sid);
  if (!study) return { errors: { form: 'Study not found.' } };
  if (!can('study.blinding.manage', { study })) return { errors: { form: 'You do not have permission to manage study blinding.' } };
  if (study.blinding !== expected) return { errors: { form: 'Study blinding changed. Close this dialog and review the current status.' } };
  const reason = reasonRaw.trim();
  if (!reason) return { errors: { reason: 'Enter a reason for this change.' } };
  if (reason.length > 1000) return { errors: { reason: 'Use 1000 characters or fewer.' } };
  return { reason };
}

/** Study 级盲态与成员盲态属性各自存储；启用不修改成员属性。 */
export function enableBlinding(sid: string, reasonRaw: string): { errors: BlindingErrors } | { ok: true } {
  const result = check(sid, 'Unblinded', reasonRaw);
  if ('errors' in result) return result;
  const unset = unspecifiedMembers(sid);
  if (unset.length) return { errors: { form: 'Set a blinding status for every active member before enabling blinding.' } };
  const db = getDb();
  for (const dataset of db.datasets.filter((d) => d.studyId === sid && d.space === 'prod')) {
    const existing = db.protections.find((p) => p.studyId === sid && p.datasetId === dataset.id);
    const versions = dataset.versions.map((v) => v.n);
    if (existing) {
      existing.versions = Array.from(new Set([...existing.versions, ...versions]));
      existing.future = true;
    } else db.protections.push({ studyId: sid, datasetId: dataset.id, versions, future: true });
  }
  const study = S.study(sid)!;
  study.blinding = 'Blinded';
  study.updated = dLong();
  logAudit({ studyId: sid, action: 'Blinding enabled', changes: 'Unblinded → Blinded', reason: result.reason });
  toast('Blinding enabled', { type: 'success' });
  emit();
  return { ok: true };
}

/** 揭盲不修改成员属性、保护记录、Event 或 Workflow。 */
export function unblindStudy(sid: string, reasonRaw: string): { errors: BlindingErrors } | { ok: true } {
  const result = check(sid, 'Blinded', reasonRaw);
  if ('errors' in result) return result;
  const study = S.study(sid)!;
  study.blinding = 'Unblinded';
  study.updated = dLong();
  logAudit({ studyId: sid, action: 'Study unblinded', changes: 'Blinded → Unblinded', reason: result.reason });
  toast('Study unblinded', { type: 'success' });
  emit();
  return { ok: true };
}
