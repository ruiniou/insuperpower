import { canMaintainAsset } from './assetPermissions';
import { CODE_TYPES, DS_CATS, FILE_UPLOAD_GROUPS, FILE_OK, MODE_SPACE, SHORT, TYPE } from './assets';
import { parseVersionLabel, storedVersionLabel, VERSION_FORMAT_HINT } from './versions';
import { validateCodePackage } from './codePackage';
import { DS_FILE_OK } from './actions';
import { dLong, dShort } from './dates';
import { SPACES } from './config';
import { S } from './selectors';
import { can, isWritable } from './role';
import { newFlow, V } from './seed';
import { emit, getDb, toast } from './store';
import { diff, logAudit } from './audit';
import { memberKey, peopleOf, todayIso, validateMemberRows, validDate, type MemberRow } from './members';
import { DEMO_TENANT, ME_USER, userById } from './people';
import type { Asset, BlindAttr, CodePackageMember, Dataset, EventRec, MemberRole, Version } from './types';

export { memberKey, peopleOf, validDate };

const extOf = (n: string) => (n.split('.').pop() || '').toLowerCase();
const noCtl = (s: string) => /[\u0000-\u001f\u007f]/.test(s);
const plural = (n: number, w: string) => n + ' ' + w + (n === 1 ? '' : 's');
export type Errors = Record<string, string>;

const studyReadOnly = 'This study is read-only. Restore it before making changes.';

/** Create Event 默认引用：该 Study 下 SAP、CRF 各取一个（有版本者）的最新版 */
export function defaultEventRefs(sid: string): Record<string, number> {
  const refs: Record<string, number> = {}, seen: Record<string, boolean> = {};
  S.assetsOf(sid).forEach((a) => { if ((a.code === 'SAP' || a.code === 'CRF') && a.versions.length && !seen[a.code]) { seen[a.code] = true; refs[a.id] = S.latest(a).n; } });
  return refs;
}

