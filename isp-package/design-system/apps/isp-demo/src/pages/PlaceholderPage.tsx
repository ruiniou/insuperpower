import { Button } from '@wiz/react';
import { go, type Route } from '../router';

const fromRoute = (R: Route) => (R.name === 'studyNew' ? '#/studies/new' : R.name === 'study' ? `#/study/${R.sid}/${R.tab}` : R.name === 'event' ? `#/event/${R.eid}/${R.tab}${R.sub ? '/' + R.sub : ''}${R.node ? '/' + R.node : ''}` : '#/studies');

/** 试点范围外的路由占位 */
export function PlaceholderPage({ route, title }: { route: Route; title: string }) {
  const back = route.name === 'event' ? `#/event/${route.eid}/overview` : '#/studies';
  return (
    <div className="app-empty" role="status">
      <b>{title}</b>
      <span>Not part of this pilot. Route: <code>{fromRoute(route)}</code></span>
      <Button onClick={() => go(back)}>{route.name === 'event' ? 'Back to Overview' : 'Back to Studies'}</Button>
    </div>
  );
}

export function NotFoundPage({ what, id }: { what: string; id: string }) {
  return (
    <div className="app-empty" role="status">
      <b>{what} not found</b><span>{id}</span>
      <Button onClick={() => go('#/studies')}>Back to Studies</Button>
    </div>
  );
}
