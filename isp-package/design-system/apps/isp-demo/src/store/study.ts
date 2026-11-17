import { DS_CATS, FILE_OK, MODE_SPACE, SHORT, TYPE } from './assets';
import { DS_FILE_OK } from './actions';
import { dLong, dShort } from './dates';
import { SPACES } from './config';
import { S } from './selectors';
import { can } from './role';
import { newFlow, V } from './seed';
import { emit, getDb, toast } from './store';
import type { Asset, Dataset, EventRec } from './types';

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

export interface UploadAssetForm { sid: string; assetId: string | null; code: string; name: string; meta: Record<string, string>; fileName: string; reason: string }
/** 上传文件 / 新版本：新文件会顶替同类型的「Required · Not uploaded」占位 */
export function uploadAsset(f: UploadAssetForm): { errors: Errors } | { asset: Asset } {
  const db = getDb(), er: Errors = {}, a = f.assetId ? S.asset(f.assetId) ?? null : null, t = TYPE(f.code);
  if (!t) er.code = 'Select a file type.';
  const name = f.name.trim(); if (!name) er.name = 'Enter a name or choose a file.';
  if (t) t.req.forEach((r) => { if (!(f.meta[r] || '').trim()) er['m:' + r] = 'Required.'; });
  if (!f.fileName) er.file = 'Choose a file.'; else if (FILE_OK.indexOf(extOf(f.fileName)) < 0) er.file = 'Unsupported format. Allowed: ' + FILE_OK.map((x) => '.' + x).join(' ');
  if (Object.keys(er).length) return { errors: er };
  const note = f.reason.trim() || (a ? 'Appended file version' : 'Initial upload');
  let target = a;
  if (a) {
    a.versions.unshift(V(S.latest(a).n + 1, db.me.name, dShort(), note, { meta: { ...f.meta }, file: f.fileName }));
  } else {
    target = { id: 'A' + (++db.seq.asset), studyId: f.sid, name, code: t!.code, tl: SHORT[t!.code] || t!.name, icon: t!.cat === 'Code & Scripts' ? 'code' : 'doc', source: 'Uploaded', versions: [V(1, db.me.name, dShort(), note, { meta: { ...f.meta }, file: f.fileName })] };
    db.assets.push(target);
    db.assets = db.assets.filter((x) => !(x.required && x.studyId === f.sid && x.code === t!.code));
  }
  const st = S.study(f.sid); if (st) st.updated = dLong();
  toast((a ? 'New version ' : 'Uploaded ') + target!.name + ' ' + S.latest(target!).label);
  emit();
  return { asset: target! };
}

export interface UploadDatasetForm { sid: string; dsId: string | null; name: string; aid: string; cat: string; mode: string; fileName: string; blind: boolean; reason: string }
/** 上传数据集 / 新版本：模式必须显式选择，不从文件名推断；同空间同类别同名则追加版本 */
export function uploadDataset(f: UploadDatasetForm): { errors: Errors } | { ds: Dataset; space: string } {
  const db = getDb(), er: Errors = {}, d0 = f.dsId ? S.ds(f.dsId) ?? null : null;
  if (!f.mode) er.mode = 'Select an explicit mode (Dummy, Synthetic or PROD).';
  if (!f.fileName) er.file = 'Choose a data file.'; else if (DS_FILE_OK.indexOf(extOf(f.fileName)) < 0) er.file = 'Unsupported format. Allowed: ' + DS_FILE_OK.map((x) => '.' + x).join(' ');
  if (Object.keys(er).length) return { errors: er };
  const space = MODE_SPACE[f.mode], stem = f.fileName.replace(/\.[^.]+$/, '');
  const nm = (d0 ? d0.name : ((f.aid || f.name || stem).trim() || stem)).toUpperCase().replace(/\s+/g, '_');
  let d = d0 || db.datasets.find((x) => x.studyId === f.sid && x.space === space && x.cat === f.cat && x.name === nm);
  const note = (f.reason.trim() || 'Data intake') + ', quality not evaluated' + (f.blind ? ', protection rule registered' : '');
  if (d) d.versions.unshift(V(S.latest(d).n + 1, db.me.name, dShort(), note, { file: f.fileName }));
  else { d = { id: 'D' + (++db.seq.ds), studyId: f.sid, space, cat: f.cat, name: nm, label: (f.name || '').trim(), versions: [V(1, db.me.name, dShort(), note, { file: f.fileName })] }; db.datasets.push(d); }
  const st = S.study(f.sid); if (st) st.updated = dLong();
  toast('Demo version registered (' + d.name + ' ' + S.latest(d).label + ', ' + SPACES.find((s) => s.key === space)!.name + '). Real parsing, validation and release engine are not connected.');
  emit();
  return { ds: d, space };
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

export interface NewMemberRow { key: number; user: string; role: string; from: string; to: string }
export interface CreateStudyForm { id: string; name: string; desc: string; ta: string; phase: string; role: string; members: NewMemberRow[] }
export const emptyStudyForm = (): CreateStudyForm => ({ id: '', name: '', desc: '', ta: '', phase: '', role: '', members: [] });
/** 研究编号比较口径：NFKC、去空白、大写 */
export const normalizeStudyId = (s: string) => s.normalize('NFKC').replace(/\s+/g, '').toUpperCase();
/** 成员有效期按日期填写：YYYY-MM-DD（固定英文格式，不依赖浏览器语言）；结束日含当天 */
export const validDate = (v: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v); if (!m) return false; const [y, mo, d] = m.slice(1).map(Number); const t = new Date(y, mo - 1, d); return t.getFullYear() === y && t.getMonth() === mo - 1 && t.getDate() === d; };
/** 单个成员的字段校验（不含去重），返回 user / from / to 的错误 */
export function validateMemberRow(m: { user: string; from: string; to: string }): Partial<Record<'user' | 'from' | 'to', string>> {
  const er: Partial<Record<'user' | 'from' | 'to', string>> = {}, from = m.from.trim(), to = m.to.trim();
  if (!m.user) er.user = 'Select a person.';
  if (!from) er.from = 'Enter a start date.'; else if (!validDate(from)) er.from = 'Use YYYY-MM-DD.';
  if (!to) er.to = 'Enter an end date.'; else if (!validDate(to)) er.to = 'Use YYYY-MM-DD.';
  else if (!er.from && to < from) er.to = 'End date can’t be before start.';
  return er;
}
export const memberKey = (key: number, field: 'user' | 'role' | 'from' | 'to') => 'm:' + key + ':' + field;

