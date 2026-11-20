import { DS_CATS, FILE_OK, MODE_SPACE, SHORT, TYPE } from './assets';
import { DS_FILE_OK } from './actions';
import { dLong, dShort } from './dates';
import { SPACES } from './config';
import { S } from './selectors';
import { can } from './role';
import { newFlow, V } from './seed';
import { baselineAsset, baselinesOf, baselineUsers, BL_NAME, currentBaseline, isBlCode } from './baseline';
import { emit, getDb, toast } from './store';
import { memberKey, peopleOf, todayIso, validateMemberRows, validDate, type MemberRow } from './members';
import { ME_USER, userById } from './people';
import type { Asset, Baseline, BlindAttr, Dataset, EventRec, MemberRole } from './types';

export { memberKey, peopleOf, validDate };

const extOf = (n: string) => (n.split('.').pop() || '').toLowerCase();
const noCtl = (s: string) => /[\u0000-\u001f\u007f]/.test(s);
const plural = (n: number, w: string) => n + ' ' + w + (n === 1 ? '' : 's');
export type Errors = Record<string, string>;

/** Create Event 默认引用：该 Study 下 SAP、CRF 各取一个（有版本者）的最新版 */
export function defaultEventRefs(sid: string): Record<string, number> {
  const refs: Record<string, number> = {}, seen: Record<string, boolean> = {};
  S.assetsOf(sid).forEach((a) => { if ((a.code === 'SAP' || a.code === 'CRF') && a.versions.length && !seen[a.code]) { seen[a.code] = true; refs[a.id] = S.latest(a).n; } });
  return refs;
}

export interface CreateEventForm { sid: string; name: string; goal: string; scope: string; reason: string; refs: Record<string, number> }
/** 创建 Event：校验（名称必填 ≤200 无控制字符；原因必填 ≤1000），写入 DB 头部，返回新 id 或错误 */
export function createEvent(f: CreateEventForm): { errors: Errors } | { id: string; nAssets: number } {
  const db = getDb(), er: Errors = {}, name = f.name.trim(), reason = f.reason.trim();
  if (!name) er.name = 'Event name is required.'; else if (name.length > 200) er.name = 'Use 200 characters or fewer.'; else if (noCtl(name)) er.name = 'Remove control characters.';
  if (!reason) er.reason = 'Reason for change is required (1–1000 characters).'; else if (reason.length > 1000) er.reason = 'Use 1000 characters or fewer.';
  if (Object.keys(er).length) return { errors: er };
  const id = 'EVT-' + String(++db.seq.event).padStart(3, '0');
  const refs: EventRec['refs'] = { assets: {}, datasets: {} };
  Object.keys(f.refs).forEach((aid) => { refs.assets[aid] = { v: f.refs[aid], use: '—' }; });
  const e: EventRec = { id, studyId: f.sid, name, status: 'In progress', owner: db.me.name, goal: f.goal.trim(), scope: f.scope, reason, wfs: [], adopted: '—', updated: dLong(), members: 1, refs, produced: [], flow: newFlow({ ui: { sel: 'toc', edge: null, inputsOpen: true, confirm: null } }) };
  db.events.unshift(e);
  const st = S.study(f.sid); if (st) st.updated = dLong();
  const n = Object.keys(refs.assets).length;
  toast('Event created' + (n ? ', ' + plural(n, 'asset') + ' referenced' : ''));
  emit();
  return { id, nAssets: n };
}

export type BaselineMode = 'new' | 'current';
export interface UploadAssetForm { sid: string; assetId: string | null; code: string; name: string; meta: Record<string, string>; fileName: string; reason: string; version: string; baselineMode: BaselineMode; baselineLabel: string }
export const usedByEvents = (n: number) => 'Used by ' + n + (n === 1 ? ' event' : ' events') + '. Start a new baseline instead.';
const sameLabel = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** 上传文件 / 新版本：新文件会顶替同类型的「Required · Not uploaded」占位。
 *  Protocol 与 SAP：Study 内各只有一个 Asset，已有则追加版本；同时新建 Baseline（未改的槽位沿用 Current）或替换 Current 的同类槽位（Current 被引用时不可替换） */
