import { DOWN, EDGES, GROUP_LABEL, LOOP_NAME, LOOP_OF, NODE, NODES, SPACES, TOTAL } from './config';
import { btnFor, ovCtx, type BtnSpec, type OvCtx } from './flow';
import { S, dsByType, vLabel, vLabelBl } from './selectors';
import type { Disp, EventRec, NodeDef, NodeId } from './types';

/** Overview 的视图模型：全部由 event.flow 与引用数据派生（纯函数），UI 只负责渲染 */

export const wfTxt = (e: EventRec, n: NodeDef) => { const w = S.wf(e, LOOP_OF[n.id]); return w ? w.id + ' ' + LOOP_NAME[w.loop] : 'Not started'; };

export type ActionKey = 'jumpAsset' | 'jumpEventAsset' | 'jumpDs' | 'refAsset' | 'pinAsset' | 'pinDs' | 'jumpWf' | 'none';
export interface Target { act: ActionKey; arg?: string }

export interface InputsGroupVM { label: string; text: string; badge: string; open?: Target; change?: Target; changeLabel: string; dz?: boolean }

export function inputsGroups(e: EventRec): InputsGroupVM[] {
  const groups: InputsGroupVM[] = [];
  S.pinnedAssets(e).forEach(({ a, ref }) => {
    const lv = S.latest(a), nw = lv.n > ref.v;
    groups.push({ label: GROUP_LABEL[a.code] || a.tl, text: a.tl + ' ' + vLabelBl(a, ref.v), badge: nw ? lv.label + ' newer' : '', open: { act: 'jumpAsset', arg: a.id }, change: { act: 'pinAsset', arg: a.id }, changeLabel: 'Change ' + a.tl + ' version' });
  });
  ['SAP', 'CRF'].forEach((code) => {
    if (!S.pinnedAssets(e).some((x) => x.a.code === code)) groups.push({ label: GROUP_LABEL[code] || code, text: 'None pinned', badge: '', change: { act: 'refAsset', arg: code }, changeLabel: 'Choose ' + code });
  });
  SPACES.forEach((sp) => {
    const pins = S.pinnedDs(e, sp.key);
    if (sp.key !== 'dummy' && !pins.length) return;
    const nw = pins.filter((x) => S.latest(x.d).n > x.ref.v);
    groups.push({
      label: sp.key === 'dummy' ? 'Datasets' : sp.name + ' Datasets',
      text: pins.length ? (sp.key === 'dummy' && dsByType(e) ? dsByType(e) : pins.length + ' pinned') : 'None pinned',
      badge: nw.length ? nw[0].d.name + ' ' + S.latest(nw[0].d).label + ' newer' + (nw.length > 1 ? ' +' + (nw.length - 1) : '') : '',
      open: { act: 'jumpDs', arg: sp.key }, change: { act: 'pinDs', arg: sp.key }, changeLabel: 'Change pinned datasets', dz: true,
    });
  });
  return groups;
}

export interface CardRow { label: string; text: string; type: '' | 'none' | 'replace' | 'change'; target: Target }
export interface NodeCardVM { node: NodeDef; d: Disp; caption: string; note: string; rows: CardRow[]; btn: BtnSpec; confirming: boolean; confirmText: string; replaceDisabled: string; showBtn: boolean }

