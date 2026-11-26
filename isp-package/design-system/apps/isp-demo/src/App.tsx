import { SnackbarProvider } from '@wiz/react';
import { AppShell } from './AppShell';
import { EventOverviewPage } from './pages/EventOverviewPage';
import { PlaceholderPage, NotFoundPage } from './pages/PlaceholderPage';
import { ReviewPendingPage, ReviewTocPage } from './pages/review/ReviewTocPage';
import { reviewStep } from './pages/review/route';
import { CreateStudyPage } from './pages/CreateStudyPage';
import { StudiesPage } from './pages/StudiesPage';
import { useRoute } from './router';
import { S } from './store/selectors';
import { useDb } from './store/store';
import { ToastBridge } from './toast';
import { StudyPermissionsPage } from './pages/study/StudyPermissionsPage';
import { AssetPage } from './pages/study/AssetPage';
import { DatasetPage } from './pages/study/DatasetPage';
import { MemberPage } from './pages/study/MemberPage';
import { EventsPage } from './pages/study/EventsPage';
import { AuditTrailPage } from './pages/study/AuditTrailPage';
import { BlindingPage } from './pages/study/BlindingPage';
import { StudyModals } from './pages/study/StudyModals';

function Page() {
  const R = useRoute();
  useDb();
  if (R.name === 'studies') return <StudiesPage />;
  if (R.name === 'studyNew') return <CreateStudyPage />;
  if (R.name === 'study') {
    if (!S.workspaceStudy(R.sid)) return <NotFoundPage what="Study" id={R.sid} />;
    if (R.tab === 'events') return <EventsPage sid={R.sid} />;
    if (R.tab === 'asset' && R.space === 'permissions') return <StudyPermissionsPage key={R.sid + '/asset'} sid={R.sid} origin="document" />;
    if (R.tab === 'dataset' && R.space?.startsWith('permissions')) {
      return <StudyPermissionsPage key={R.sid + '/dataset'} sid={R.sid} origin="dataset" space={R.space.split(':')[1]} />;
    }
    if (R.tab === 'asset') return <AssetPage sid={R.sid} />;
    if (R.tab === 'member') return <MemberPage key={R.sid + ":" + R.space} sid={R.sid} initialUnspecified={R.space === "unspecified"} />;
    if (R.tab === 'dataset') return <DatasetPage sid={R.sid} space={R.space} />;
    if (R.tab === 'audit') return <AuditTrailPage sid={R.sid} />;
    if (R.tab === 'blinding') return <BlindingPage sid={R.sid} />;
    return <PlaceholderPage route={R} title={'Study · ' + R.tab} />;
  }
  const e = S.workspaceEvent(R.eid);
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
