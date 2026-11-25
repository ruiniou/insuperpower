import { nowIso } from '@wiz/isp';
import { getDb } from './store';
import type { AuditEvent } from './types';

/**
 * Study 审计：记录只增，不改、不删；只在操作成功的路径里写，校验或权限失败不写。
 * time 为本地 ISO 串 `YYYY-MM-DDTHH:mm`（字典序即时间序），DB.audit 新的在前。Study 删除另存模拟复核与结果证据
 */
export function logAudit(e: Pick<AuditEvent, 'studyId' | 'action' | 'changes' | 'deletion'> & { reason?: string | null }): AuditEvent {
  const db = getDb();
  const rec: AuditEvent = { id: 'AU-' + String(++db.seq.audit).padStart(4, '0'), studyId: e.studyId, time: nowIso(), actor: db.me.name, action: e.action, changes: e.changes, reason: e.reason?.trim() || null, ...(e.deletion && { deletion: e.deletion }) };
  db.audit.unshift(rec);
  return rec;
}

/** 该 Study 的记录，时间倒序（同一分钟内保持写入顺序，后写的在前） */
export const auditOf = (sid: string): AuditEvent[] => getDb().audit.filter((a) => a.studyId === sid).sort((a, b) => (a.time < b.time ? 1 : a.time > b.time ? -1 : 0));

/** 字段变化：`Phase: Phase II → Phase III`；空值写 — */
export const diff = (label: string, from: string, to: string) => label + ': ' + (from || '—') + ' → ' + (to || '—');
