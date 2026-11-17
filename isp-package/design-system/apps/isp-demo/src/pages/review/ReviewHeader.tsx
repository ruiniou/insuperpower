import { useEffect, useRef, useState } from 'react';
import { Breadcrumb, Button, IconButton, Popover, SideBarToggle, StepNav, type BreadcrumbItem } from '@wiz/react';
import { go } from '../../router';
import { hrefEvent, hrefReview, hrefStudy, hrefWf } from '../../store/actions';
import { LOOP_OF } from '../../store/config';
import { S } from '../../store/selectors';
import { getDb } from '../../store/store';
import type { EventRec } from '../../store/types';
import { useReviewNav } from './nav';
import type { ReviewStep } from './route';

export interface LockSpec {
  /** 不可用原因；空串表示可点 */
  why: string;
  /** 已锁定：按钮禁用，title 为 Locked，不弹原因气泡 */
  locked: boolean;
  /** 确认气泡正文 */
  text: string;
  onConfirm: () => void;
}

/** 完整层级 Study ▾ › Event ▾ › Workflow › WF-xx（不含 Studies，列表入口在左侧 Nav），Review 里只显示最后三层：名称跳转，▾ 切换同级（规则 U-4、U-6、R4-47） */
function crumbsOf(e: EventRec): BreadcrumbItem[] {
  const w = S.wf(e, LOOP_OF.toc);
  const full: BreadcrumbItem[] = [
    {
      label: e.studyId, href: hrefStudy(e.studyId, 'events'), onClick: () => go(hrefStudy(e.studyId, 'events')),
      options: getDb().studies.map((s) => ({ value: s.id, label: s.id, icon: 'ri-folder-line' })), currentValue: e.studyId,
      onSwitch: (v) => go(hrefStudy(v, 'events')), searchPlaceholder: 'Search Study',
    },
    {
      label: e.name, href: hrefEvent(e.id, 'overview'), onClick: () => go(hrefEvent(e.id, 'overview')),
      options: S.eventsOf(e.studyId).map((x) => ({ value: x.id, label: x.name, icon: 'ri-flow-chart' })), currentValue: e.id,
      onSwitch: (v) => go(hrefEvent(v, 'overview')), searchPlaceholder: 'Search Event',
    },
    ...(w ? [{ label: 'Workflow', href: hrefEvent(e.id, 'workflow') }, { label: w.id, href: hrefWf(e.id, w.id) }] : []),
  ];
  return full.slice(-3); // 最多三层，保留最靠近当前位置的层级
}

/** 页头：面包屑 | 居中的步骤导航 | Lock + Approve */
export function ReviewHeader({ e, step, lock }: { e: EventRec; step: ReviewStep; lock: LockSpec }) {
  const [pop, setPop] = useState<null | 'confirm' | 'why'>(null);
  const root = useRef<HTMLSpanElement>(null);
  const st = e.flow.st;
  useEffect(() => {
    if (!pop) return;
    const onDoc = (ev: MouseEvent) => { if (root.current && !root.current.contains(ev.target as Node)) setPop(null); };
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') setPop(null); };
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [pop]);

  const crumbs = crumbsOf(e);
  const nav = useReviewNav();
  const steps = [
    { value: 'toc', label: 'TOC', icon: 'ri-list-check-2', locked: st.toc === 'locked' },
    { value: 'shell', label: 'Shell', icon: 'ri-table-line', locked: st.shell === 'locked' },
    { value: 'code', label: 'Code', icon: 'ri-code-s-slash-line', locked: st.prodCode === 'locked' && st.qcCode === 'locked' },
  ];
  const notReady = !!lock.why && !lock.locked;
  const click = () => { if (lock.locked) return; setPop(lock.why ? 'why' : 'confirm'); };
  return (
    <header className="rv-hdr">
      <div className="rv-hdr__lead">
        {nav?.collapsed && <SideBarToggle collapsed onClick={nav.expand} />}
        <Breadcrumb size="sm" className="rv-hdr__crumb" aria-label="Breadcrumb" items={crumbs} />
      </div>
      <StepNav className="rv-hdr__steps" aria-label="Review steps" items={steps} value={step} onChange={(v) => go(hrefReview(e.id, v, v === 'code' ? 'prodCode' : undefined))} />
      <div className="rv-hdr__acts">
        <span className="rv-lock" ref={root}>
          {/* 未就绪时不用原生 disabled，保持可聚焦，点击或回车弹出原因气泡 */}
          <Button variant="primary" status={lock.locked ? 'disable' : 'default'} className={notReady ? 'is-disabled rv-lock__btn' : undefined}
            aria-disabled={notReady || undefined} title={lock.locked ? 'Locked' : lock.why || undefined} onClick={click}>Lock + Approve</Button>
          {pop === 'confirm' && (
            <Popover variant="confirm" arrow="up" arrowOffset={254} title="Lock + Approve TOC" className="rv-lock__pop"
              footer={<><Button variant="link" onClick={() => setPop(null)}>Cancel</Button><Button variant="primary" autoFocus onClick={() => { setPop(null); lock.onConfirm(); }}>Lock + Approve</Button></>}>
              <b>Lock + Approve TOC</b><span>{lock.text}</span>
            </Popover>
          )}
          {pop === 'why' && (
            <Popover variant="confirm" arrow="up" arrowOffset={254} title="Not ready to lock" className="rv-lock__pop"
              footer={<Button variant="link" autoFocus onClick={() => setPop(null)}>Close</Button>}>
              <b>Not ready to lock</b><span>{lock.why}</span>
            </Popover>
          )}
        </span>
        {nav && !nav.copilotOpen && <><span className="rv-hdr__sep" aria-hidden="true" /><IconButton size="compact" className="app-copilot-btn" icon="wiz-logo-icon" aria-label="Open Copilot" title="Copilot" onClick={nav.openCopilot} /></>}
      </div>
    </header>
  );
}