export function uploadAsset(f: UploadAssetForm): { errors: Errors } | { asset: Asset } {
  const db = getDb(), er: Errors = {}, t = TYPE(f.code);
  const bl = !!t && isBlCode(t.code) ? t.code : null;
  const a = (f.assetId ? S.asset(f.assetId) ?? null : null) ?? (bl ? baselineAsset(f.sid, bl) ?? null : null);
  if (!t) er.code = 'Select a file type.';
  const name = f.name.trim(); if (!name) er.name = 'Enter a name or choose a file.';
  const version = f.version.trim();
  if (!version) er.version = 'Enter a version.';
  else if (a && a.versions.some((v) => sameLabel(v.label, version))) er.version = 'This version already exists.';
  if (t) t.req.forEach((r) => { if (!(f.meta[r] || '').trim()) er['m:' + r] = 'Required.'; });
  if (!f.fileName) er.file = 'Choose a file.'; else if (FILE_OK.indexOf(extOf(f.fileName)) < 0) er.file = 'Unsupported format. Allowed: ' + FILE_OK.map((x) => '.' + x).join(' ');
  const list = baselinesOf(f.sid), cur = list[0];
  const asNew = !!bl && (f.baselineMode === 'new' || !cur);
  const blLabel = f.baselineLabel.trim();
  if (bl && asNew) {
    if (!blLabel) er.baseline = 'Enter a baseline version.';
    else if (list.some((b) => sameLabel(b.label, blLabel))) er.baseline = 'This baseline version already exists.';
  } else if (bl && cur) {
    const n = baselineUsers(cur).length;
    if (n) er.baseline = usedByEvents(n);
  }
  if (Object.keys(er).length) return { errors: er };
  const note = f.reason.trim() || (a ? 'Appended file version' : 'Initial upload');
  const nextN = a ? S.latest(a).n + 1 : 1;
  const ver = V(nextN, db.me.name, dShort(), note, { label: version, meta: { ...f.meta }, file: f.fileName });
  let target = a;
  if (a) a.versions.unshift(ver);
  else {
    target = { id: 'A' + (++db.seq.asset), studyId: f.sid, name, code: t!.code, tl: SHORT[t!.code] || t!.name, icon: t!.cat === 'Code & Scripts' ? 'code' : 'doc', source: 'Uploaded', versions: [ver] };
    db.assets.push(target);
    db.assets = db.assets.filter((x) => !(x.required && x.studyId === f.sid && x.code === t!.code));
  }
  const st = S.study(f.sid); if (st) st.updated = dLong();
  if (bl) {
    const slot = { assetId: target!.id, n: nextN };
    if (asNew) {
      const b: Baseline = { id: 'B' + (++db.seq.baseline), studyId: f.sid, label: blLabel, slots: { ...(cur?.slots ?? {}), [bl]: slot }, by: db.me.name, date: dShort(), note: f.reason.trim() };
      db.baselines.unshift(b);
      toast('Uploaded ' + BL_NAME[bl] + ' ' + version + '. Baseline ' + blLabel + ' created.');
    } else {
      cur!.slots[bl] = slot;
      toast('Uploaded ' + BL_NAME[bl] + ' ' + version + ' to Baseline ' + cur!.label + '.');
    }
  } else toast((a ? 'New version ' : 'Uploaded ') + target!.name + ' ' + version);
  emit();
  return { asset: target! };
}

/** 每种 Data type 对应唯一一类 Spec（Asset 类型）；候选只取该类已有的版本。该类 Asset 还没有时候选为空，字段不渲染，有了自然出现 */
export const SPEC_OF: Record<string, { code: string; label: string }> = {
  RawData: { code: 'RAW_DATA_SPEC', label: 'Raw Data Spec' },
  SDTM: { code: 'SDTM_SPEC', label: 'SDTM Spec' },
  ADaM: { code: 'ADAM_SPEC', label: 'ADaM Spec' },
};
/** 候选显示为「{名称} {版本号}」 */
export function specOptionsFor(sid: string, cat: string): string[] {
  const code = SPEC_OF[cat]?.code;
  if (!code) return [];
  return getDb().assets.filter((a) => a.studyId === sid && a.code === code).flatMap((a) => a.versions.map((v) => a.name + ' ' + v.label));
}

