import { dLong } from './dates';
import { ME_USER, ROLES, TENANT_USERS, userById } from './people';
import { can } from './role';
import { S } from './selectors';
import { emit, getDb, toast } from './store';
import { logAudit } from './audit';
import { formatRange } from '@wiz/isp';
import type { BlindAttr, EventRec, MemberRole, StudyMember, Workflow } from './types';
import { isValidIso, nowIso } from '@wiz/isp';

export type MemberErrors = Record<string, string>;

/** 成员行（Add members、Edit、Create Study 共用）。key 只用于界面区分行 */
export interface MemberRow { key: number; userId: string; role: string; attr: string; validFrom: string; validUntil: string }
export const emptyMemberRow = (key: number, o: Partial<MemberRow> = {}): MemberRow => ({ key, userId: '', role: 'VIEW', attr: 'UNSET', validFrom: '', validUntil: '', ...o });
export type MemberField = 'user' | 'role' | 'attr' | 'from' | 'to';
export const memberKey = (key: number, field: MemberField) => 'm:' + key + ':' + field;

export const roleLabel = (v: string) => ROLES.find((r) => r.value === v)?.label ?? v;
export const attrLabel = (v: string) => (v === 'BLINDED' ? 'Blinded' : v === 'UNBLINDED' ? 'Unblinded' : 'Unspecified');

export const MSG_NO_REVERT = 'Unblinded can’t be changed back to Blinded.';
export const MSG_NO_UNSET = 'Can’t be changed back to Unspecified.';
export const MSG_REQUIRED_BLINDED = 'Required while the study is blinded.';
export const MSG_NOT_ENFORCED = 'Not enforced while the study is not blinded.';

/** 成员有效期精确到分钟：本地时间 ISO 串 YYYY-MM-DDTHH:mm（系统时区）。区间为 [开始, 结束)：从开始时刻生效，到结束时刻失效；结束可空 */
export const validDate = isValidIso;
export const todayIso = nowIso;

export interface RowCheck {
  /** Study 级盲态为 Blinded：属性必填，不能是 Unspecified */
  studyBlinded: boolean;
  /** 该成员已有的属性：设过 Blinded 或 Unblinded 后不能回到 Unspecified；Unblinded 不能改回 Blinded */
  prevAttr?: string;
}
/** 单行字段校验（不含去重与「已是成员」），返回 user / role / attr / from / to 的错误 */
export function validateMemberRow(row: Pick<MemberRow, 'userId' | 'role' | 'attr' | 'validFrom' | 'validUntil'>, opt: RowCheck): Partial<Record<MemberField, string>> {
  const er: Partial<Record<MemberField, string>> = {}, from = row.validFrom.trim(), to = row.validUntil.trim();
  if (!row.userId) er.user = 'Select a person.';
  if (!row.role) er.role = 'Select a Role.';
  if (opt.studyBlinded && row.attr !== 'BLINDED' && row.attr !== 'UNBLINDED') er.attr = 'Select Blinded or Unblinded.';
  else if (opt.prevAttr && opt.prevAttr !== 'UNSET' && row.attr === 'UNSET') er.attr = MSG_NO_UNSET;
  else if (opt.prevAttr === 'UNBLINDED' && row.attr === 'BLINDED') er.attr = MSG_NO_REVERT;
  if (!from) er.from = 'Enter a start time.'; else if (!validDate(from)) er.from = 'Use a valid date and time.';
  if (to && !validDate(to)) er.to = 'Use a valid date and time.';
  else if (to && !er.from && to <= from) er.to = 'End time must be after start time.';
  return er;
}

/** 校验一批行：逐行字段校验加批内重复。返回键 m:<行键>:<字段> */
export function validateMemberRows(rows: MemberRow[], opt: RowCheck, prevOf?: (userId: string) => string | undefined): MemberErrors {
  const er: MemberErrors = {}, seen = new Set<string>();
  rows.forEach((r) => {
    const e = validateMemberRow(r, { ...opt, prevAttr: opt.prevAttr ?? prevOf?.(r.userId) });
    (Object.keys(e) as MemberField[]).forEach((f) => { er[memberKey(r.key, f)] = e[f]!; });
    if (!e.user) { if (seen.has(r.userId)) er[memberKey(r.key, 'user')] = 'Already added.'; seen.add(r.userId); }
  });
  return er;
}

