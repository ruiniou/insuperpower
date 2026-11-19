import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import './EmptyState.css';

/** 空状态（原型 .empty）：居中的标题 + 说明 + 可选操作，页内或表格下方使用 */
export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, action, className, ...rest }: EmptyStateProps) {
  return (
    <div role="status" {...rest} className={cx('wiz-empty', className)}>
      <b className="wiz-empty__title">{title}</b>
      {description != null && <span>{description}</span>}
      {action}
    </div>
  );
}
