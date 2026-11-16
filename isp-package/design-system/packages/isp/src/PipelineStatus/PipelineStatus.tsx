import type { HTMLAttributes } from 'react';
import { cx } from '../cx';
import './PipelineStatus.css';

/** 流水线节点的展示状态（由节点存储状态 + 上游是否 Locked 派生，见 ISP-Agent-设计参考 2.4.2） */
export type PipelineState = 'locked' | 'ready' | 'stale' | 'todo' | 'running' | 'review';

const ICON: Record<PipelineState, string> = {
  locked: 'ri-checkbox-circle-line',
  ready: 'ri-play-circle-line',
  stale: 'ri-error-warning-line',
  todo: 'ri-checkbox-blank-circle-line',
  running: 'ri-loader-4-line',
  review: 'ri-time-line',
};

export interface PipelineStatusIconProps extends HTMLAttributes<HTMLElement> {
  state: PipelineState;
  /** running 默认旋转；图例里传 still 保持静止 */
  still?: boolean;
}

/** 16px 状态图标：形状 + 颜色共同表达状态（不只靠颜色） */
export function PipelineStatusIcon({ state, still, className, ...rest }: PipelineStatusIconProps) {
  return <i aria-hidden="true" className={cx('wiz-isp-sicon', `wiz-isp-sicon--${state}`, state === 'running' && !still && 'is-spin', ICON[state], className)} {...rest} />;
}