export interface UploadDatasetForm { sid: string; dsId: string | null; name: string; cat: string; mode: string; version: string; cut: string; spec: string; fileName: string; reason: string }
/** 上传数据集 / 新版本：模式必须显式选择，不从文件名推断；版本号由上传者填写，同一数据集内不区分大小写唯一；同空间同类别同名则追加版本 */
export function uploadDataset(f: UploadDatasetForm): { errors: Errors } | { ds: Dataset; space: string } {
  const db = getDb(), er: Errors = {}, d0 = f.dsId ? S.ds(f.dsId) ?? null : null;
  if (!f.mode) er.mode = 'Select an explicit mode (Dummy, Synthetic or PROD).';
  const space = MODE_SPACE[f.mode], stem = f.fileName.replace(/\.[^.]+$/, '');
  const nm = (d0 ? d0.name : ((f.name || stem).trim() || stem)).toUpperCase().replace(/\s+/g, '_');
  let d = d0 || (space ? db.datasets.find((x) => x.studyId === f.sid && x.space === space && x.cat === f.cat && x.name === nm) : undefined);
  const version = f.version.trim();
  if (!version) er.version = 'Enter a version.';
  else if (d && d.versions.some((v) => sameLabel(v.label, version))) er.version = 'This version already exists.';
  if (!f.fileName) er.file = 'Choose a data file.'; else if (DS_FILE_OK.indexOf(extOf(f.fileName)) < 0) er.file = 'Unsupported format. Allowed: ' + DS_FILE_OK.map((x) => '.' + x).join(' ');
  if (Object.keys(er).length) return { errors: er };
  const meta: Record<string, string> = {};
  if (f.cut.trim()) meta.cut = f.cut.trim();
  if (f.spec && specOptionsFor(f.sid, f.cat).includes(f.spec)) meta.spec = f.spec;
  const note = f.reason.trim() || 'Data intake';
  if (d) d.versions.unshift(V(S.latest(d).n + 1, db.me.name, dShort(), note, { label: version, meta, file: f.fileName }));
  else { d = { id: 'D' + (++db.seq.ds), studyId: f.sid, space, cat: f.cat, name: nm, label: (f.name || '').trim(), versions: [V(1, db.me.name, dShort(), note, { label: version, meta, file: f.fileName })] }; db.datasets.push(d); }
  const st = S.study(f.sid); if (st) st.updated = dLong();
  toast('Uploaded ' + d.name + ' ' + version + '.');
  emit();
  return { ds: d, space };
}

/** Event 选数据：只改本空间（Mode）的固定，其他空间已有的固定不动。picks 为 数据集 id → 版本序号 n；返回固定数量 */
export function savePinnedDatasets(eventId: string, space: string, picks: Record<string, number>): number {
  const e = S.event(eventId);
  if (!e) return 0;
  const keep: Record<string, { v: number; use: string }> = {};
  Object.entries(e.refs.datasets).forEach(([id, r]) => { const d = S.ds(id); if (d && d.space !== space) keep[id] = r; });
  Object.entries(picks).forEach(([id, n]) => { const d = S.ds(id); if (d && d.space === space && S.vOf(d, n)) keep[id] = { v: n, use: e.refs.datasets[id]?.use ?? 'Generate Code' }; });
  e.refs.datasets = keep;
  e.updated = dLong();
  const st = S.study(e.studyId); if (st) st.updated = dLong();
  const n = Object.keys(picks).length;
  toast(n ? 'Pinned ' + plural(n, 'dataset') : 'Cleared pinned datasets');
  emit();
  return n;
}
export { DS_CATS };

export const PHASES = ['Phase I', 'Phase II', 'Phase III', 'Phase IV', 'Exploratory'];
export interface StudyDetailsForm { name: string; desc: string; ta: string; phase: string; reason: string }

/** 修改 Study 资料：名称 1–200、说明 ≤2000、阶段为枚举或保留已有值、原因 1–1000（必填）。研究编号创建后不可改 */
export function updateStudyDetails(sid: string, f: StudyDetailsForm): { errors: Errors } | { ok: true } {
  const s = S.study(sid), er: Errors = {};
  if (!s) return { errors: { name: 'Study not found.' } };
  const name = f.name.trim(), reason = f.reason.trim();
  if (!name) er.name = 'Study name is required.'; else if (name.length > 200) er.name = 'Use 200 characters or fewer.'; else if (noCtl(name)) er.name = 'Remove control characters.';
  if (f.desc.length > 2000) er.desc = 'Use 2000 characters or fewer.';
  if (f.phase && f.phase !== s.phase && !PHASES.includes(f.phase)) er.phase = 'Choose a listed phase.';
  if (!reason) er.reason = 'Reason for change is required (1–1000 characters).'; else if (reason.length > 1000) er.reason = 'Use 1000 characters or fewer.';
  if (Object.keys(er).length) return { errors: er };
  Object.assign(s, { name, desc: f.desc.trim(), ta: f.ta.trim(), phase: f.phase, updated: dLong() });
  toast('Study details updated'); emit();
  return { ok: true };
}

