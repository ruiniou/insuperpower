import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../cx';
import type { PipelineState } from '../PipelineStatus/PipelineStatus';
import './EdgeButton.css';

export interface EdgeButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** 下游节点的展示状态；locked 缩成 8px 小点，其余 22px 圆 */
  state: PipelineState;
  /** 弹层打开时的选中环 */
  selected?: boolean;
  'aria-label': string;
}

const ICON: Partial<Record<PipelineState, string>> = {
  ready: 'ri-play-fill', stale: 'ri-restart-line', running: 'ri-loader-4-line', review: 'ri-time-line',
};

/** 连线中点按钮。位置由调用方用 style（left/top）决定 */
export function EdgeButton({ state, selected, className, type = 'button', ...rest }: EdgeButtonProps) {
  const icon = ICON[state];
  return (
    <button type={type} aria-expanded={selected ? true : undefined} className={cx('wiz-isp-eb', `wiz-isp-eb--${state}`, selected && 'is-selected', className)} {...rest}>
      {icon && <i aria-hidden="true" className={cx(icon, state === 'running' && 'wiz-isp-eb__spin')} />}
    </button>
  );
}
