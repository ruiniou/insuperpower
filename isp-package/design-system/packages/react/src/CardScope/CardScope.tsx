import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import { LabelScope, type LabelScopeTag } from '../LabelScope/LabelScope';
import { LabelStatus, type LabelStatusValue } from '../LabelStatus/LabelStatus';
import { Button } from '../Button/Button';
import './CardScope.css';

/** Figma 变体属性 Type=Scope 的 State */
export type CardScopeState = 'pending' | 'confirmed' | 'cancelled';
/** Figma 变体属性 Type=Progress 的 State */
export type CardProgressState = 'running' | 'completed';

export interface CardScopeItem {
  title: ReactNode;
  description?: ReactNode;
  selected?: boolean;
  tag?: LabelScopeTag;
}
export interface CardStatusItem {
  status?: LabelStatusValue;
  title: ReactNode;
  description?: ReactNode;
  /** 右侧操作文字，如 Retry（红色） */
  actionLabel?: string;
  onAction?: () => void;
}

type Base = Omit<HTMLAttributes<HTMLDivElement>, 'title'>;

export interface CardScopeScopeProps extends Base {
  type?: 'scope';
  state?: CardScopeState;
  /** 默认 Affected TFLs */
  title?: ReactNode;
  /** 数量角标，默认取 items.length */
  count?: number;
  items: CardScopeItem[];
  onCancel?: () => void;
  onConfirm?: () => void;
}
export interface CardScopeProgressProps extends Base {
  type: 'progress';
  state?: CardProgressState;
  /** running 默认 Applying Updates；completed 默认 All Updates Applied */
  title?: ReactNode;
  /** 右侧进度文字，默认按 items 的 done 数生成「n of m completed」 */
  progressText?: ReactNode;
  items: CardStatusItem[];
}
export interface CardScopeSummaryProps extends Base {
  type: 'summary';
  /** 默认 Update Summary */
  title?: ReactNode;
  items: CardStatusItem[];
}
export type CardScopeProps = CardScopeScopeProps | CardScopeProgressProps | CardScopeSummaryProps;

const Chevron = () => <i className="ri-arrow-down-s-line wiz-card-scope__chevron" aria-hidden="true" />;

function StatusRows({ items }: { items: CardStatusItem[] }) {
  return (
    <>
      {items.map((it, i) => (
        <LabelStatus
          key={i}
          status={it.status}
          description={it.description}
          trailing={it.actionLabel && <button type="button" className="wiz-card-scope__action" onClick={it.onAction}>{it.actionLabel}</button>}
        >{it.title}</LabelStatus>
      ))}
    </>
  );
}

export function CardScope(props: CardScopeProps) {
  if (props.type === 'progress') {
    const { type: _t, state = 'running', title, progressText, items, className, ...rest } = props;
    const done = items.filter((i) => i.status === 'done').length;
    const completed = state === 'completed';
    return (
      <div {...rest} className={cx('wiz-card-scope', 'wiz-card-scope--progress', `wiz-card-scope--${state}`, 'wiz-card-scope--no-footer', className)}>
        <div className="wiz-card-scope__header">
          <span className="wiz-card-scope__title-group">
            <Chevron />
            {completed && <i className="ri-check-line wiz-card-scope__done-icon" aria-hidden="true" />}
            <span className="wiz-card-scope__title">{title ?? (completed ? 'All Updates Applied' : 'Applying Updates')}</span>
          </span>
          <span className="wiz-card-scope__caption">{progressText ?? `${completed ? items.length : done} of ${items.length} completed`}</span>
        </div>
        <div className="wiz-card-scope__rows"><StatusRows items={items} /></div>
      </div>
    );
  }
  if (props.type === 'summary') {
    const { type: _t, title = 'Update Summary', items, className, ...rest } = props;
    return (
      <div {...rest} className={cx('wiz-card-scope', 'wiz-card-scope--summary', 'wiz-card-scope--no-footer', className)}>
        <div className="wiz-card-scope__header wiz-card-scope__header--divided">
          <span className="wiz-card-scope__title">{title}</span>
        </div>
        <div className="wiz-card-scope__rows"><StatusRows items={items} /></div>
      </div>
    );
  }
  const { type: _t, state = 'pending', title = 'Affected TFLs', count, items, onCancel, onConfirm, className, ...rest } = props;
  const hasFooter = state !== 'confirmed';
  return (
    <div {...rest} className={cx('wiz-card-scope', 'wiz-card-scope--scope', `wiz-card-scope--${state}`, !hasFooter && 'wiz-card-scope--no-footer', className)}>
      <div className="wiz-card-scope__header">
        <span className="wiz-card-scope__title-group">
          <Chevron />
          <span className="wiz-card-scope__title">{title}</span>
          <span className="wiz-card-scope__count">{count ?? items.length}</span>
        </span>
        {state === 'confirmed' && (
          <span className="wiz-card-scope__status wiz-card-scope__status--applied"><i className="ri-check-line" aria-hidden="true" />Applied</span>
        )}
        {state === 'cancelled' && (
          <span className="wiz-card-scope__status wiz-card-scope__status--cancelled"><span className="wiz-card-scope__dot" aria-hidden="true" />Cancelled</span>
        )}
      </div>
      <div className="wiz-card-scope__rows">
        {items.map((it, i) => (
          <LabelScope key={i} selection={it.selected === false ? 'unselected' : 'selected'} tag={it.tag} title={it.title} description={it.description} />
        ))}
      </div>
      {state === 'pending' && (
        <div className="wiz-card-scope__footer">
          <Button variant="secondary" size="small" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" size="small" onClick={onConfirm}>Confirm</Button>
        </div>
      )}
      {state === 'cancelled' && (
        <div className="wiz-card-scope__footer wiz-card-scope__footer--text">Selection cancelled</div>
      )}
    </div>
  );
}
