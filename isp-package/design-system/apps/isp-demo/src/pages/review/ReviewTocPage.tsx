import { useEffect, useRef, useState } from 'react';
import { Button, EmptyState, IconButton, OutlineFilter, OutlineGroup, OutlineRow, PanelHead, Pane, Splitter, Switch, outlineMark } from '@wiz/react';
import { go } from '../../router';
import { hrefEvent, hrefReview, hrefWf, rvCommit } from '../../store/actions';
import { LOOP_OF, NODE, TOTAL } from '../../store/config';
import { patchToc, tocUi, type TocFilter } from '../../store/review';
import { S } from '../../store/selectors';
import { useDb } from '../../store/store';
import { ReviewHeader, type LockSpec } from './ReviewHeader';
import { useReviewNav } from './nav';
import { SapReader } from './SapReader';
import { SectionOutputs } from './SectionOutputs';
import { CHAPTERS, OUTPUTS, SAP_FILE, SECTION } from './tocMock';
import './review.css';

const kindOf = (no: string) => (no.startsWith('16.') ? 'listing' : 'table');

/** Review 工作台的 TOC 步：Outline 与 Filter | SAP 原文 | 本节输出。内容为 Mock，状态经 rvCommit 回写 store */
export function ReviewTocPage({ eid }: { eid: string }) {
  useDb();
  const e = S.event(eid)!;
  const ui = tocUi(eid);
  const nav = useReviewNav();
  /** 打开 Copilot 时 Outline 自动收起；Outline 收起时点展开会关闭 Copilot（参考 S-3） */
  const outlineOpen = ui.outlineOpen && !nav?.copilotOpen;
  const st = e.flow.st.toc;
  const locked = st === 'locked';
  const readOnly = st !== 'review';
  const [focusPara, setFocusPara] = useState<string | null>(null);
  const work = useRef<HTMLDivElement>(null);
  const sap = useRef<HTMLElement>(null);
  const [dragging, setDragging] = useState(false);

  const reviewed = (id: string) => locked || !!ui.reviewed[id];
  const reviewedN = OUTPUTS.filter((o) => reviewed(o.id)).length;
  const sectionDone = reviewedN === OUTPUTS.length;

  const markOne = (id: string) => patchToc(eid, { reviewed: { ...ui.reviewed, [id]: !ui.reviewed[id] } });
  const markSection = () => patchToc(eid, { reviewed: Object.fromEntries(OUTPUTS.map((o) => [o.id, !sectionDone])) });

  /** Lock 不可用的原因（规则 R4-40、R4-45）；已锁定另算 */
  const why = locked ? '' : st === 'stale' ? 'This step needs an update first. Use Update on the Overview.' : sectionDone ? '' : `Section ${SECTION.no} is not reviewed yet. Mark it as reviewed above the document.`;
  const lock: LockSpec = {
    why, locked,
    text: e.flow.st.shell === 'empty' ? 'Locks the TOC and makes it read-only. Shell generation starts next.' : 'Locks the TOC and makes it read-only.',
    onConfirm: () => rvCommit(e, 'toc'),
  };

  // Filter 与 Outline 行
  const rows = CHAPTERS.map((c) => ({
    c,
    items: c.live
      ? OUTPUTS.map((o) => ({ key: o.id, no: o.no, title: o.title, reviewed: reviewed(o.id), orphan: false, id: o.id as string | null }))
      : (c.items ?? []).map((it) => ({ key: it.no, no: it.no, title: it.title, reviewed: !!it.reviewed, orphan: !!it.orphan, id: null as string | null })),
  }));
  const all = rows.flatMap((r) => r.items);
  const counts = { all: all.length, todo: all.filter((x) => !x.reviewed).length, orphan: all.filter((x) => x.orphan).length };
  const keep = (x: { reviewed: boolean; orphan: boolean }) => ui.filter === 'all' || (ui.filter === 'todo' && !x.reviewed) || (ui.filter === 'orphan' && x.orphan);
  const filterOpts = [{ value: 'all', label: 'All', count: counts.all }, { value: 'todo', label: 'Unreviewed', count: counts.todo }, { value: 'orphan', label: 'No source text', count: counts.orphan }];

  const [w, setW] = useState(ui.widths);
  /** 主面板最小 480：变宽的上限 = 当前宽 + 主面板还能让出的宽度，与表内最大值取较小者；变窄只受下限约束。
   *  用函数式更新，一帧内多次 mousemove 不会丢增量；主面板已不足 480 时只是不再变宽，不会把面板反向挤小（否则拖动会跳变） */
  const resize = (which: 'outline' | 'outs', d: number) => setW((cur) => {
    const lim = which === 'outline' ? [180, 320] : [320, 560];
    const v = cur[which];
    const room = Math.max(0, (sap.current?.offsetWidth ?? 480) - 480);
    const next = d > 0 ? Math.min(v + d, Math.max(v, Math.min(lim[1], v + room))) : Math.max(lim[0], v + d);
    return next === v ? cur : { ...cur, [which]: next };
  });
  useEffect(() => { ui.widths = w; }, [w, ui]);

  const selected = OUTPUTS.find((o) => o.id === ui.sel);
  return (
    <>
      <ReviewHeader e={e} step="toc" lock={lock} />
      <div className="rv-work" ref={work}>
        <Pane open={outlineOpen} width={w.outline} dragging={dragging}>
            <aside className="rv-ol" aria-label="Outline">
              <PanelHead title="Outline" actions={<IconButton icon="ri-close-line" size="medium" aria-label="Close Outline" title="Close Outline" onClick={() => patchToc(eid, { outlineOpen: false })} />} />
              <div className="rv-ol__filter"><OutlineFilter options={filterOpts} value={ui.filter} onChange={(v) => patchToc(eid, { filter: v as TocFilter })} aria-label="Outline filter" /></div>
              <div className="rv-ol__body">
                {rows.map(({ c, items }) => {
                  const shown = items.filter(keep);
                  if (ui.filter !== 'all' && !shown.length) return null;
                  const open = ui.filter !== 'all' ? true : !!ui.open[c.id];
                  return (
                    <OutlineGroup key={c.id} no={c.no} title={c.title} done={items.filter((x) => x.reviewed).length} total={items.length} open={open}
                      onToggle={() => patchToc(eid, { open: { ...ui.open, [c.id]: !ui.open[c.id] } })}>
                      {shown.map((x) => (
                        <OutlineRow key={x.key} kind={kindOf(x.no)} no={x.no} title={x.title} active={x.id === ui.sel} disabled={!x.id}
                          mark={outlineMark({ warn: x.orphan, done: x.reviewed })} markLabel={x.orphan ? 'No source text' : 'Reviewed'}
                          onClick={() => x.id && patchToc(eid, { sel: x.id })} />
                      ))}
                    </OutlineGroup>
                  );
                })}
                {ui.filter !== 'all' && !all.some(keep) && <EmptyState title="No matching outputs" />}
              </div>
            </aside>
        </Pane>
        {outlineOpen && <Splitter size={0} value={w.outline} min={180} max={320} aria-label="Resize Outline" onResize={(d) => resize('outline', d)} onResizeStart={() => setDragging(true)} onResizeEnd={() => setDragging(false)} />}
        <section className="rv-sap" id="sap-main" aria-label="SAP" ref={sap}>
          <PanelHead
            leading={!outlineOpen ? <IconButton icon="ri-menu-unfold-line" size="medium" aria-label="Open Outline" title="Open Outline" onClick={() => { nav?.closeCopilot(); patchToc(eid, { outlineOpen: true }); }} /> : undefined}
            icon="ri-file-text-line" iconLabel={'SAP ' + SAP_FILE} title={`§${SECTION.no} ${SECTION.title}`} meta={`${reviewedN} / ${OUTPUTS.length} Reviewed`}
            actions={<>
              <Switch size="small" label="Show citations" checked={ui.cites} onChange={(v) => patchToc(eid, { cites: v })} />
              <Button status={readOnly ? 'disable' : 'default'} leftIcon={sectionDone ? 'ri-check-line' : 'ri-checkbox-blank-line'} aria-pressed={sectionDone} aria-label={sectionDone ? (readOnly ? 'Section reviewed' : 'Unmark section as reviewed') : 'Mark section as reviewed'} title={readOnly ? undefined : sectionDone ? 'Click to unmark all outputs in this section' : 'Mark all outputs in this section as reviewed'} onClick={markSection}>Reviewed</Button>
            </>} />
          <SapReader sel={ui.sel} cites={ui.cites} focusPara={focusPara} onPick={(id) => patchToc(eid, { sel: id })} />
        </section>
        <Splitter size={0} reverse value={w.outs} min={320} max={560} aria-label="Resize Section outputs" onResize={(d) => resize('outs', d)} onResizeStart={() => setDragging(true)} onResizeEnd={() => setDragging(false)} />
        <div style={{ width: w.outs }} className="rv-outs-wrap">
          <SectionOutputs eid={eid} ui={ui} outputs={OUTPUTS} reviewed={reviewed} readOnly={readOnly}
            onSelect={(id) => patchToc(eid, { sel: id })} onMark={markOne}
            onJump={(p) => { setFocusPara(null); requestAnimationFrame(() => setFocusPara(p)); }}
            onOpenShell={() => go(hrefReview(eid, 'shell'))} />
        </div>
      </div>
      {selected && <span className="rv-sr" aria-live="polite">{selected.no} selected</span>}
    </>
  );
}

/** 节点为 empty 或 running 时的 Review 页（规则 4.5）：不加载工作台 */
export function ReviewPendingPage({ eid, step }: { eid: string; step: 'toc' | 'shell' | 'code' }) {
  useDb();
  const e = S.event(eid)!;
  const id = step === 'toc' ? 'toc' : 'shell';
  const name = NODE[id].name;
  const w = S.wf(e, LOOP_OF[id]);
  if (e.flow.st[id] === 'running') return <div className="rv-pending"><EmptyState title={'Generating ' + name} description={e.flow.prog[id] + ' of ' + TOTAL} /></div>;
  return (
    <div className="rv-pending">
      <EmptyState title={name + ' is not generated yet'} description="Start it from the Workflow page."
        action={<Button onClick={() => go(w ? hrefWf(e.id, w.id, id) : hrefEvent(e.id, 'workflow'))}>Open Workflow</Button>} />
    </div>
  );
}
