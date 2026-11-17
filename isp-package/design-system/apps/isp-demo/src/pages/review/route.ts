import type { EventRec } from '../../store/types';
import type { Route } from '../../router';

export type ReviewStep = 'toc' | 'shell' | 'code';

/** 没有 :step 时自动选（规则 4.5）：toc 为 review 则 toc；否则 shell 为 review 则 shell；否则任一 Code 节点为 review 则 code；否则 toc */
export function reviewStep(e: EventRec, sub: string | null): ReviewStep {
  if (sub === 'toc' || sub === 'shell' || sub === 'code') return sub;
  const st = e.flow.st;
  if (st.toc === 'review') return 'toc';
  if (st.shell === 'review') return 'shell';
  if (st.prodCode === 'review' || st.qcCode === 'review') return 'code';
  return 'toc';
}

/** 加载 TOC 工作台：节点为 review / locked / stale（规则 4.5）；empty 与 running 走生成态 */
export const isTocWorkbench = (R: Route, e: EventRec | undefined): boolean =>
  R.name === 'event' && R.tab === 'review' && !!e && reviewStep(e, R.sub) === 'toc' && ['review', 'locked', 'stale'].includes(e.flow.st.toc);
