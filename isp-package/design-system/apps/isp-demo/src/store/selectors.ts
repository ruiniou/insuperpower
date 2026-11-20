import { TYPE } from './assets';
import { baselineTag } from './baseline';
import { DOWN, LOOP_NODES, NODES, SPACES } from './config';
import { dLong } from './dates';
import { getDb } from './store';
import type { Asset, Dataset, EventRec, Study, Version, Workflow } from './types';

type Pinned<T> = { ref: { v: number; use: string } } & T;

/** 读取访问器（原型的 S），全部基于当前 DB */
export const S = {
  study: (id: string): Study | undefined => getDb().studies.find((s) => s.id === id),
  event: (id: string): EventRec | undefined => getDb().events.find((e) => e.id === id),
  asset: (id: string): Asset | undefined => getDb().assets.find((a) => a.id === id),
  ds: (id: string): Dataset | undefined => getDb().datasets.find((d) => d.id === id),
  eventsOf: (sid: string) => getDb().events.filter((e) => e.studyId === sid),
  assetsOf: (sid: string) => getDb().assets.filter((a) => a.studyId === sid && !a.required),
  placeholdersOf: (sid: string) => getDb().assets.filter((a) => a.studyId === sid && a.required && !a.versions.length),
  datasetsOf: (sid: string, space?: string) => getDb().datasets.filter((d) => d.studyId === sid && (!space || d.space === space)),
  assetUsers: (a: Asset, n?: number) => getDb().events.filter((e) => e.refs.assets[a.id] && (n == null || e.refs.assets[a.id].v === n)),
  dsUsers: (d: Dataset, n?: number) => getDb().events.filter((e) => e.refs.datasets[d.id] && (n == null || e.refs.datasets[d.id].v === n)),
  nWf: (e: EventRec) => e.wfs.length,
  latest: <T extends { versions: Version[] }>(x: T): Version => x.versions[0],
  vOf: <T extends { versions: Version[] }>(x: T, n: number): Version | undefined => x.versions.find((v) => v.n === n),
  pinnedAssets(e: EventRec): Pinned<{ a: Asset }>[] {
    return Object.keys(e.refs.assets).map((id) => ({ a: S.asset(id)!, ref: e.refs.assets[id] })).filter((x) => x.a);
  },
  pinnedDs(e: EventRec, space?: string): Pinned<{ d: Dataset }>[] {
    return Object.keys(e.refs.datasets).map((id) => ({ d: S.ds(id)!, ref: e.refs.datasets[id] })).filter((x) => x.d && (!space || x.d.space === space));
  },
  newerAssetRefs(e: EventRec) { return S.pinnedAssets(e).filter((x) => S.latest(x.a).n > x.ref.v); },
  newerDsRefs(e: EventRec) { return S.pinnedDs(e).filter((x) => S.latest(x.d).n > x.ref.v); },
  wf: (e: EventRec, loop: 'A' | 'B'): Workflow | null => (e.flow.wf[loop] ? e.wfs.find((w) => w.id === e.flow.wf[loop]) ?? null : null),
  nStale: (e: EventRec) => NODES.filter((n) => e.flow.st[n.id] === 'stale').length,
  ago: () => dLong(),
};
export { DOWN, SPACES };

/** 数据集版本的 Cut 与关联 Spec：目前存在 Version.meta，升级成结构化字段只改这里 */
export const cutOf = (v: Version): string => v.meta?.cut ?? '';
export const specOf = (v: Version): string => v.meta?.spec ?? '';

/** Workflow 实例状态由节点状态派生（与 Overview 共用同一份数据） */
export function wfInfo(e: EventRec, w: Workflow) {
  const f = e.flow, ids = LOOP_NODES[w.loop], st = ids.map((id) => f.st[id]);
  const locked = st.filter((x) => x === 'locked').length;
  let status = 'Not started';
  if (st.some((x) => x === 'running')) status = 'Running';
  else if (st.some((x) => x === 'review')) status = 'In review';
  else if (st.some((x) => x === 'stale')) status = 'Update available';
  else if (locked === ids.length) status = 'Locked';
  else if (locked > 0) status = 'In progress';
  const last = ids.filter((id) => f.st[id] !== 'empty').slice(-1)[0];
  return { total: ids.length, locked, status, ids, last };
}

export const vLabel = (x: { versions: Version[] }, n: number) => { const v = S.vOf(x, n); return v ? v.label : 'v' + n; };
/** 版本号加 Baseline 标签：`v3.0, Baseline v3.0`；Protocol 与 SAP 之外或不属于任何 Baseline 时只有版本号 */
export const vLabelBl = (a: Asset, n: number) => [vLabel(a, n), baselineTag(a, n)].filter(Boolean).join(', ');
export const dsCnt = (e: EventRec, c: string) => S.pinnedDs(e, 'dummy').filter((x) => x.d.cat === c).length;
export const dsByType = (e: EventRec) => ['ADaM', 'SDTM'].map((c) => [c, dsCnt(e, c)] as const).filter((x) => x[1]).map((x) => x[0] + ' ' + x[1]).join(', ');
export const eventCounts = (e: EventRec) => ({ asset: Object.keys(e.refs.assets).length + e.produced.length, ds: Object.keys(e.refs.datasets).length });

export const catOf = (a: { code: string }) => (TYPE(a.code) || { cat: 'Design' }).cat;
export const SPACE = (k: string) => SPACES.find((s) => s.key === k);
