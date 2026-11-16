import { useState, type ReactNode } from 'react';
import { Breadcrumb, Button, IconButton, SideBar, Tabs, type BreadcrumbItem } from '@wiz/react';
import { CopilotPanel } from './CopilotPanel';
import { go, useRoute, type Route } from './router';
import { hrefEvent, hrefStudy } from './store/actions';
import { eventCounts } from './store/selectors';
import { S, SPACES } from './store/selectors';
import { toast, useDb } from './store/store';
import { openModal } from './store/ui';

/** 页头面包屑（含 ▾ 同级切换）与页签随路由变化 */
function useHeader(R: Route): { crumbs: BreadcrumbItem[]; tabs: ReactNode } {
  const db = useDb();
  const studyCrumb = (sid: string, current: boolean): BreadcrumbItem => ({
    label: sid, ...(current ? {} : { href: hrefStudy(sid, 'events'), onClick: () => go(hrefStudy(sid, 'events')) }),
    options: db.studies.map((s) => ({ value: s.id, label: s.id, icon: 'ri-folder-line' })), currentValue: sid,
    onSwitch: (v) => go(hrefStudy(v, 'events')), searchPlaceholder: 'Search Study',
  });
  if (R.name === 'studies') return { crumbs: [{ label: 'Studies' }], tabs: null };
  if (R.name === 'studyNew') return { crumbs: [{ label: 'Studies', href: '#/studies' }, { label: 'New Study' }], tabs: null };
  if (R.name === 'study') {
    const s = S.study(R.sid);
    const items = [{ value: 'events', label: <>Events <i className="app-count">{S.eventsOf(R.sid).length}</i></> }, { value: 'asset', label: <>Asset <i className="app-count">{S.assetsOf(R.sid).length}</i></> }, { value: 'dataset', label: <>Dataset <i className="app-count">{S.datasetsOf(R.sid).length}</i></> }, { value: 'member', label: <>Member <i className="app-count">{s?.members ?? 0}</i></> }];
    return { crumbs: [{ label: 'Studies', href: '#/studies' }, studyCrumb(R.sid, true)], tabs: <Tabs variant="underline" aria-label="Study sections" items={items} value={R.tab} onChange={(v) => go(hrefStudy(R.sid, v))} /> };
  }
  const e = S.event(R.eid);
  if (!e) return { crumbs: [{ label: 'Studies', href: '#/studies' }, { label: 'Not found' }], tabs: null };
  const c = eventCounts(e);
  const items = [
    { value: 'overview', label: 'Overview' }, { value: 'workflow', label: 'Workflow' },
    { value: 'asset', label: <>Asset <i className="app-count">{c.asset}</i></> }, { value: 'dataset', label: <>Dataset <i className="app-count">{c.ds}</i></> },
    { value: 'member', label: <>Member <i className="app-count">{e.members}</i></> },
  ];
  const tab = R.tab === 'review' ? 'overview' : R.tab;
  return {
    crumbs: [
      { label: 'Studies', href: '#/studies' }, studyCrumb(e.studyId, false),
      {
        label: e.name, options: S.eventsOf(e.studyId).map((x) => ({ value: x.id, label: x.name, icon: 'ri-flow-chart' })), currentValue: e.id,
        onSwitch: (v) => go(hrefEvent(v, tab)), searchPlaceholder: 'Search Event',
      },
    ],
    tabs: <Tabs variant="underline" aria-label="Event sections" items={items} value={tab} onChange={(v) => go(hrefEvent(e.id, v))} />,
  };
}

export function AppShell({ children }: { children: ReactNode }) {
  const R = useRoute();
  const db = useDb();
  const { crumbs, tabs } = useHeader(R);
  const [copilot, setCopilot] = useState(false);
  const recent = db.recent.map((id) => S.event(id)).filter(Boolean).slice(0, 3);
  const soon = (name: string) => () => toast(name + ' is not in this prototype');
  const items = [
    { icon: 'ri-home-5-line', label: 'Home', value: 'home', onClick: soon('Home') },
    { icon: 'ri-folder-line', label: 'Studies', value: 'studies' },
    { icon: 'ri-book-2-line', label: 'Knowledge Base', value: 'kb', onClick: soon('Knowledge Base') },
    { group: 'Recent events' },
    ...recent.map((e) => ({ icon: 'ri-flow-chart', label: e!.name, description: e!.studyId, value: e!.id })),
  ];
  const active = R.name === 'event' && S.event(R.eid) ? R.eid : 'studies';
  return (
    <div className="app">
      <SideBar items={items} value={active} selectedTone="soft" user={{ name: db.me.name }}
        onSelect={(v) => { if (v === 'studies') go('#/studies'); else if (S.event(v)) go(hrefEvent(v, 'overview')); }} />
      <section className="app-main" aria-label="Main">
        <header className="app-hdr">
          <Breadcrumb items={crumbs} aria-label="Breadcrumb" />
          <div className="app-acts">
            {R.name === 'studies' && <Button variant="primary" leftIcon="ri-add-line" onClick={() => go('#/studies/new')}>New Study</Button>}
            {R.name === 'study' && R.tab === 'asset' && <Button leftIcon="ri-upload-2-line" onClick={() => openModal({ kind: 'uploadAsset', sid: R.sid, assetId: null, code: '' })}>Upload File</Button>}
            {R.name === 'study' && R.tab === 'dataset' && <Button variant="primary" leftIcon="ri-upload-2-line" onClick={() => openModal({ kind: 'uploadDataset', sid: R.sid, dsId: null, mode: R.space ? (SPACES.find((s) => s.key === R.space)?.mode ?? '') : '' })}>Upload Dataset</Button>}
            {R.name === 'study' && (R.tab === 'events' || R.tab === 'asset') && <Button variant="primary" leftIcon="ri-add-line" onClick={() => openModal({ kind: 'createEvent', sid: R.sid })}>New Event</Button>}
            {!copilot && <><span className="app-acts__sep" aria-hidden="true" /><IconButton className="app-copilot-btn" icon="ri-bard-fill" aria-label="Open Copilot" title="Copilot" onClick={() => setCopilot(true)} /></>}
          </div>
        </header>
        {tabs && <div className="app-tabs">{tabs}</div>}
        <div className="app-panel">{children}</div>
      </section>
      {copilot && <CopilotPanel route={R} onClose={() => setCopilot(false)} />}
    </div>
  );
}
