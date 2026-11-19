import { useRef, useState, type ReactNode } from 'react';
import { Breadcrumb, Button, IconButton, Pane, PopoverMenu, Select, SideBar, SideBarToggle, Splitter, Tabs, type BreadcrumbItem } from '@wiz/react';
import { ICON } from './icons';
import { ReviewNavContext } from './pages/review/nav';
import { CopilotPanel } from './CopilotPanel';
import { BlindTag } from './pages/study/common';
import { StudyDetailsDrawer } from './pages/study/StudyDetailsDrawer';
import { go, useRoute, type Route } from './router';
import { hrefEvent, hrefStudy } from './store/actions';
import { eventCounts } from './store/selectors';
import { memberCount } from './store/members';
import { S, SPACES } from './store/selectors';
import { can, DUTIES, session, setDuty, type Duty } from './store/role';
import { toast, useDb } from './store/store';
import { openDrawer, openModal, ui } from './store/ui';
import { isTocWorkbench } from './pages/review/route';

/** 页头面包屑（含 ▾ 同级切换）与页签随路由变化。面包屑不含 Studies（列表入口在 Nav），只有 Studies 列表页自己显示 */
function useHeader(R: Route): { crumbs: BreadcrumbItem[]; tabs: ReactNode } {
  const db = useDb();
  const studyCrumb = (sid: string, current: boolean): BreadcrumbItem => ({
    label: sid, icon: ICON.study, ...(current ? {} : { href: hrefStudy(sid, 'events'), onClick: () => go(hrefStudy(sid, 'events')) }),
    options: db.studies.map((s) => ({ value: s.id, label: s.id, icon: ICON.study })), currentValue: sid,
    onSwitch: (v) => go(hrefStudy(v, 'events')), searchPlaceholder: 'Search Study',
  });
  if (R.name === 'studies') return { crumbs: [{ label: 'Studies' }], tabs: null };
  if (R.name === 'studyNew') return { crumbs: [{ label: 'New Study' }], tabs: null };
  if (R.name === 'study') {
    const s = S.study(R.sid);
    const items = [{ value: 'events', label: <>Events <i className="app-count">{S.eventsOf(R.sid).length}</i></> }, { value: 'asset', label: <>Asset <i className="app-count">{S.assetsOf(R.sid).length}</i></> }, { value: 'dataset', label: <>Dataset <i className="app-count">{S.datasetsOf(R.sid).length}</i></> }, { value: 'member', label: <>Member <i className="app-count">{memberCount(R.sid)}</i></> }];
    return { crumbs: [studyCrumb(R.sid, true)], tabs: <Tabs variant="underline" aria-label="Study sections" items={items} value={R.tab} onChange={(v) => go(hrefStudy(R.sid, v))} /> };
  }
  const e = S.event(R.eid);
  if (!e) return { crumbs: [{ label: 'Event not found' }], tabs: null };
  const c = eventCounts(e);
  const items = [
    { value: 'overview', label: 'Overview' }, { value: 'workflow', label: 'Workflow' },
    { value: 'asset', label: <>Asset <i className="app-count">{c.asset}</i></> }, { value: 'dataset', label: <>Dataset <i className="app-count">{c.ds}</i></> },
    { value: 'member', label: <>Member <i className="app-count">{e.members}</i></> },
  ];
  const tab = R.tab === 'review' ? 'overview' : R.tab;
  return {
    crumbs: [
      studyCrumb(e.studyId, false),
      {
        label: e.name, icon: ICON.event, options: S.eventsOf(e.studyId).map((x) => ({ value: x.id, label: x.name, icon: ICON.event })), currentValue: e.id,
        onSwitch: (v) => go(hrefEvent(v, tab)), searchPlaceholder: 'Search Event',
      },
    ],
    tabs: <Tabs variant="underline" aria-label="Event sections" items={items} value={tab} onChange={(v) => go(hrefEvent(e.id, v))} />,
  };
}

const MAIN_MIN = 480;
const CP = { def: 360, min: 320, max: 520 };
const NAV = { def: 160, min: 140, max: 280 };

/** 侧面板宽度：拖 Splitter 调整；变宽的上限 = 当前宽 + 主面板还能让出的宽度（主面板不低于 480）与表内最大值取较小者；变窄不受主面板限制，且不会被反向挤压 */
function usePaneWidth(main: React.RefObject<HTMLElement>, lim: { def: number; min: number; max: number }) {
  const [w, setW] = useState(lim.def);
  const [dragging, setDragging] = useState(false);
  const room = () => Math.max(0, (main.current?.offsetWidth ?? MAIN_MIN) - MAIN_MIN);
  const max = () => Math.round(Math.min(lim.max, w + room()));
  const resize = (d: number) => setW((cur) => (d > 0 ? Math.min(cur + d, Math.max(cur, Math.min(lim.max, cur + room()))) : Math.max(lim.min, cur + d)));
  return { w, dragging, max, resize, start: () => setDragging(true), end: () => setDragging(false) };
}

