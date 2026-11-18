import { getDb } from './store';
import type { Asset, Baseline, BaselineCode, EventRec } from './types';

/** 只有 Protocol 与 SAP 两个槽位；其他类型不进 Baseline */
export const BL_CODES: BaselineCode[] = ['PROTOCOL', 'SAP'];
export const BL_NAME: Record<BaselineCode, string> = { PROTOCOL: 'Protocol', SAP: 'SAP' };
export const isBlCode = (c: string): c is BaselineCode => c === 'PROTOCOL' || c === 'SAP';

/** 某 Study 的 Baseline，新的在前；第一个是 Current */
export const baselinesOf = (sid: string): Baseline[] => getDb().baselines.filter((b) => b.studyId === sid);
export const currentBaseline = (sid: string): Baseline | undefined => baselinesOf(sid)[0];
/** Study 内某类型唯一的 Asset（占位行不算） */
export const baselineAsset = (sid: string, code: BaselineCode): Asset | undefined =>
  getDb().assets.find((a) => a.studyId === sid && a.code === code && !a.required && a.versions.length > 0);

/** 引用该 Baseline 的 Event：Study 内 refs.assets 固定了它任一槽位里的版本。[AI 推断，待确认] */
export function baselineUsers(b: Baseline): EventRec[] {
  const slots = BL_CODES.map((c) => b.slots[c]).filter((s): s is NonNullable<typeof s> => !!s);
  return getDb().events.filter((e) => e.studyId === b.studyId && slots.some((s) => e.refs.assets[s.assetId]?.v === s.n));
}

/** 沿用：槽位与上一个 Baseline 的相同。返回这段连续相同槽位里最早那个 Baseline 的 label；不是沿用返回 null */
export function slotCarriedFrom(list: Baseline[], i: number, code: BaselineCode): string | null {
  const s = list[i]?.slots[code], same = (j: number) => { const t = list[j]?.slots[code]; return !!s && !!t && t.assetId === s.assetId && t.n === s.n; };
  if (!same(i + 1)) return null;
  let j = i + 1;
  while (same(j + 1)) j++;
  return list[j].label;
}

/** 包含某资产版本的 Baseline，新的在前 */
export const baselinesOfVersion = (a: Asset, n: number): Baseline[] =>
  baselinesOf(a.studyId).filter((b) => BL_CODES.some((c) => b.slots[c]?.assetId === a.id && b.slots[c]?.n === n));

/** `Baseline v3.0`；不属于任何 Baseline 返回空串。多个 Baseline 时取最新那个 */
export const baselineTag = (a: Asset, n: number): string => { const b = baselinesOfVersion(a, n)[0]; return b ? 'Baseline ' + b.label : ''; };

/** 新建 Baseline 的预填版本号：Current 的主版本号加 1（v2.0 到 v3.0）；没有 Baseline 为 v1.0 */
export function suggestBaselineLabel(sid: string): string {
  const cur = currentBaseline(sid);
  if (!cur) return 'v1.0';
  const m = /^(v?)(\d+)/i.exec(cur.label.trim());
  return m ? m[1] + (Number(m[2]) + 1) + '.0' : '';
}
