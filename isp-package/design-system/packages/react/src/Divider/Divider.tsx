import type { HTMLAttributes } from 'react';
import { cx } from '../cx';
import './Divider.css';

/** Figma Divider 335:355：横线（可带文字，左 / 中 / 右）与竖线 */
export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  align?: 'left' | 'center' | 'right';
}

export function Divider({ orientation = 'horizontal', align = 'center', className, children, ...rest }: DividerProps) {
  const text = orientation === 'horizontal' && children != null && children !== '';
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      {...rest}
      className={cx('wiz-divider', `wiz-divider--${orientation}`, text && `wiz-divider--text wiz-divider--${align}`, className)}
    >
      {text && <span className="wiz-divider__text">{children}</span>}
    </div>
  );
}