export function AppShell({ children }: { children: ReactNode }) {
  const R = useRoute();
  const db = useDb();
  const { crumbs, tabs } = useHeader(R);
  const [copilotOpen, setCopilot] = useState(false);
  /** 新建 Study 页不提供 Copilot：入口隐藏，已打开的面板同时收起 */
  const copilot = copilotOpen && R.name !== 'studyNew';
  const [navCollapsed, setNavCollapsed] = useState(true);
  /** 普通页面的 Nav：默认展开，可收起；收起后展开入口在页头最左 */
  const [mainNavCollapsed, setMainNavCollapsed] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const cp = usePaneWidth(mainRef, CP);
  const nav = usePaneWidth(mainRef, NAV);
  const navSplitter = <div className="app-sp app-sp--nav"><Splitter size={0} line={false} value={nav.w} min={NAV.min} max={nav.max()} aria-label="Resize navigation" onResize={nav.resize} onResizeStart={nav.start} onResizeEnd={nav.end} /></div>;
  const copilotPane = (
    <>
      {copilot && <div className="app-sp"><Splitter size={0} line={false} reverse value={cp.w} min={CP.min} max={cp.max()} aria-label="Resize Copilot" onResize={cp.resize} onResizeStart={cp.start} onResizeEnd={cp.end} /></div>}
      <Pane open={copilot} width={cp.w + 8} gapStart dragging={cp.dragging}><CopilotPanel route={R} onClose={() => setCopilot(false)} /></Pane>
    </>
  );
  const study = R.name === 'study' ? S.study(R.sid) : undefined;
  const soon = (name: string) => () => toast(name + ' is not in this prototype');
  const items = [
    { icon: 'ri-home-5-line', label: 'Home', value: 'home', onClick: soon('Home') },
    { icon: ICON.study, label: 'Studies', value: 'studies' },
    { icon: 'ri-book-2-line', label: 'Knowledge Base', value: 'kb', onClick: soon('Knowledge Base') },
  ];
  const active = 'studies';
  /** Review 工作台：Nav 默认收起（页头左侧有展开按钮），用自己的页头，不带 Event 页签 */
  if (isTocWorkbench(R, R.name === 'event' ? S.event(R.eid) : undefined)) {
    return (
      <ReviewNavContext.Provider value={{ collapsed: navCollapsed, expand: () => setNavCollapsed(false), copilotOpen: copilot, openCopilot: () => setCopilot(true), closeCopilot: () => setCopilot(false) }}>
        <div className="app app--review">
          <Pane open={!navCollapsed} width={nav.w + 8} gapEnd dragging={nav.dragging || cp.dragging}>
            <SideBar items={items} value={active} selectedTone="soft" user={{ name: db.me.name }} collapsible collapsed={false} onToggle={setNavCollapsed} expandedWidth={nav.w}
              onSelect={(v) => { if (v === 'studies') go('#/studies'); }} />
          </Pane>
          {!navCollapsed && navSplitter}
          <section className="app-main" aria-label="Review" ref={mainRef}>{children}</section>
          {copilotPane}
        </div>
      </ReviewNavContext.Provider>
    );
  }
  return (
    <div className="app">
      <Pane open={!mainNavCollapsed} width={nav.w + 8} gapEnd dragging={nav.dragging || cp.dragging}>
      <div className="app-side">
      <SideBar items={items} value={active} selectedTone="soft" user={{ name: db.me.name }} collapsible collapsed={false} onToggle={setMainNavCollapsed} expandedWidth={nav.w}
        onSelect={(v) => { if (v === 'studies') go('#/studies'); }} />
        <div className="app-role"><Select size="small" aria-label="Demo role" label="Demo role" options={DUTIES.map((d) => ({ value: d, label: d }))} value={session.duty} onChange={(v) => setDuty(v as Duty)} /></div>
      </div>
      </Pane>
      {!mainNavCollapsed && navSplitter}
      <section className="app-main" aria-label="Main" ref={mainRef}>
        <header className="app-hdr">
          <div className="app-crumb">{mainNavCollapsed && <SideBarToggle onClick={() => setMainNavCollapsed(false)} />}<Breadcrumb size="sm" items={crumbs} aria-label="Breadcrumb" />{study && study.blinding !== 'Not blinded' && <BlindTag v={study.blinding} />}</div>
          <div className="app-acts">
            {R.name === 'study' && <PopoverMenu align="right" width={160} trigger={<IconButton size="compact" icon="ri-more-2-fill" aria-label="More" />} items={[{ label: 'Study details', value: 'details' }]} onSelect={() => openDrawer({ kind: 'studyDetails', id: R.sid })} />}
            {!copilot && R.name !== 'studyNew' && <><span className="app-acts__sep" aria-hidden="true" /><IconButton size="compact" className="app-copilot-btn" icon="wiz-logo-icon" aria-label="Open Copilot" title="Copilot" onClick={() => setCopilot(true)} /></>}
          </div>
        </header>
        {tabs && <div className="app-tabs">{tabs}</div>}
        <div className="app-panel">{children}</div>
        {R.name === 'study' && ui.drawer?.kind === 'studyDetails' && <StudyDetailsDrawer id={ui.drawer.id} />}
      </section>
      {copilotPane}
    </div>
  );
}
