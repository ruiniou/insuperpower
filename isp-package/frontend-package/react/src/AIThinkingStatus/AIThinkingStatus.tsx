import type { HTMLAttributes } from 'react';
import { cx } from '../cx';
import './AIThinkingStatus.css';

/** Figma 变体属性 Status */
export type AIThinkingStatusType = 'loading' | 'waiting';

export interface AIThinkingStatusProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  status?: AIThinkingStatusType;
  /** 覆盖默认文案（Thinking… / Waiting for your input…） */
  label?: string;
}

const LABEL = { loading: 'Thinking…', waiting: 'Waiting for your input…' } as const;

export function AIThinkingStatus({ status = 'loading', label, className, ...rest }: AIThinkingStatusProps) {
  return (
    <div {...rest} role="status" className={cx('wiz-thinking', `wiz-thinking--${status}`, className)}>
      <i className={cx('wiz-thinking__icon', status === 'loading' ? 'ri-loader-4-line' : 'ri-loader-line')} aria-hidden="true" />
      <span className="wiz-thinking__text">{label ?? LABEL[status]}</span>
    </div>
  );
}
