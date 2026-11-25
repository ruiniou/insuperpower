import { useSyncExternalStore } from 'react';
import type { SnackbarOptions } from '@wiz/react';
import { createSeed } from './seed';
import type { Database } from './types';

/** 单一内存 store：所有页面读写同一份 DB，刷新即重置（与原型一致）。变更后调用 emit() 通知订阅者 */
let db: Database = createSeed();
let version = 0;
const subs = new Set<() => void>();

export const getDb = (): Database => db;
export const emit = () => { version++; subs.forEach((f) => f()); };
export const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const getVersion = () => version;

/** 组件里调用：订阅变更，返回 DB（引用不变，版本号变化触发重渲染） */
export function useDb(): Database {
  useSyncExternalStore(subscribe, getVersion);
  return db;
}

const timers: Record<string, ReturnType<typeof setInterval>> = {};
export const setTimer = (key: string, fn: () => void, ms: number) => { clearInterval(timers[key]); timers[key] = setInterval(fn, ms); };
export const clearTimer = (key: string) => { clearInterval(timers[key]); delete timers[key]; };

/** 测试与“重置演示数据”用 */
export function resetDb() { Object.keys(timers).forEach(clearTimer); db = createSeed(); emit(); }

type ToastOptions = Pick<SnackbarOptions, 'type' | 'description' | 'actionable' | 'actionLabel' | 'onAction' | 'duration'>;
let toastFn: (msg: string, options?: ToastOptions) => void = () => {};
export const setToastHandler = (handler: typeof toastFn) => { toastFn = handler; };
export const toast = (msg: string, options?: ToastOptions) => toastFn(msg, options);
