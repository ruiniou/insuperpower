import { DOWN, LOOP_OF, NODE, TOTAL } from './config';
import { dLong, dShort } from './dates';
import { btnFor, ovCtx } from './flow';
import { S } from './selectors';
import { V } from './seed';
import { clearTimer, emit, getDb, setTimer, toast } from './store';
import type { EventRec, NodeId } from './types';

const enc = encodeURIComponent;
export const hrefEvent = (eid: string, tab: string, sp?: string) => '#/event/' + enc(eid) + '/' + tab + (sp ? '/' + sp : '');
export const hrefStudy = (sid: string, tab: string, sp?: string) => '#/study/' + enc(sid) + '/' + tab + (sp ? '/' + sp : '');
export const hrefWf = (eid: string, wid: string, node?: string) => '#/event/' + enc(eid) + '/workflow/' + enc(wid) + (node ? '/' + node : '');
export const hrefReview = (eid: string, step: string, node?: string) => '#/event/' + enc(eid) + '/review/' + step + (node ? '/' + node : '');
export const reviewHref = (e: EventRec, id: NodeId): string | null => id === 'toc' ? hrefReview(e.id, 'toc') : id === 'shell' ? hrefReview(e.id, 'shell') : id === 'pkg' ? null : hrefReview(e.id, 'code', id);

/** Start / Update：开始运行（每 380ms +3，到 24 进入 review；若带 rev.pend 则自动 Lock） */
export function ovRun(e: EventRec, id: NodeId) {
  const f = e.flow; if (f.st[id] === 'running') return;
  if (f.st[id] === 'stale') f.regen[id] = true;
  f.st[id] = 'running'; f.prog[id] = 0; f.ui.edge = null;
  const key = e.id + ':' + id;
  setTimer(key, () => {
    const p = Math.min(TOTAL, (f.prog[id] || 0) + 3);
    f.prog[id] = p;
    if (p >= TOTAL) {
      clearTimer(key); f.st[id] = 'review';
      if (f.rev.pend && f.rev.pend[id]) { delete f.rev.pend[id]; ovLock(e, id); return; }
    }
    emit();
  }, 380);
  emit();
}

/** Lock：重跑过（regen）则版本号 +1，清除提示 */
export function ovLock(e: EventRec, id: NodeId) {
  const f = e.flow; if (f.regen[id]) { f.ver[id] += 1; f.regen[id] = false; }
  delete f.note[id]; f.st[id] = 'locked'; f.ui.edge = null;
  e.updated = dLong(); toast(NODE[id].name + ' locked'); emit();
}

/** Keep vN：保留当前版本，节点回到 Locked，版本号不变 */
export function ovKeep(e: EventRec, id: NodeId) {
  const f = e.flow; delete f.note[id]; f.st[id] = 'locked'; f.ui.edge = null;
  toast('Kept ' + NODE[id].name + ' v' + f.ver[id] + ', decision recorded'); emit();
}

/** 替换文件：新版本 +1，只标直接下游且仅当其为 Locked 的节点为 Stale；不执行任何后续 Workflow */
export function ovDoReplace(e: EventRec, id: NodeId) {
  const f = e.flow; f.st[id] = 'locked'; f.ver[id] += 1; delete f.note[id];
  DOWN[id].forEach((d) => { if (f.st[d] === 'locked') { f.st[d] = 'stale'; f.note[d] = (NODE[id].file || NODE[id].name) + ' v' + f.ver[id] + ' available'; } });
  const changed = DOWN[id].filter((d) => f.st[d] === 'stale').map((d) => NODE[d].name);
  f.ui.confirm = null; e.updated = dLong();
  toast((NODE[id].file || NODE[id].name) + ' v' + f.ver[id] + ' uploaded' + (changed.length ? ', ' + changed.join(', ') + ' update available' : ''));
  emit();
}

/** 在 SAP 版本被换成另一版本后，直接下游 TOC（Locked / Review）标 Stale */
export function ovOnSapPinChanged(e: EventRec, label: string) {
  const f = e.flow;
  if (f.st.toc === 'locked' || f.st.toc === 'review') { f.st.toc = 'stale'; f.note.toc = 'SAP ' + label + ' available'; }
  emit();
}

