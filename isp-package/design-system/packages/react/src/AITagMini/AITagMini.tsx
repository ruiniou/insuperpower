import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import './AITagMini.css';

export interface AITagMiniProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** 标签文字，如引用位置 Table.1(290-321) */
  children: ReactNode;
}

export function AITagMini({ children, className, ...rest }: AITagMiniProps) {
  return (
    <span {...rest} className={cx('wiz-ai-tag-mini', className)}>
      <i className="ri-code-line" aria-hidden="true" />
      <span className="wiz-ai-tag-mini__text">{children}</span>
    </span>
  );
}
