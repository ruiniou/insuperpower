import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import { EventStatusBadge } from '../EventStatusBadge/EventStatusBadge';
import './LabelScope.css';

/** Figma 变体属性 Selection、Tag */
export type LabelScopeSelection = 'selected' | 'unselected';
export type LabelScopeTag = 'none' | 'blocked' | 'skipped';

export interface LabelScopeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  selection?: LabelScopeSelection;
  tag?: LabelScopeTag;
  /** 主文字 */
  title: ReactNode;
  /** 副文字 */
  description?: ReactNode;
  /** 行图标 ri 类名，默认 ri-table-line */
  icon?: string;
}

export function LabelScope({
  selection = 'selected', tag = 'none', title, description, icon = 'ri-table-line', className, ...rest
}: LabelScopeProps) {
  const selected = selection === 'selected';
  return (
    <div {...rest} className={cx('wiz-label-scope', `wiz-label-scope--${selection}`, className)}>
      <div className="wiz-label-scope__left">
        <span className="wiz-label-scope__slot">
          <span className={cx('wiz-label-scope__checkbox', selected && 'is-checked')} role="img" aria-label={selected ? 'Selected' : 'Unselected'}>
            {selected && <i className="ri-check-line" aria-hidden="true" />}
          </span>
        </span>
        <span className="wiz-label-scope__slot wiz-label-scope__icon" aria-hidden="true">
          <i className={icon} />
        </span>
        <div className="wiz-label-scope__text">
          <p className="wiz-label-scope__title">{title}</p>
          {description != null && <p className="wiz-label-scope__desc">{description}</p>}
        </div>
      </div>
      {tag !== 'none' && <EventStatusBadge status={tag} />}
    </div>
  );
}