export interface CreateStudyForm { id: string; name: string; desc: string; ta: string; phase: string; role: string; attr: string; members: MemberRow[] }
export const emptyStudyForm = (): CreateStudyForm => ({ id: '', name: '', desc: '', ta: '', phase: '', role: 'STAT', attr: 'UNSET', members: [] });
/** 研究编号比较口径：NFKC、去空白、大写 */
export const normalizeStudyId = (s: string) => s.normalize('NFKC').replace(/\s+/g, '').toUpperCase();

/** 表单校验（不含唯一性：编号唯一由提交时裁决，前端不做实时查重）。键：id / name / desc / ta / role / m:<行键>:<字段>。新建时 Study 为 Not blinded，成员盲态属性不强制 */
export function validateStudyForm(f: CreateStudyForm): Errors {
  const er: Errors = {}, id = f.id.trim(), name = f.name.trim();
  if (!id) er.id = 'Study ID is required.'; else if (id.length > 64) er.id = 'Use 64 characters or fewer.'; else if (noCtl(id)) er.id = 'Remove control characters.';
  if (!name) er.name = 'Study name is required.'; else if (name.length > 200) er.name = 'Use 200 characters or fewer.'; else if (noCtl(name)) er.name = 'Remove control characters.';
  if (f.desc.trim().length > 2000) er.desc = 'Use 2000 characters or fewer.';
  if (f.ta.trim().length > 200) er.ta = 'Use 200 characters or fewer.';
  if (f.phase && !PHASES.includes(f.phase)) er.phase = 'Choose a listed phase.';
  if (!f.role) er.role = 'Select a Role.';
  return Object.assign(er, validateMemberRows(f.members, { studyBlinded: false }));
}

/** 新建 Study：创建者成为 Study Admin（成员记录，有效期从创建当天起、无结束日），初始非盲、ACTIVE；初始成员一并入库。编号重复、无创建资格由这里裁决（模拟服务端），失败不改数据 */
export function createStudy(f: CreateStudyForm): { errors: Errors } | { id: string } {
  const db = getDb();
  if (!can('study.create')) return { errors: { form: 'You no longer have permission to create Studies.' } };
  const er = validateStudyForm(f);
  if (Object.keys(er).length) return { errors: er };
  const id = f.id.trim();
  if (db.studies.some((s) => normalizeStudyId(s.id) === normalizeStudyId(id))) return { errors: { id: 'ID unavailable. Change it, or contact an authorized administrator.' } };
  db.studies.unshift({ id, name: f.name.trim(), ta: f.ta.trim(), phase: f.phase, admin: db.me.name, lifecycle: 'ACTIVE', blinding: 'Not blinded', updated: dLong(), desc: f.desc.trim(), tenant: 'Demo Tenant', createdBy: db.me.name, createdAt: dLong() });
  db.seq.study++;
  const mk = (userId: string, role: string, attr: string, validFrom: string, validUntil: string | null, isAdmin: boolean) => {
    const u = userById(userId)!;
    db.members.push({ id: 'M-' + String(++db.seq.member).padStart(3, '0'), studyId: id, userId, name: u.name, email: u.email, role: role as MemberRole, attr: attr as BlindAttr, validFrom, validUntil, status: 'ACTIVE', isAdmin });
  };
  mk(ME_USER.id, f.role, f.attr, todayIso(), null, true);
  f.members.forEach((m) => mk(m.userId, m.role, m.attr, m.validFrom.trim(), m.validUntil.trim() || null, false));
  toast(id + ' created'); emit();
  return { id };
}

/** 交接 Event Owner（event.owner.transfer，仅 Study Admin） */
export function transferEventOwner(eid: string, name: string) {
  const e = S.event(eid); if (!e || e.owner === name) return;
  e.owner = name; e.updated = dLong();
  toast('Event Owner changed to ' + name); emit();
}