/** 表单校验（不含唯一性：编号唯一由提交时裁决，前端不做实时查重）。键：id / name / desc / ta / m:<行键>:<字段> */
export function validateStudyForm(f: CreateStudyForm): Errors {
  const er: Errors = {}, id = f.id.trim(), name = f.name.trim();
  if (!id) er.id = 'Study ID is required.'; else if (id.length > 64) er.id = 'Use 64 characters or fewer.'; else if (noCtl(id)) er.id = 'Remove control characters.';
  if (!name) er.name = 'Study name is required.'; else if (name.length > 200) er.name = 'Use 200 characters or fewer.'; else if (noCtl(name)) er.name = 'Remove control characters.';
  if (f.desc.trim().length > 2000) er.desc = 'Use 2000 characters or fewer.';
  if (f.ta.trim().length > 200) er.ta = 'Use 200 characters or fewer.';
  if (f.phase && !PHASES.includes(f.phase)) er.phase = 'Choose a listed phase.';
  const seen = new Set<string>();
  f.members.forEach((m) => {
    const e = validateMemberRow(m);
    if (e.user) er[memberKey(m.key, 'user')] = e.user; else if (seen.has(m.user)) er[memberKey(m.key, 'user')] = 'This person is already added.';
    if (e.from) er[memberKey(m.key, 'from')] = e.from;
    if (e.to) er[memberKey(m.key, 'to')] = e.to;
    seen.add(m.user);
    if (!m.role) er[memberKey(m.key, 'role')] = 'Select a Role.';
    if (!m.role) er[memberKey(m.key, 'role')] = 'Select a Role.';
  });
  return er;
}

/** 新建 Study：创建者成为 Study Admin，初始非盲、ACTIVE，成员数含创建者。编号重复、无创建资格由这里裁决（模拟服务端），失败不改数据 */
export function createStudy(f: CreateStudyForm): { errors: Errors } | { id: string } {
  const db = getDb();
  if (!can('study.create')) return { errors: { form: 'You no longer have permission to create Studies.' } };
  const er = validateStudyForm(f);
  if (Object.keys(er).length) return { errors: er };
  const id = f.id.trim();
  if (db.studies.some((s) => normalizeStudyId(s.id) === normalizeStudyId(id))) return { errors: { id: 'ID unavailable. Change it, or contact an authorized administrator.' } };
  db.studies.unshift({ id, name: f.name.trim(), ta: f.ta.trim(), phase: f.phase, admin: db.me.name, lifecycle: 'ACTIVE', blinding: 'Not blinded', updated: dLong(), members: 1 + f.members.length, desc: f.desc.trim(), tenant: 'Demo Tenant', createdBy: db.me.name, createdAt: dLong() });
  db.seq.study++;
  toast(id + ' created'); emit();
  return { id };
}

/** 本 Study 可选的 Event Owner：Study Admin、各 Event 与 Workflow 的负责人、当前用户。成员模块未做，先从现有数据里取 */
export function peopleOf(sid: string): string[] {
  const db = getDb(), st = S.study(sid);
  const names = [st?.admin, db.me.name, ...S.eventsOf(sid).flatMap((e) => [e.owner, ...e.wfs.map((w) => w.owner)])];
  return Array.from(new Set(names.filter((n): n is string => !!n)));
}

/** 交接 Event Owner（event.owner.transfer，仅 Study Admin） */
export function transferEventOwner(eid: string, name: string) {
  const e = S.event(eid); if (!e || e.owner === name) return;
  e.owner = name; e.updated = dLong();
  toast('Event Owner changed to ' + name); emit();
}
