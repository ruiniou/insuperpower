import { beforeEach, describe, expect, it } from 'vitest';
import { auditOf } from './audit';
import { can, setDuty } from './role';
import { S } from './selectors';
import { getDb, resetDb } from './store';
import { archiveCheck, archiveStudy, createEvent, restoreStudy } from './study';
import { checkStudyDeletion, deleteStudy, type DeleteStudyIntent } from './studyDeletion';

const sid = 'TMP-001';
const reason = 'Duplicate entry for the feasibility study.';
const ready = (): DeleteStudyIntent => {
  const check = checkStudyDeletion(sid);
  if (check.status !== 'PASS') throw new Error('Expected a passing deletion check');
  return { sid, code: sid, reason, check };
};

beforeEach(() => { resetDb(); setDuty('System Owner'); });

describe('Study deletion', () => {
  it('allows same-tenant System Owner or the effective target Study Admin only', () => {
    const study = S.study('STU-001')!;
    expect(can('study.delete', { study }, 'System Owner')).toBe(true);
    expect(can('study.delete', { study }, 'Study Admin')).toBe(true);
    for (const duty of ['Member', 'Event Owner'] as const) {
      expect(can('study.delete', { study }, duty)).toBe(false);
    }
    expect(can('study.delete', { study: S.study(sid) }, 'Study Admin')).toBe(false);
    expect(can('study.delete', { study: S.study('STU-003') })).toBe(false);
    const member = getDb().members.find((m) => m.studyId === study.id && m.isAdmin)!;
    member.validUntil = '2000-01-01T00:00';
    expect(can('study.delete', { study }, 'Study Admin')).toBe(false);
    member.status = 'REMOVED';
    member.validUntil = null;
    expect(can('study.delete', { study }, 'Study Admin')).toBe(false);
    study.tenant = 'Other Tenant';
    expect(can('study.delete', { study })).toBe(false);
    getDb().me.name = 'Inactive account';
    expect(can('study.delete', { study: S.study(sid) })).toBe(false);
  });

  it('distinguishes deletion blocks from Archive checks and retains protection after unblinding', () => {
    expect(archiveCheck('STU-001').status).toBe('PASS');
    expect(checkStudyDeletion('STU-001')).toMatchObject({
      status: 'BLOCK', blockers: [
        { label: 'Events', detail: '2 with records or pending work', destination: 'events' },
        expect.objectContaining({ label: 'Assets', destination: 'asset' }),
        expect.objectContaining({ label: 'Datasets', destination: 'dataset' }),
      ],
    });
    expect(checkStudyDeletion('STU-002')).toMatchObject({
      status: 'BLOCK', blockers: expect.arrayContaining([expect.objectContaining({ label: 'Events' }), expect.objectContaining({ label: 'Blinding' })]),
    });
    const s = S.study('STU-002')!;
    s.blinding = 'Unblinded';
    getDb().protections = [];
    expect(checkStudyDeletion(s.id)).toMatchObject({
      status: 'BLOCK', blockers: expect.arrayContaining([expect.objectContaining({ label: 'Blinding' })]),
    });
    getDb().studyDeletionSignals = { [sid]: { activeOperations: 1, retentionHold: true } };
    expect(checkStudyDeletion(sid)).toMatchObject({ status: 'BLOCK', blockers: [expect.objectContaining({ label: 'Active operations' }), expect.objectContaining({ label: 'Retention restriction' })] });
  });

  it('rejects invalid input, verification failure and changed snapshots without writing any data', () => {
    const intent = ready();
    const before = structuredClone(getDb());
    expect(deleteStudy({ ...intent, code: 'tmp-001 ', reason: '  ' }, 'passed', 'request')).toMatchObject({
      errors: { code: expect.any(String), reason: expect.any(String) },
    });
    expect(deleteStudy({ ...intent, reason: 'x'.repeat(1001) }, 'passed', 'request')).toMatchObject({ errors: { reason: expect.any(String) } });
    expect(deleteStudy(intent, 'failed', 'request')).toEqual({ verificationFailed: true });
    expect(getDb()).toEqual(before);
    S.study(sid)!.name = 'Renamed';
    expect(deleteStudy(intent, 'passed', 'request')).toMatchObject({ errors: { form: expect.stringContaining('changed') } });
    getDb().studyDeletionSignals = { [sid]: { unavailable: true } };
    expect(deleteStudy(intent, 'passed', 'request')).toMatchObject({ check: { status: 'UNKNOWN' } });
    getDb().studyDeletionSignals = { [sid]: { retentionHold: true } };
    expect(deleteStudy(intent, 'passed', 'request')).toMatchObject({ check: { status: 'BLOCK' } });
    setDuty('Member');
    expect(deleteStudy(intent, 'passed', 'request')).toMatchObject({ check: { status: 'UNAVAILABLE' } });
    expect(S.study(sid)?.lifecycle).toBe('ACTIVE');
    expect(getDb().audit).toEqual(before.audit);
  });

  it('preserves history and closes ordinary entry points after a single successful write', () => {
    const event = createEvent({ sid, scope: 'EXPLORATORY', name: 'Exploratory analysis', goal: '', reason, refs: {} });
    if (!('id' in event) || !event.id) throw new Error('Expected an exploratory event');
    expect(S.workspaceEvent(event.id)).toBeDefined();
    const intent = ready();
    expect(deleteStudy(intent, 'passed', 'request')).toEqual({ ok: true });
    expect(deleteStudy(intent, 'passed', 'request')).toMatchObject({ check: { status: 'UNAVAILABLE' } });
    expect(S.study(sid)?.lifecycle).toBe('DELETED');
    expect(S.workspaceStudy(sid)).toBeUndefined();
    expect(S.workspaceEvent(event.id)).toBeUndefined();
    expect(S.event(event.id)).toBeDefined();
    expect(archiveStudy(sid, reason)).toHaveProperty('errors');
    expect(restoreStudy(sid, reason)).toHaveProperty('errors');
    expect(auditOf(sid)).toEqual([expect.objectContaining({
      action: 'Study deleted', changes: 'Active → Deleted', actor: 'User Name', reason,
      deletion: { requestId: 'request', result: 'Succeeded', tenant: 'Demo Tenant', checkedRevision: intent.check.revision, verification: 'Demo' },
    })]);
  });
});