export interface CreateEventForm { sid: string; name: string; goal: string; scope: string; reason: string; refs: Record<string, number> }
/** 创建 Event：校验（名称必填 ≤200 无控制字符；原因必填 ≤1000），写入 DB 头部，返回新 id 或错误 */
export function createEvent(f: CreateEventForm): { errors: Errors } | { id: string; nAssets: number } {
  if (!isWritable(f.sid)) return { errors: { form: studyReadOnly } };
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

interface AssetUploadContent {
  fileName: string;
  fileContent?: Blob;
  packageMembers?: readonly CodePackageMember[];
}

export interface UploadAssetForm extends AssetUploadContent {
  sid: string;
  assetId: string | null;
  code: string;
  name: string;
  meta: Record<string, string>;
  reason: string;
  version: string;
}

function assetContentError(content: AssetUploadContent, isPackage: boolean): string | undefined {
  if (isPackage) {
    try {
      validateCodePackage(content.packageMembers ?? []);
    } catch (error) {
      return error instanceof Error ? error.message : 'Choose a valid code package.';
    }
  } else if (!content.fileName) return 'Choose a file.';
  else if (!FILE_OK.includes(extOf(content.fileName))) {
    return 'Unsupported format. Allowed: ' + FILE_OK.map((ext) => '.' + ext).join(' ');
  }
}

/** Register a separate asset, or append a version to an explicit target. */
export function uploadAsset(f: UploadAssetForm): { errors: Errors } | { asset: Asset; versionNumber: number } {
  if (!isWritable(f.sid)) return { errors: { form: studyReadOnly } };
  const db = getDb(), er: Errors = {}, t = TYPE(f.code);
  const a = f.assetId === null ? undefined : S.asset(f.assetId);
  if (f.assetId !== null && (!a || a.studyId !== f.sid || a.required || a.code !== f.code)) {
    return { errors: { form: 'Choose a valid asset in this study.' } };
  }
  if (!canMaintainAsset(f.sid, f.code)) {
    return { errors: { form: 'You do not have permission to maintain this asset type.' } };
  }
  const isPackage = Boolean(CODE_TYPES[f.code]);
  if (!t || (!a && !isPackage && !FILE_UPLOAD_GROUPS.some(({ codes }) => codes.includes(f.code)))) {
    er.code = 'Select a file type.';
  }
  const name = a?.name ?? f.name.trim();
  if (!name) er.name = 'Enter a name or choose a file.';
  const version = parseVersionLabel(f.version);
  if (!f.version.trim()) er.version = 'Enter a version.';
  else if (!version) er.version = VERSION_FORMAT_HINT;
  else if (a?.versions.some((v) => storedVersionLabel(v.label) === version)) er.version = 'This version already exists.';
  if (t) t.req.forEach((r) => { if (!(f.meta[r] || '').trim()) er['m:' + r] = 'Required.'; });
  const fileError = assetContentError(f, isPackage);
  if (fileError) er.file = fileError;
  if (!version || Object.keys(er).length) return { errors: er };
  const note = f.reason.trim() || (a ? 'Appended file version' : 'Initial upload');
  const nextN = a ? S.latest(a).n + 1 : 1;
  const ver = V(nextN, db.me.name, dShort(), note, { label: version, meta: { ...f.meta }, ...(isPackage
    ? { packageMembers: f.packageMembers?.slice() }
    : { file: f.fileName, ...(f.fileContent && { fileContent: f.fileContent }) }) });
  let target = a;
  if (a) a.versions.unshift(ver);
  else {
    target = { id: 'A' + (++db.seq.asset), studyId: f.sid, name, code: t!.code, tl: SHORT[t!.code] || t!.name, icon: t!.cat === 'Code & Scripts' ? 'code' : 'doc', source: 'Uploaded', versions: [ver] };
    db.assets.push(target);
    db.assets = db.assets.filter((x) => !(x.required && x.studyId === f.sid && x.code === t!.code));
  }
  const st = S.study(f.sid); if (st) st.updated = dLong();
  logAudit({ studyId: f.sid, action: 'Version registered', changes: target!.name + ' ' + version, reason: f.reason });
  toast('Uploaded ' + target!.name + ' ' + version + '.');
  emit();
  return { asset: target!, versionNumber: nextN };
}

export function replaceAssetContent(
  sid: string, assetId: string, original: Version, content: AssetUploadContent,
): { errors: Errors } | { asset: Asset; versionNumber: number } {
  if (!isWritable(sid)) return { errors: { form: studyReadOnly } };
  const asset = S.asset(assetId);
  if (!asset || asset.studyId !== sid || !canMaintainAsset(sid, asset.code)) {
    return { errors: { form: 'You do not have permission to maintain this version.' } };
  }
  const index = asset.versions.findIndex((version) => version.n === original.n);
  // Each content change installs a new Version object while keeping its stable version number.
  if (index < 0 || asset.versions[index] !== original) {
    return { errors: { form: 'This version has changed. Close the form and open it again.' } };
  }
  if (S.assetUsers(asset, original.n).length > 0) {
    return { errors: { form: 'An Event references this version. Upload a new version instead.' } };
  }
  const isPackage = Object.hasOwn(CODE_TYPES, asset.code);
  const fileError = assetContentError(content, isPackage);
  if (fileError) return { errors: { file: fileError } };
  if (!isPackage && !content.fileContent?.size) return { errors: { file: 'Choose a non-empty file.' } };

  asset.versions[index] = { ...original, ...(isPackage
    ? { packageMembers: content.packageMembers?.slice() }
    : { file: content.fileName, fileContent: content.fileContent }) };
  const study = S.study(sid);
  if (study) study.updated = dLong();
  logAudit({ studyId: sid, action: 'Version content replaced', changes: asset.name + ' ' + original.label });
  toast('Replaced content for ' + asset.name + ' ' + original.label + '.');
  emit();
  return { asset, versionNumber: original.n };
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
/** 上传数据集 / 新版本：模式必须显式选择，不从文件名推断；版本号由上传者填写，同一数据集内唯一；同空间同类别同名则追加版本 */
export function uploadDataset(f: UploadDatasetForm): { errors: Errors } | { ds: Dataset; space: string } {
  if (!isWritable(f.sid)) return { errors: { form: studyReadOnly } };
  const db = getDb(), er: Errors = {}, d0 = f.dsId ? S.ds(f.dsId) ?? null : null;
  if (d0 && d0.studyId !== f.sid) return { errors: { form: 'Choose a dataset in this study.' } };
  if (!f.mode) er.mode = 'Select an explicit mode (Dummy, Synthetic or PROD).';
  const space = MODE_SPACE[f.mode], stem = f.fileName.replace(/\.[^.]+$/, '');
  const nm = (d0 ? d0.name : ((f.name || stem).trim() || stem)).toUpperCase().replace(/\s+/g, '_');
  let d = d0 || (space ? db.datasets.find((x) => x.studyId === f.sid && x.space === space && x.cat === f.cat && x.name === nm) : undefined);
  const version = parseVersionLabel(f.version);
  if (!f.version.trim()) er.version = 'Enter a version.';
  else if (!version) er.version = VERSION_FORMAT_HINT;
  else if (d?.versions.some((v) => storedVersionLabel(v.label) === version)) er.version = 'This version already exists.';
  if (!f.fileName) er.file = 'Choose a data file.'; else if (DS_FILE_OK.indexOf(extOf(f.fileName)) < 0) er.file = 'Unsupported format. Allowed: ' + DS_FILE_OK.map((x) => '.' + x).join(' ');
  if (!version || Object.keys(er).length) return { errors: er };
  const meta: Record<string, string> = {};
  if (f.cut.trim()) meta.cut = f.cut.trim();
  if (f.spec && specOptionsFor(f.sid, f.cat).includes(f.spec)) meta.spec = f.spec;
  const note = f.reason.trim() || 'Data intake';
  if (d) d.versions.unshift(V(S.latest(d).n + 1, db.me.name, dShort(), note, { label: version, meta, file: f.fileName }));
  else { d = { id: 'D' + (++db.seq.ds), studyId: f.sid, space, cat: f.cat, name: nm, label: (f.name || '').trim(), versions: [V(1, db.me.name, dShort(), note, { label: version, meta, file: f.fileName })] }; db.datasets.push(d); }
  const st = S.study(f.sid); if (st) st.updated = dLong();
  if (st?.blinding === 'Blinded' && d.space === 'prod') {
    const protection = db.protections.find((p) => p.studyId === f.sid && p.datasetId === d.id);
    const n = d.versions[0].n;
    if (protection?.future && !protection.versions.includes(n)) protection.versions.push(n);
    else if (!protection) db.protections.push({ studyId: f.sid, datasetId: d.id, versions: [n], future: true });
  }
  logAudit({ studyId: f.sid, action: 'Version registered', changes: d.name + ' ' + version, reason: f.reason });
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
  if (!isWritable(s)) return { errors: { form: studyReadOnly } };
  const name = f.name.trim(), reason = f.reason.trim();
  if (!name) er.name = 'Study name is required.'; else if (name.length > 200) er.name = 'Use 200 characters or fewer.'; else if (noCtl(name)) er.name = 'Remove control characters.';
  if (f.desc.length > 2000) er.desc = 'Use 2000 characters or fewer.';
  if (f.phase && f.phase !== s.phase && !PHASES.includes(f.phase)) er.phase = 'Choose a listed phase.';
  if (!reason) er.reason = 'Reason for change is required (1–1000 characters).'; else if (reason.length > 1000) er.reason = 'Use 1000 characters or fewer.';
  if (Object.keys(er).length) return { errors: er };
  const next = { name, desc: f.desc.trim(), ta: f.ta.trim(), phase: f.phase };
  const changed = [
    next.name !== s.name && diff('Study name', s.name, next.name),
    next.desc !== s.desc && 'Description',
    next.ta !== s.ta && diff('Therapeutic area', s.ta, next.ta),
    next.phase !== s.phase && diff('Phase', s.phase, next.phase),
  ].filter(Boolean).join('; ');
  Object.assign(s, next, { updated: dLong() });
  logAudit({ studyId: sid, action: 'Study details updated', changes: changed || 'No fields changed', reason });
  toast('Study details updated'); emit();
  return { ok: true };
}

export interface CreateStudyForm { id: string; name: string; desc: string; ta: string; phase: string; role: string; attr: string; members: MemberRow[] }
export const emptyStudyForm = (): CreateStudyForm => ({ id: '', name: '', desc: '', ta: '', phase: '', role: 'STAT', attr: 'UNSET', members: [] });
/** 研究编号比较口径：NFKC、去空白、大写 */
export const normalizeStudyId = (s: string) => s.normalize('NFKC').replace(/\s+/g, '').toUpperCase();

/** 表单校验（不含唯一性：编号唯一由提交时裁决，前端不做实时查重）。键：id / name / desc / ta / role / m:<行键>:<字段>。新建时 Study 为 Unblinded，成员盲态属性不强制 */
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
  db.studies.unshift({ id, name: f.name.trim(), ta: f.ta.trim(), phase: f.phase, admin: db.me.name, lifecycle: 'ACTIVE', blinding: 'Unblinded', updated: dLong(), desc: f.desc.trim(), tenant: DEMO_TENANT, createdBy: db.me.name, createdAt: dLong() });
  db.seq.study++;
  const mk = (userId: string, role: string, attr: string, validFrom: string, validUntil: string | null, isAdmin: boolean) => {
    const u = userById(userId)!;
    db.members.push({ id: 'M-' + String(++db.seq.member).padStart(3, '0'), studyId: id, userId, name: u.name, email: u.email, role: role as MemberRole, attr: attr as BlindAttr, validFrom, validUntil, status: 'ACTIVE', isAdmin });
  };
  mk(ME_USER.id, f.role, f.attr, todayIso(), null, true);
  f.members.forEach((m) => mk(m.userId, m.role, m.attr, m.validFrom.trim(), m.validUntil.trim() || null, false));
  logAudit({ studyId: id, action: 'Study created', changes: id });
  toast(id + ' created'); emit();
  return { id };
}

/** 交接 Event Owner（event.owner.transfer，仅 Study Admin） */
export function transferEventOwner(eid: string, name: string) {
  const e = S.event(eid); if (!e || !isWritable(e.studyId) || e.owner === name) return;
  logAudit({ studyId: e.studyId, action: 'Event Owner changed', changes: diff(e.name, e.owner, name) });
  e.owner = name; e.updated = dLong();
  toast('Event Owner changed to ' + name); emit();
}

export interface ArchiveCheckItem {
  key: 'runs' | 'reviews' | 'operations';
  label: string;
  count: number;
  sources: { eventId: string; eventName: string; count: number }[];
}

export interface ArchiveCheckResult {
  status: 'PASS' | 'BLOCK';
  items: ArchiveCheckItem[];
}

/** 归档前置依赖检查：仅计入未归档 Event 的运行和待审节点。 */
export function archiveCheck(sid: string): ArchiveCheckResult {
  const events = S.eventsOf(sid).filter((e) => e.status !== 'Archived');
  const runs: ArchiveCheckItem = { key: 'runs', label: 'Active runs', count: 0, sources: [] };
  const reviews: ArchiveCheckItem = { key: 'reviews', label: 'Unlocked pending reviews', count: 0, sources: [] };
  const operations: ArchiveCheckItem = { key: 'operations', label: 'Active operations', count: 0, sources: [] };
  for (const event of events) {
    const statuses = Object.values(event.flow.st);
    for (const [item, status] of [[runs, 'running'], [reviews, 'review']] as const) {
      const count = statuses.filter((value) => value === status).length;
      if (count === 0) continue;
      item.count += count;
      item.sources.push({ eventId: event.id, eventName: event.name, count });
    }
  }
  const items = [runs, reviews, operations];
  return { status: items.some((item) => item.count > 0) ? 'BLOCK' : 'PASS', items };
}

/** 归档 Study：仅 ACTIVE 状态且依赖检查 PASS 时可归档，需提供 Reason (1–1000 字符) */
export function archiveStudy(sid: string, reasonRaw: string): { errors: Errors; check?: ArchiveCheckResult } | { ok: true } {
  const s = S.study(sid);
  const er: Errors = {};
  if (!s) return { errors: { form: 'Study not found.' } };
  if (s.lifecycle !== 'ACTIVE') {
    return { errors: { form: 'Only active studies can be archived.' } };
  }
  if (!can('study.archive', { study: s })) {
    return { errors: { form: 'You do not have permission to archive this study.' } };
  }
  const reason = reasonRaw.trim();
  if (!reason) {
    er.reason = 'Reason for change is required (1–1000 characters).';
  } else if (reason.length > 1000) {
    er.reason = 'Use 1000 characters or fewer.';
  }
  const check = archiveCheck(sid);
  if (check.status === 'BLOCK' || Object.keys(er).length) return { errors: er, ...(check.status === 'BLOCK' && { check }) };

  s.lifecycle = 'ARCHIVED';
  s.updated = dLong();
  logAudit({
    studyId: sid,
    action: 'Study archived',
    changes: 'Active → Archived',
    reason,
  });
  toast('Study archived');
  emit();
  return { ok: true };
}

/** 恢复 Study：仅 ARCHIVED 状态可恢复，需提供 Reason (1–1000 字符)；不改变 blinding 与 Event 状态 */
export function restoreStudy(sid: string, reasonRaw: string): { errors: Errors } | { ok: true } {
  const s = S.study(sid);
  const er: Errors = {};
  if (!s) return { errors: { form: 'Study not found.' } };
  if (s.lifecycle !== 'ARCHIVED') {
    return { errors: { form: 'Only archived studies can be restored.' } };
  }
  if (!can('study.restore', { study: s })) {
    return { errors: { form: 'You do not have permission to restore this study.' } };
  }
  const reason = reasonRaw.trim();
  if (!reason) {
    er.reason = 'Reason for change is required (1–1000 characters).';
  } else if (reason.length > 1000) {
    er.reason = 'Use 1000 characters or fewer.';
  }
  if (Object.keys(er).length) return { errors: er };

  s.lifecycle = 'ACTIVE';
  s.updated = dLong();
  logAudit({
    studyId: sid,
    action: 'Study restored',
    changes: 'Archived → Active',
    reason,
  });
  toast('Study restored');
  emit();
  return { ok: true };
}
