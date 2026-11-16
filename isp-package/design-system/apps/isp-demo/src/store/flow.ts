import { DOWN, NODE, TOTAL } from './config';
import type { Disp, EventRec, NodeDef, NodeId } from './types';

/** 节点状态派生（纯函数，只读）。依据 ISP-流程与状态规则 第 3 节：empty 的展示状态由上游是否全部 locked 派生 */
export function ovCtx(e: EventRec) {
  const f = e.flow;
  const inputsLocked = (id: NodeId) => NODE[id].inputs.every((i) => f.st[i] === 'locked');
  const disp = (id: NodeId): Disp => { const s = f.st[id]; if (s === 'empty') return inputsLocked(id) ? 'ready' : 'todo'; return s; };
  const vtxt = (id: NodeId) => 'v' + f.ver[id];
  const countOf = (n: NodeDef) => {
    if (!n.unit) return '';
    const d = disp(n.id);
    if (d === 'running') return f.prog[n.id] + '/' + TOTAL;
    if (d === 'ready' || d === 'todo') return '0/' + TOTAL;
    return TOTAL + '/' + TOTAL;
  };
  const captionOf = (n: NodeDef) => {
    const d = disp(n.id);
    return ({ locked: 'Locked ' + vtxt(n.id), ready: 'Ready to run', stale: 'Update available ' + vtxt(n.id), todo: 'Not ready', running: 'Running ' + f.prog[n.id] + '/' + TOTAL, review: 'Waiting for review' } as Record<Disp, string>)[d];
  };
  const downstream = (id: NodeId, acc: NodeId[] = []): NodeId[] => {
    DOWN[id].forEach((d) => { if (f.st[d] !== 'empty' && acc.indexOf(d) < 0) { acc.push(d); downstream(d, acc); } });
    return acc;
  };
  return { e, f, inputsLocked, disp, vtxt, countOf, captionOf, downstream };
}
export type OvCtx = ReturnType<typeof ovCtx>;

export interface BtnSpec { text: string; primary: boolean }
/** 节点主按钮文案与是否主按钮 */
export function btnFor(C: OvCtx, id: NodeId): BtnSpec {
  const d = C.disp(id);
  if (d === 'ready') return { text: 'Start', primary: true };
  if (d === 'stale') return { text: 'Update', primary: false };
  if (d === 'review') return { text: 'Open Review', primary: true };
  if (d === 'running') return { text: 'View progress', primary: false };
  if (d === 'todo') return { text: 'Check inputs', primary: false };
  return { text: 'Open file', primary: false };
}
