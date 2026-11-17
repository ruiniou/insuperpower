import { emit } from './store';

/** 职责身份（5.4）。Demo 全局切换一个职责，不区分具体 Study / Event 的归属 */
export type Duty = 'System Owner' | 'Study Admin' | 'Event Owner' | 'Member';
export const DUTIES: Duty[] = ['System Owner', 'Study Admin', 'Event Owner', 'Member'];

/** 权限点位默认值，顺序：System Owner / Study Admin / Event Owner / Member */
const POINTS = {
  'study.create': [1, 0, 0, 0],
  'study.metadata.update': [1, 1, 0, 0],
  'event.create': [0, 1, 0, 0],
  'event.duplicate': [1, 1, 1, 0],
  'event.member.manage': [1, 1, 1, 0],
  'event.archive': [1, 1, 1, 0],
  'event.owner.transfer': [0, 1, 0, 0],
} as const;
export type Point = keyof typeof POINTS;

export const session: { duty: Duty } = { duty: 'Study Admin' };
export const setDuty = (d: Duty) => { session.duty = d; emit(); };
export const can = (p: Point, d: Duty = session.duty): boolean => POINTS[p][DUTIES.indexOf(d)] === 1;
