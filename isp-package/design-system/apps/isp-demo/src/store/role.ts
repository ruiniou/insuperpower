import { S } from './selectors';
import { emit, getDb } from './store';
import type { EventRec, Study } from './types';

/** 职责身份（5.4）。Demo 里切换的是「我以哪种职责在用」；Study Admin、Event Owner 是否在某个 Study / Event 里生效，由数据判定 */
export type Duty = 'System Owner' | 'Study Admin' | 'Event Owner' | 'Member';
export const DUTIES: Duty[] = ['System Owner', 'Study Admin', 'Event Owner', 'Member'];

/** 权限点位默认值，顺序：System Owner / Study Admin / Event Owner / Member */
const POINTS = {
  'study.create': [1, 0, 0, 0],
  'study.metadata.update': [1, 1, 0, 0],
  'event.create': [0, 1, 0, 0],
  'event.duplicate': [1, 1, 1, 0],
  'study.member.manage': [1, 1, 0, 0],
  'event.member.manage': [1, 1, 1, 0],
  'event.archive': [1, 1, 1, 0],
  'event.owner.transfer': [0, 1, 0, 0],
} as const;
export type Point = keyof typeof POINTS;

export const session: { duty: Duty } = { duty: 'Study Admin' };
export const setDuty = (d: Duty) => { session.duty = d; emit(); };

export interface Scope { study?: Study; event?: EventRec }

/** 所选职责在某个范围里实际生效的职责（需求池 5.4）：System Owner 租户范围；Study Admin 只在自己担任 Study Admin 的 Study 里，Event Owner 只在自己负责的 Event 上，其余按 Member */
export function effectiveDuty(scope: Scope = {}, d: Duty = session.duty): Duty {
  const me = getDb().me.name;
  const study = scope.study ?? (scope.event ? S.study(scope.event.studyId) : undefined);
  if (d === 'Study Admin') return study?.admin === me ? 'Study Admin' : 'Member';
  if (d === 'Event Owner') return scope.event?.owner === me ? 'Event Owner' : 'Member';
  return d;
}

/** 点位判定。租户级点位（study.create）不传范围；Study 级传 study；Event 级传 event */
export const can = (p: Point, scope: Scope = {}, d: Duty = session.duty): boolean => POINTS[p][DUTIES.indexOf(effectiveDuty(scope, d))] === 1;
