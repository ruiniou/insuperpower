import { DS_CATS, FILE_OK, MODE_SPACE, SHORT, TYPE } from './assets';
import { DS_FILE_OK } from './actions';
import { dLong, dShort } from './dates';
import { SPACES } from './config';
import { S } from './selectors';
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