export function nodeCard(e: EventRec, C: OvCtx, n: NodeDef): NodeCardVM {
  const f = e.flow, ui = f.ui, d = C.disp(n.id), v = (id: NodeId) => 'v' + f.ver[id];
  const sapRef = S.pinnedAssets(e).find((x) => x.a.code === 'SAP');
  const sapTxt = sapRef ? 'SAP ' + vLabel(sapRef.a, sapRef.ref.v) : 'Choose SAP';
  const dummyPins = S.pinnedDs(e, 'dummy').length;
  const dsTxt = dummyPins ? (dsByType(e) || dummyPins + ' pinned') : 'None pinned';
  const R = (label: string, text: string, type: CardRow['type'] = '', act: ActionKey = 'jumpEventAsset', arg = ''): CardRow => ({ label, text, type, target: { act, arg } });
  const fileRow = (name: string) => (d === 'ready' || d === 'todo') ? R('File', 'Not generated yet', 'none') : R('File', name + ' ' + v(n.id), 'replace', 'jumpEventAsset', n.id);
  const wfRow = R('Workflow', wfTxt(e, n), '', 'jumpWf', LOOP_OF[n.id]);
  const dsRow = R('Datasets', dsTxt, 'change', 'pinDs', 'dummy');
  let rows: CardRow[] = [];
  if (n.id === 'toc') rows = [R('Source', sapTxt, '', sapRef ? 'jumpAsset' : 'refAsset', sapRef ? sapRef.a.id : 'SAP'), fileRow('TOC'), wfRow];
  if (n.id === 'shell') rows = [R('Source', 'TOC ' + v('toc')), fileRow('Mock Shell'), wfRow];
  if (n.id === 'prodCode') rows = [R('Source', 'Shell ' + v('shell')), fileRow('Prod Code'), dsRow, wfRow];
  if (n.id === 'qcCode') rows = [R('Source', 'Shell ' + v('shell')), fileRow('QC Code'), dsRow, wfRow];
  if (n.id === 'prodResult') rows = [R('Code', 'Prod Code ' + v('prodCode')), dsRow, wfRow];
  if (n.id === 'qcResult') rows = [R('Code', 'QC Code ' + v('qcCode')), dsRow, wfRow];
  if (n.id === 'pkg') rows = [R('Prod Result', C.countOf(NODE.prodResult) + ' results'), R('QC Result', C.countOf(NODE.qcResult) + ' results'), wfRow];
  if (d === 'stale') rows = rows.slice(0, 2);
  const direct = DOWN[n.id].filter((x) => f.st[x] !== 'empty').map((x) => NODE[x].name);
  return {
    node: n, d, caption: C.captionOf(n), note: (d === 'stale' && f.note[n.id]) || '', rows, btn: btnFor(C, n.id),
    confirming: ui.confirm === n.id,
    confirmText: 'Upload a new ' + (n.file || n.name) + '? ' + (direct.length ? direct.join(', ') + ' will show "Update available". Nothing reruns until you update.' : 'No downstream step is affected.'),
    replaceDisabled: d === 'running' ? 'Wait for the run to finish' : d === 'review' ? 'Finish the review first' : '',
    showBtn: d !== 'locked',
  };
}

export interface PopoverVM { edgeId: string; title: string; badge: string; badgeTone: 'green' | 'blue' | 'yellow' | 'grey'; lines: { label: string; text: string; link: boolean }[]; btn: BtnSpec; target: NodeId; loopTarget: NodeId; placement: 'below' | 'above'; bx: number; by: number }

export function popoverFor(e: EventRec, C: OvCtx, edgeId: string): PopoverVM | null {
  const x = EDGES.find((ed) => ed.id === edgeId); if (!x) return null;
  const f = e.flow, t = NODE[x.to], d = C.disp(x.to), v = (id: NodeId) => 'v' + f.ver[id];
  const sapRef = S.pinnedAssets(e).find((p) => p.a.code === 'SAP');
  const sapTxt = sapRef ? 'SAP ' + vLabel(sapRef.a, sapRef.ref.v) : 'Choose SAP';
  const dummyPins = S.pinnedDs(e, 'dummy').length;
  const dsPop = dummyPins ? dummyPins + ' Datasets' : 'No Datasets yet';
  const inputsTxt = ({ e1: [sapTxt], e2: ['TOC ' + v('toc')], e3: ['Shell ' + v('shell'), dsPop], e4: ['Shell ' + v('shell'), dsPop], e5: ['Prod Code ' + v('prodCode'), dsPop], e6: ['QC Code ' + v('qcCode'), dsPop], e7: ['Prod Result', 'QC Result'], e8: ['Prod Result', 'QC Result'] } as Record<string, string[]>)[x.id];
  const lines = inputsTxt.map((s, i) => ({ label: i === 0 ? 'Inputs' : '', text: s, link: true }));
  lines.push({ label: 'Output', text: t.name, link: false });
  lines.push({ label: 'Latest run', text: ({ locked: 'Completed', ready: 'None', stale: 'Built from an older input', todo: 'None', running: 'Running ' + f.prog[t.id] + '/' + TOTAL, review: 'Waiting for review' } as Record<Disp, string>)[d], link: false });
  const badge = ({ locked: 'Completed', ready: 'Ready', stale: 'Update available', todo: 'Not ready', running: 'Running', review: 'In review' } as Record<Disp, string>)[d];
  const badgeTone = ({ locked: 'green', ready: 'blue', stale: 'yellow', todo: 'grey', running: 'blue', review: 'blue' } as Record<Disp, PopoverVM['badgeTone']>)[d];
  return { edgeId, title: t.wfName, badge, badgeTone, lines, btn: btnFor(C, t.id), target: t.id, loopTarget: t.id, placement: x.pop === 'down' ? 'below' : 'above', bx: x.bx, by: x.by };
}