/* ───────── 读取 ───────── */
export const membersOf = (sid: string): StudyMember[] => getDb().members.filter((m) => m.studyId === sid);
export const activeMembers = (sid: string): StudyMember[] => membersOf(sid).filter((m) => m.status === 'ACTIVE');
export const memberCount = (sid: string) => activeMembers(sid).length;
export const memberOf = (sid: string, userId: string): StudyMember | undefined => membersOf(sid).find((m) => m.userId === userId);
/** 当前用户在该 Study 的有效成员记录 */
export const myMembership = (sid: string): StudyMember | undefined => activeMembers(sid).find((m) => m.userId === ME_USER.id);
export const isStudyBlinded = (sid: string) => S.study(sid)?.blinding === 'Blinded';
/** Study Admin 置顶，其余按姓名 */
export const sortMembers = (list: StudyMember[]): StudyMember[] => [...list].sort((a, b) => Number(b.isAdmin) - Number(a.isAdmin) || a.name.localeCompare(b.name));
/** 候选人：当前租户用户里还不是 Active 成员的（REMOVED 的可以重新加入） */
export const candidatesOf = (sid: string) => TENANT_USERS.filter((u) => !activeMembers(sid).some((m) => m.userId === u.id));

const canManage = (sid: string) => can('study.member.manage', { study: S.study(sid) });
export const canChangeBlinding = (sid: string) => can('study.member_blinding.manage', { study: S.study(sid) });
export const canTransferAdmin = (sid: string) => S.study(sid)?.lifecycle === 'ACTIVE' && can('study.owner.transfer', { study: S.study(sid) });
/** Add members 是否可用：Study 为 Blinded 时属性必填，需要同时有改盲点位 */
export const canAddMembers = (sid: string) => canManage(sid) && (!isStudyBlinded(sid) || canChangeBlinding(sid));
const plural = (n: number, w: string) => n + ' ' + w + (n === 1 ? '' : 's');

/** 本 Study 可选的 Event Owner：Active 成员 */
export function peopleOf(sid: string): string[] { return sortMembers(activeMembers(sid)).map((m) => m.name); }

/* ───────── 新增 ───────── */
function apply(sid: string, r: MemberRow): StudyMember {
  const db = getDb(), u = userById(r.userId)!, ex = memberOf(sid, r.userId);
  const patch = { role: r.role as MemberRole, attr: r.attr as BlindAttr, validFrom: r.validFrom.trim(), validUntil: r.validUntil.trim() || null, status: 'ACTIVE' as const };
  if (ex) { Object.assign(ex, patch); return ex; }
  const m: StudyMember = { id: 'M-' + String(++db.seq.member).padStart(3, '0'), studyId: sid, userId: u.id, name: u.name, email: u.email, isAdmin: false, ...patch };
  db.members.push(m);
  return m;
}

export interface AddMembersForm { sid: string; rows: MemberRow[]; reason: string }
export interface AddMembersResult { errors: MemberErrors; /** 已成功添加的行键 */ done: number[] }
/** 批量添加。字段校验不过则一行都不加；通过后逐行处理，「已是 Active 成员」的行报错，其余照常添加。REMOVED 的用户恢复原记录并覆盖设置 */
export function addMembers(f: AddMembersForm): AddMembersResult {
  if (!canAddMembers(f.sid)) return { errors: { form: 'You no longer have permission to add members.' }, done: [] };
  // 没有改盲点位：属性固定为 Unspecified，不接受调用方传入的值
  const rows = canChangeBlinding(f.sid) ? f.rows : f.rows.map((r) => ({ ...r, attr: 'UNSET' }));
  const er = validateMemberRows(rows, { studyBlinded: isStudyBlinded(f.sid) }, (uid) => { const x = memberOf(f.sid, uid); return x?.status === 'REMOVED' ? x.attr : undefined; });
  const reason = f.reason.trim();
  if (!reason) er.reason = 'Enter a reason.'; else if (reason.length > 1000) er.reason = 'Use 1000 characters or fewer.';
  if (Object.keys(er).length) return { errors: er, done: [] };
  const done: number[] = [], bad: MemberErrors = {};
  rows.forEach((r) => {
    if (memberOf(f.sid, r.userId)?.status === 'ACTIVE') { bad[memberKey(r.key, 'user')] = 'Already a member.'; return; }
    apply(f.sid, r); done.push(r.key);
  });
  if (done.length) {
    const st = S.study(f.sid); if (st) st.updated = dLong();
    const added = rows.filter((r) => done.includes(r.key)).map((r) => userById(r.userId)!.name + ' (' + roleLabel(r.role) + ')').join(', ');
    logAudit({ studyId: f.sid, action: 'Member added', changes: added, reason });
  }
  if (done.length && !Object.keys(bad).length) toast('Added ' + plural(done.length, 'member'));
  emit();
  return { errors: bad, done };
}

