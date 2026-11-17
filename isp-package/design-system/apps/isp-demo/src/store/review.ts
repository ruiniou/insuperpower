import { emit } from './store';

/** Review TOC 步的界面状态（原型 UI.rvSnap）：按 Event 暂存在内存里，切换步骤或再次进入可恢复，刷新即丢 */
export type TocFilter = 'all' | 'todo' | 'orphan';
export type VarMode = 'closed' | 'all' | 'flag';
export interface TocUi {
  sel: string;
  reviewed: Record<string, boolean>;
  filter: TocFilter;
  open: Record<string, boolean>;
  cites: boolean;
  vars: Record<string, VarMode>;
  why: Record<string, boolean>;
  outlineOpen: boolean;
  widths: { outline: number; outs: number };
}

let snaps: Record<string, TocUi> = {};
const fresh = (): TocUi => ({
  sel: 'i2', reviewed: {}, filter: 'all', open: { c3: true }, cites: true,
  vars: { i1: 'closed', i2: 'flag', i3: 'closed', i4: 'closed' }, why: {}, outlineOpen: true, widths: { outline: 220, outs: 440 },
});
export const tocUi = (eid: string): TocUi => (snaps[eid] ??= fresh());
export function patchToc(eid: string, p: Partial<TocUi>) { Object.assign(tocUi(eid), p); emit(); }
export const resetReviewUi = () => { snaps = {}; };