export type Tone = 'yellow' | 'blue' | 'grey' | 'red' | 'green' | 'purple';
export interface AttentionVM { k: number; key: string; tag: string; tone: Tone; title: string; sub: string; btnText: string; primary: boolean; act: 'start' | 'review' | 'jumpWf' | 'jumpEventAsset' | 'pinDs'; arg: string; keepLabel?: string; keepArg?: NodeId }

/** Needs your attention：类型 Badge 只有两色——Update 黄（需要决定），其余灰，避免五彩斑斓。节点状态的投影，不是独立数据。排序：Update → Review → Ready → Running → Study */
export function attentionRows(e: EventRec, C: OvCtx): AttentionVM[] {
  const f = e.flow, rows: AttentionVM[] = [];
  NODES.forEach((n) => {
    if (C.disp(n.id) !== 'stale') return;
    const nx = DOWN[n.id].filter((x) => f.st[x] !== 'empty').map((x) => NODE[x].name);
    rows.push({ k: 0, key: 'u-' + n.id, tag: 'Update', tone: 'yellow', title: n.name + ' can use ' + (f.note[n.id] || 'a newer input').replace(' available', ''), sub: 'Re-runs this step only' + (nx.length ? '. Then check ' + nx.join(', ') : ''), btnText: 'Update', primary: true, act: 'start', arg: n.id, keepLabel: 'Keep v' + f.ver[n.id], keepArg: n.id });
  });
  NODES.forEach((n) => { if (C.disp(n.id) === 'review') rows.push({ k: 1, key: 'r-' + n.id, tag: 'Review', tone: 'grey', title: n.name + ' needs review', sub: TOTAL + '/' + TOTAL + ' ' + (n.unit || 'items') + ' generated', btnText: 'Review', primary: true, act: 'review', arg: n.id }); });
  let firstReady = true;
  NODES.forEach((n) => { if (C.disp(n.id) === 'ready') { const pri = firstReady; firstReady = false; rows.push({ k: 2, key: 'y-' + n.id, tag: 'Ready', tone: 'grey', title: n.wfName, sub: n.inputs.length ? 'Inputs locked' : 'Inputs pinned', btnText: 'Start', primary: pri, act: 'start', arg: n.id }); } });
  NODES.forEach((n) => { if (C.disp(n.id) === 'running') rows.push({ k: 3, key: 'g-' + n.id, tag: 'Running', tone: 'grey', title: n.wfName, sub: f.prog[n.id] + '/' + TOTAL + ' ' + (n.unit || 'items') + ' done', btnText: 'View progress', primary: false, act: 'jumpWf', arg: LOOP_OF[n.id] }); });
  const na = S.newerAssetRefs(e), nd = S.newerDsRefs(e);
  if (na.length || nd.length) {
    const nw = na.map((x) => x.a.tl + ' ' + S.latest(x.a).label).concat(nd.map((x) => x.d.name + ' ' + S.latest(x.d).label));
    const st = na.map((x) => vLabel(x.a, x.ref.v)).concat(nd.map((x) => vLabel(x.d, x.ref.v)));
    rows.push({ k: 4, key: 'study', tag: 'Study', tone: 'grey', title: 'Newer Study versions', sub: nw.join(', ') + '. This Event stays on ' + st.join(' and '), btnText: 'Review', primary: false, act: na.length ? 'jumpEventAsset' : 'pinDs', arg: 'dummy' });
  }
  return rows.sort((a, b) => a.k - b.k);
}

export { ovCtx };
