import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import './LabelStatus.css';

/** Figma 变体属性 Status */
export type LabelStatusValue =
  | 'normal' | 'running' | 'queued' | 'blocked' | 'failed' | 'skipped' | 'interrupted' | 'done';

export interface LabelStatusProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  status?: LabelStatusValue;
  /** 行文字 */
  children: ReactNode;
  /** 副文字（Caption），用于 Update Summary 行 */
  description?: ReactNode;
  /** 右侧操作区，如 Retry */
  trailing?: ReactNode;
}

const ICON: Partial<Record<LabelStatusValue, string>> = {
  normal: 'ri-table-line',
  running: 'ri-loader-4-line',
  queued: 'ri-pause-circle-line',
  blocked: 'ri-alert-line',
  failed: 'ri-close-circle-line',
  interrupted: 'ri-record-circle-line',
  done: 'ri-check-line',
};

export function LabelStatus({ status = 'normal', children, description, trailing, className, ...rest }: LabelStatusProps) {
  return (
    <div {...rest} className={cx('wiz-label-status', `wiz-label-status--${status}`, className)}>
      <span className="wiz-label-status__icon" aria-hidden="true">
        {status === 'skipped' ? (
          <span className="wiz-label-status__dash" />
        ) : (
          <i className={ICON[status]} />
        )}
      </span>
      <span className="wiz-label-status__text">
        {children}
        {description != null && <span className="wiz-label-status__desc">{description}</span>}
      </span>
      {trailing != null && <span className="wiz-label-status__trailing">{trailing}</span>}
    </div>
  );
}
