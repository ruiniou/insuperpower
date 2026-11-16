import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';
import { cx } from '../cx';
import { PipelineStatusIcon, type PipelineState } from '../PipelineStatus/PipelineStatus';
import './PipelinePill.css';

export interface PipelinePillProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  state: PipelineState;
  /** 节点名称 */
  name: string;
  /** 右侧计数，如 24/24；空串不显示 */
  count?: string;
}

/** 流水线节点胶囊：40 高，状态图标 + 名称 + 计数。位置由调用方用 style（left/top/width）决定 */
export function PipelinePill({ state, name, count, className, type = 'button', ...rest }: PipelinePillProps) {
  return (
    <button type={type} className={cx('wiz-isp-pill', `wiz-isp-pill--${state}`, className)} {...rest}>
      <PipelineStatusIcon state={state} />
      <span className="wiz-isp-pill__name">{name}</span>
      {count ? <span className="wiz-isp-pill__count">{count}</span> : null}
    </button>
  );
}

/** 胶囊下方的黄色提示（如 Shell v2 available） */
export function PipelineNote({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('wiz-isp-pnote', className)} {...rest} />;
}
