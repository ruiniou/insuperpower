import type { HTMLAttributes } from 'react';
import { cx } from '../cx';
import { PipelineStatusIcon, type PipelineState } from '../PipelineStatus/PipelineStatus';
import './PipelineLegend.css';

export const DEFAULT_LEGEND: Array<{ state: PipelineState; label: string }> = [
  { state: 'locked', label: 'Locked' },
  { state: 'ready', label: 'Ready' },
  { state: 'running', label: 'Running' },
  { state: 'review', label: 'Review' },
  { state: 'stale', label: 'Update available' },
  { state: 'todo', label: 'Not ready' },
];

export interface PipelineLegendProps extends HTMLAttributes<HTMLDivElement> {
  items?: Array<{ state: PipelineState; label: string }>;
}

/** 状态图例：图标 + 文字，横向排列（running 图标静止） */
export function PipelineLegend({ items = DEFAULT_LEGEND, className, ...rest }: PipelineLegendProps) {
  return (
    <div className={cx('wiz-isp-legend', className)} role="list" aria-label="Status legend" {...rest}>
      {items.map((it) => (
        <span role="listitem" key={it.state}><PipelineStatusIcon state={it.state} still />{it.label}</span>
      ))}
    </div>
  );
}