/* ───────── 编辑角色与有效期 ───────── */
export type EditForm = { sid: string; memberId: string; row: MemberRow; reason: string };
/** 只改 Role 与有效期；盲态属性走 changeBlinding，这里忽略调用方传入的 attr */
export function updateMember(f: EditForm): { errors: MemberErrors } | { ok: true } {
  const m = getDb().members.find((x) => x.id === f.memberId && x.studyId === f.sid);
  if (!m) return { errors: { form: 'Member not found.' } };
  if (!canManage(f.sid)) return { errors: { form: 'You no longer have permission to manage members.' } };
  const er = validateMemberRows([{ ...f.row, userId: m.userId, attr: m.attr }], { studyBlinded: false });
  const reason = f.reason.trim();
  if (!reason) er.reason = 'Enter a reason.'; else if (reason.length > 1000) er.reason = 'Use 1000 characters or fewer.';
  if (Object.keys(er).length) return { errors: er };
  const role = f.row.role as MemberRole, validFrom = f.row.validFrom.trim(), validUntil = f.row.validUntil.trim() || null;
  const changed = [
    role !== m.role && 'Role ' + roleLabel(m.role) + ' → ' + roleLabel(role),
    (validFrom !== m.validFrom || validUntil !== m.validUntil) && 'Validity ' + formatRange(m.validFrom, m.validUntil) + ' → ' + formatRange(validFrom, validUntil),
  ].filter(Boolean).join('; ');
  logAudit({ studyId: f.sid, action: 'Member updated', changes: m.name + ': ' + (changed || 'No fields changed'), reason });
  Object.assign(m, { role, validFrom, validUntil });
  const st = S.study(f.sid); if (st) st.updated = dLong();
  toast('Updated ' + m.name); emit();
  return { ok: true };
}

/* ───────── 改盲态属性 ───────── */
export interface ChangeBlindingForm { sid: string; memberId: string; attr: string; reason: string }
/** 校验与创建、加人共用 validateMemberRow：Unblinded 不能回 Blinded；Blinded 的 Study 里不能是 Unspecified */
export function changeBlinding(f: ChangeBlindingForm): { errors: MemberErrors } | { ok: true } {
  const m = getDb().members.find((x) => x.id === f.memberId && x.studyId === f.sid);
  if (!m || m.status !== 'ACTIVE') return { errors: { form: 'Member not found.' } };
  if (!canChangeBlinding(f.sid)) return { errors: { form: 'You no longer have permission to change blinding status.' } };
  const er: MemberErrors = {};
  const a = validateMemberRow({ userId: m.userId, role: m.role, attr: f.attr, validFrom: m.validFrom, validUntil: m.validUntil ?? '' }, { studyBlinded: isStudyBlinded(f.sid), prevAttr: m.attr }).attr;
  if (a) er.attr = a; else if (f.attr === m.attr) er.attr = 'Choose a different value.';
  const reason = f.reason.trim();
  if (!reason) er.reason = 'Enter a reason.'; else if (reason.length > 1000) er.reason = 'Use 1000 characters or fewer.';
  if (Object.keys(er).length) return { errors: er };
  logAudit({ studyId: f.sid, action: 'Blinding status changed', changes: m.name + ': ' + attrLabel(m.attr) + ' → ' + attrLabel(f.attr), reason });
  m.attr = f.attr as BlindAttr;
  const st = S.study(f.sid); if (st) st.updated = dLong();
  toast('Blinding status of ' + m.name + ' changed to ' + attrLabel(f.attr)); emit();
  return { ok: true };
}

