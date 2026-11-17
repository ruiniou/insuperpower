import { SnackbarProvider } from '@wiz/react';
import { AppShell } from './AppShell';
import { EventOverviewPage } from './pages/EventOverviewPage';
import { PlaceholderPage, NotFoundPage } from './pages/PlaceholderPage';
import { ReviewPendingPage, ReviewTocPage } from './pages/review/ReviewTocPage';
import { reviewStep } from './pages/review/route';
import { StudiesPage } from './pages/StudiesPage';
import { useRoute } from './router';
import { S } from './store/selectors';
import { useDb } from './store/store';
import { ToastBridge } from './toast';
import { AssetPage } from './pages/study/AssetPage';
import { DatasetOverviewPage, DatasetSpacePage } from './pages/study/DatasetPage';
import { EventsPage } from './pages/study/EventsPage';
import { StudyModals } from './pages/study/StudyModals';

function Page() {
  const R = useRoute();
  useDb();
  if (R.name === 'studies') return <StudiesPage />;
  if (R.name === 'study') {
    if (!S.study(R.sid)) return <NotFoundPage what="Study" id={R.sid} />;
    if (R.tab === 'events') return <EventsPage sid={R.sid} />;
    if (R.tab === 'asset') return <AssetPage sid={R.sid} />;
    if (R.tab === 'dataset') return R.space ? <DatasetSpacePage sid={R.sid} space={R.space} /> : <DatasetOverviewPage sid={R.sid} />;
    return <PlaceholderPage route={R} title={'Study · ' + R.tab} />;
  }
  const e = S.event(R.eid);
  if (!e) return <NotFoundPage what="Event" id={R.eid} />;
  if (R.tab === 'overview') return <EventOverviewPage eid={e.id} />;
  if (R.tab === 'review') {
    const step = reviewStep(e, R.sub);
    if (step === 'toc') return ['review', 'locked', 'stale'].includes(e.flow.st.toc) ? <ReviewTocPage eid={e.id} /> : <ReviewPendingPage eid={e.id} step="toc" />;
    return <PlaceholderPage route={R} title={'Review · ' + (step === 'shell' ? 'Shell' : 'Code')} />;
  }
  return <PlaceholderPage route={R} title={'Event · ' + R.tab} />;
}

export function App() {
  return (
    <SnackbarProvider>
      <ToastBridge />
      <AppShell><Page /></AppShell>
      <StudyModals />
    </SnackbarProvider>
  );
}