/** 主按钮点击：按展示状态启动 / 更新 / 打开 Review / 跳转。返回要跳转的 hash（无则 null），提示走 toast */
export function ovStartOrFix(e: EventRec, id: NodeId): string | null {
  const C = ovCtx(e), f = e.flow, d = C.disp(id), loop = LOOP_OF[id], w = S.wf(e, loop);
  if (d === 'ready') { if (!w) return hrefEvent(e.id, 'workflow', 'new'); return hrefWf(e.id, w.id, id); }
  if (d === 'stale') {
    if (!C.inputsLocked(id)) { toast('Update upstream steps first'); return null; }
    ovRun(e, id); return w ? hrefWf(e.id, w.id, id) : null;
  }
  if (d === 'review') { const h = reviewHref(e, id); if (h) return h; toast('Package review is not in this prototype'); return null; }
  if (d === 'running') { if (w) return hrefWf(e.id, w.id, id); toast(NODE[id].name + ' is running, ' + f.prog[id] + '/' + TOTAL); return null; }
  if (d === 'locked') return hrefEvent(e.id, 'asset');
  const miss = NODE[id].inputs.filter((i) => f.st[i] !== 'locked').map((i) => NODE[i].name);
  toast('Waiting for ' + miss.join(' + ')); return null;
}

/** 展开卡 UI 状态（与原型一致，存在 event.flow.ui 里，跨页面保留） */
export const ovUi = {
  sel(e: EventRec, id: NodeId) { const u = e.flow.ui; u.sel = id; u.edge = null; u.confirm = null; emit(); },
  clear(e: EventRec) { const u = e.flow.ui; u.sel = null; u.edge = null; u.confirm = null; emit(); },
  close(e: EventRec) { const u = e.flow.ui; u.sel = null; u.confirm = null; emit(); },
  edge(e: EventRec, id: string) { const u = e.flow.ui; u.edge = u.edge === id ? null : id; u.sel = null; u.confirm = null; emit(); },
  toggleInputs(e: EventRec) { e.flow.ui.inputsOpen = !e.flow.ui.inputsOpen; emit(); },
  replaceAsk(e: EventRec, id: NodeId) { if (e.flow.st[id] === 'running' || e.flow.st[id] === 'review') return; e.flow.ui.confirm = id; emit(); },
  cancel(e: EventRec) { e.flow.ui.confirm = null; emit(); },
};

export { btnFor };

export const DS_FILE_OK = ['csv', 'xpt', 'sas7bdat', 'parquet'];
const extOf = (n: string) => (n.split('.').pop() || '').toLowerCase();

/** Inputs 展开区的 ADaM / SDTM 槽位：选文件直接传到当前 Event（Dummy 空间），自动 pin 最新版本 */
export function quickUploadDs(e: EventRec, cat: string, fileName: string) {
  const db = getDb();
  if (DS_FILE_OK.indexOf(extOf(fileName)) < 0) { toast('Unsupported format. Allowed: ' + DS_FILE_OK.map((x) => '.' + x).join(' ')); return; }
  const stem = fileName.replace(/\.[^.]+$/, ''), nm = stem.toUpperCase().replace(/\s+/g, '_');
  let d = db.datasets.find((x) => x.studyId === e.studyId && x.space === 'dummy' && x.cat === cat && x.name === nm);
  const note = 'Data intake, quality not evaluated';
  if (d) d.versions.unshift(V(S.latest(d).n + 1, db.me.name, dShort(), note, { file: fileName }));
  else { d = { id: 'D' + (++db.seq.ds), studyId: e.studyId, space: 'dummy', cat, name: nm, label: '', versions: [V(1, db.me.name, dShort(), note, { file: fileName })] }; db.datasets.push(d); }
  e.refs.datasets[d.id] = { v: S.latest(d).n, use: 'Generate Code' }; e.updated = dLong(); const st = S.study(e.studyId); if (st) st.updated = dLong();
  toast(d.name + ' ' + S.latest(d).label + ' uploaded'); emit();
}

/** Studies：状态开关（状态模型待 PM 确认，原型仅切换并提示） */
export function toggleStudy(id: string) {
  const s = S.study(id); if (!s) return;
  s.status = s.status === 'Active' ? 'Disabled' : 'Active';
  toast(s.id + ' set to ' + s.status + ' (state model pending PM, Q1)'); emit();
}
