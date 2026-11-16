import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import './TitleBar.css';

export interface TitleBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  /** 有描述时高 64，否则 52（主库 With Description） */
  description?: ReactNode;
  /** 右侧操作区（主库 Button Group） */
  actions?: ReactNode;
  /** 底部分隔线（旧包） */
  divider?: boolean;
}

/** 主库 Title 331:386（旧包 TitleBar）：白底，左右 16，上下 8，标题 H4 */
export function TitleBar({ title = 'Title', description, actions, divider = false, className, ...rest }: TitleBarProps) {
  return (
    <div className={cx('wiz-titlebar', description != null && 'has-desc', divider && 'has-divider', className)} {...rest}>
      <div className="wiz-titlebar__main">
        <div className="wiz-titlebar__title">{title}</div>
        {description != null && <div className="wiz-titlebar__desc">{description}</div>}
      </div>
      {actions && <div className="wiz-titlebar__actions">{actions}</div>}
    </div>
  );
}
