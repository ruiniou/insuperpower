import { useSyncExternalStore } from 'react';
import { S } from './store/selectors';
import { emit } from './store/store';
import { applyPendingDrawer, ui, type DrawerState } from './store/ui';

/** hash 路由，格式与原型 README 的路由表一致（只实现 #/studies 与 #/event/:eid/overview，其余走占位页） */
export type Route =
  | { name: 'studies' }
  | { name: 'studyNew' }
  | { name: 'study'; sid: string; tab: string; space: string | null }
  | { name: 'event'; eid: string; tab: string; sub: string | null; node: string | null };

export function parseRoute(hash: string): Route {
  const h = hash.replace(/^#\/?/, '').split('?')[0];
  const seg = h.split('/').filter(Boolean).map(decodeURIComponent);
  if (!seg.length || seg[0] === 'studies') return seg[1] === 'new' ? { name: 'studyNew' } : { name: 'studies' };
  if (seg[0] === 'study' && seg[1]) return { name: 'study', sid: seg[1], tab: seg[2] || 'events', space: seg[3] || null };
  if (seg[0] === 'event' && seg[1]) return { name: 'event', eid: seg[1], tab: seg[2] || 'overview', sub: seg[3] || null, node: seg[4] || null };
  return { name: 'studies' };
}

let current: Route = parseRoute(typeof location === 'undefined' ? '' : location.hash);
let routeKey = typeof location === 'undefined' ? '' : location.hash;
const subs = new Set<() => void>();

function onRoute() {
  applyPendingDrawer();
  routeKey = location.hash;
  current = parseRoute(location.hash);
  if (current.name === 'event' && S.event(current.eid)) S.touchRecent(current.eid); // Recent events：最近访问在前
  subs.forEach((f) => f());
  emit();
}
if (typeof window !== 'undefined') { window.addEventListener('hashchange', onRoute); onRoute(); }

export function go(hash: string, opts?: { drawer?: DrawerState }) {
  ui.pending = opts?.drawer;
  if (location.hash === hash) onRoute(); else location.hash = hash;
}

export function useRoute(): Route {
  useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => routeKey);
  return current;
}