/* ───────── 移交 Study Admin ───────── */
export interface TransferForm { sid: string; toMemberId: string; reason: string }
/** 新 Admin 只能从其他 Active 成员里选。原 Admin 保留成员身份与原有设置；不改 Event Owner、Workflow 负责人 */
export function transferStudyAdmin(f: TransferForm): { errors: MemberErrors } | { ok: true } {
  const st = S.study(f.sid), cur = membersOf(f.sid).find((x) => x.isAdmin);
  if (!st || !cur) return { errors: { form: 'Study not found.' } };
  if (!canTransferAdmin(f.sid)) return { errors: { form: 'You no longer have permission to transfer the Study Admin.' } };
  const er: MemberErrors = {}, to = activeMembers(f.sid).find((x) => x.id === f.toMemberId && !x.isAdmin);
  if (!to) er.to = 'Select a new Study Admin.';
  const reason = f.reason.trim();
  if (!reason) er.reason = 'Enter a reason.'; else if (reason.length > 1000) er.reason = 'Use 1000 characters or fewer.';
  if (Object.keys(er).length || !to) return { errors: er };
  cur.isAdmin = false; to.isAdmin = true; st.admin = to.name; st.updated = dLong();
  logAudit({ studyId: f.sid, action: 'Study Admin transferred', changes: cur.name + ' → ' + to.name, reason });
  toast('Study Admin transferred to ' + to.name); emit();
  return { ok: true };
}

/* ───────── 移除 ───────── */
export interface RemovalImpact { events: EventRec[]; workflows: { event: EventRec; wf: Workflow }[] }
/** 该成员在本 Study 里需要交接的内容：担任 Owner 的 Event、负责的 Workflow（Event 非 Archived） */
export function removalImpact(sid: string, name: string): RemovalImpact {
  const live = S.eventsOf(sid).filter((e) => e.status !== 'Archived');
  return {
    events: live.filter((e) => e.owner === name),
    workflows: live.flatMap((event) => event.wfs.filter((wf) => wf.owner === name).map((wf) => ({ event, wf }))),
  };
}
export const wfKey = (eid: string, wid: string) => 'wf:' + eid + ':' + wid;
export const evKey = (eid: string) => 'ev:' + eid;

export interface RemoveForm { sid: string; memberId: string; reason: string; /** wfKey -> 新负责人姓名 */ workflowOwners: Record<string, string>; /** evKey -> 新 Owner 姓名 */ eventOwners: Record<string, string> }
export function removeMember(f: RemoveForm): { errors: MemberErrors } | { ok: true } {
  const m = getDb().members.find((x) => x.id === f.memberId && x.studyId === f.sid);
  if (!m || m.status !== 'ACTIVE') return { errors: { form: 'Member not found.' } };
  if (!canManage(f.sid)) return { errors: { form: 'You no longer have permission to manage members.' } };
  if (m.isAdmin) return { errors: { form: 'The Study Admin can’t be removed.' } };
  const er: MemberErrors = {}, impact = removalImpact(f.sid, m.name);
  const ok = new Set(activeMembers(f.sid).filter((x) => x.id !== m.id).map((x) => x.name));
  impact.workflows.forEach(({ event, wf }) => { const k = wfKey(event.id, wf.id); if (!ok.has(f.workflowOwners[k])) er[k] = 'Select a new owner.'; });
  impact.events.forEach((e) => { const k = evKey(e.id); if (!ok.has(f.eventOwners[k])) er[k] = 'Select a new owner.'; });
  const reason = f.reason.trim();
  if (!reason) er.reason = 'Enter a reason.'; else if (reason.length > 1000) er.reason = 'Use 1000 characters or fewer.';
  if (Object.keys(er).length) return { errors: er };
  impact.workflows.forEach(({ event, wf }) => { wf.owner = f.workflowOwners[wfKey(event.id, wf.id)]; wf.updated = dLong(); event.updated = dLong(); });
  impact.events.forEach((e) => { e.owner = f.eventOwners[evKey(e.id)]; e.updated = dLong(); });
  m.status = 'REMOVED';
  const handed = impact.workflows.length + impact.events.length;
  logAudit({ studyId: f.sid, action: 'Member removed', changes: m.name + (handed ? ', handed over ' + plural(handed, 'item') : ''), reason });
  const st = S.study(f.sid); if (st) st.updated = dLong();
  toast('Removed ' + m.name); emit();
  return { ok: true };
}
