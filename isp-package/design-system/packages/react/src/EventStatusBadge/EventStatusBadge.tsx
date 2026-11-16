import type { HTMLAttributes } from 'react';
import { cx } from '../cx';
import './EventStatusBadge.css';

/** Figma 变体属性 Status */
export type EventStatusBadgeStatus = 'blocked' | 'skipped';

export interface EventStatusBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  status?: EventStatusBadgeStatus;
}

export function EventStatusBadge({ status = 'blocked', className, ...rest }: EventStatusBadgeProps) {
  return (
    <span {...rest} className={cx('wiz-event-status-badge', `wiz-event-status-badge--${status}`, className)}>
      {status === 'blocked' && <i className="ri-alert-line" aria-hidden="true" />}
      {status === 'blocked' ? 'Blocked' : 'Skipped'}
    </span>
  );
}
