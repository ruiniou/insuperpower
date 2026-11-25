import { logAudit } from './audit';
import { dLong } from './dates';
import { can } from './role';
import { S } from './selectors';
import { emit, getDb } from './store';
import type { Errors } from './study';

type DeletionBlocker = {
  label: string;
  detail: string;
  destination?: 'events' | 'asset' | 'dataset' | 'blinding';
};

const countLabel = (count: number, singular: string) => `${count} ${singular}${count === 1 ? '' : 's'}`;

export type DeletionCheck =
  | { status: 'PASS'; snapshot: string; revision: string }
  | { status: 'BLOCK'; blockers: DeletionBlocker[]; hasFormalEvidence: boolean }
  | { status: 'UNKNOWN' | 'UNAVAILABLE' };

export function checkStudyDeletion(sid: string): DeletionCheck {
  const study = S.study(sid);
  if (!study || !can('study.delete', { study })) return { status: 'UNAVAILABLE' };

  const db = getDb();
  const signals = db.studyDeletionSignals?.[sid];
  if (signals?.unavailable) return { status: 'UNKNOWN' };

  const events = S.eventsOf(sid);
  const assets = db.assets.filter((a) => a.studyId === sid && a.versions.length);
  const datasets = S.datasetsOf(sid).filter((d) => d.versions.length);
  const protections = db.protections.filter((p) => p.studyId === sid);
  const baselines = db.baselines.filter((b) => b.studyId === sid);
  const history = db.audit.filter((a) => a.studyId === sid);
  const statusOf = (e: (typeof events)[number]) => Object.values(e.flow.st);
  const hasExecution = (e: (typeof events)[number]) => e.produced.length > 0
    || Object.values(e.flow.ver).some((v) => v > 1)
    || statusOf(e).some((s) => s === 'locked' || s === 'stale' || s === 'review' || s === 'running');
  const hasFormalRecord = (e: (typeof events)[number]) => hasExecution(e)
    || e.scope === 'FORMAL' || e.flow.st.pkg !== 'empty';
  const hasEventRecords = events.some(hasFormalRecord);
  const blockedEvents = events.filter((e) => hasFormalRecord(e) || Object.values(e.flow.rev.pend).some(Boolean));
  const protectedHistory = study.blinding === 'Blinded' || protections.length > 0
    || history.some((a) => a.action === 'Blinding enabled' || a.action === 'Study unblinded');
  const assetVersions = assets.reduce((count, asset) => count + asset.versions.length, 0);
  const datasetVersions = datasets.reduce((count, dataset) => count + dataset.versions.length, 0);
  const assetDetails = [
    assetVersions && countLabel(assetVersions, 'version'),
    baselines.length && countLabel(baselines.length, 'baseline'),
  ].filter(Boolean).join(', ');
  const activeOperations = signals?.activeOperations ?? 0;
  const categories: (DeletionBlocker | false)[] = [
    blockedEvents.length > 0 && {
      label: 'Events',
      detail: `${blockedEvents.length} with records or pending work`,
      destination: 'events',
    },
    !!assetDetails && { label: 'Assets', detail: assetDetails, destination: 'asset' },
    datasetVersions > 0 && { label: 'Datasets', detail: countLabel(datasetVersions, 'version'), destination: 'dataset' },
    protectedHistory && { label: 'Blinding', detail: 'Protected records', destination: 'blinding' },
    activeOperations > 0 && { label: 'Active operations', detail: countLabel(activeOperations, 'operation') },
    !!signals?.retentionHold && { label: 'Retention restriction', detail: '' },
  ];
  const blockers = categories.filter((category): category is DeletionBlocker => category !== false);

  if (blockers.length) {
    return { status: 'BLOCK', blockers, hasFormalEvidence: !!(hasEventRecords || assetDetails || datasetVersions || protectedHistory || signals?.retentionHold) };
  }

  // Compare the current Demo inputs, excluding transient workflow UI state.
  const revision = history[0]?.id ?? study.updated;
  const snapshot = JSON.stringify([db.me.name, study, revision, signals, events.map(({ flow, ...event }) => ({
    ...event, st: flow.st, ver: flow.ver, pendingReviews: flow.rev.pend,
  }))]);
  return { status: 'PASS', snapshot, revision };
}

type PassedCheck = Extract<DeletionCheck, { status: 'PASS' }>;
export type DeleteStudyIntent = { sid: string; code: string; reason: string; check: PassedCheck };

export function validateStudyDeletion(intent: DeleteStudyIntent): { errors: Errors; check: DeletionCheck } {
  const { sid, code, reason, check: previous } = intent;
  const check = checkStudyDeletion(sid);
  const errors: Errors = {};
  if (check.status !== 'PASS') return { errors, check };
  if (check.snapshot !== previous.snapshot) {
    errors.form = 'This study or its dependencies changed. Check again before continuing.';
  }
  if (code !== S.study(sid)?.id) errors.code = 'Enter the exact study code.';
  if (!reason.trim()) errors.reason = 'Enter a reason for the deletion.';
  else if (reason.trim().length > 1000) errors.reason = 'Use 1000 characters or fewer.';
  return { errors, check };
}

export function deleteStudy(intent: DeleteStudyIntent, verification: 'passed' | 'failed', requestId: string) {
  const { sid, reason } = intent;
  const study = S.study(sid);
  if (verification !== 'passed') return { verificationFailed: true } as const;

  const result = validateStudyDeletion(intent);
  if (!study || result.check.status !== 'PASS' || Object.keys(result.errors).length) return result;

  study.lifecycle = 'DELETED';
  study.updated = dLong();
  logAudit({
    studyId: sid,
    action: 'Study deleted',
    changes: 'Active → Deleted',
    reason,
    deletion: { requestId, tenant: study.tenant, checkedRevision: result.check.revision, verification: 'Demo', result: 'Succeeded' },
  });
  emit();
  return { ok: true } as const;
}
