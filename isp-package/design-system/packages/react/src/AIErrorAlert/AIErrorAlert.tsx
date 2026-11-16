import { useState, type HTMLAttributes } from 'react';
import { cx } from '../cx';
import './AIErrorAlert.css';

/** Figma 变体属性 Details */
export type AIErrorAlertState = 'collapsed' | 'expanded';

export interface AIErrorAlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'onToggle'> {
  /** 受控展开状态；不传则内部自管，初始 collapsed */
  state?: AIErrorAlertState;
  /** 错误摘要，显示为 “Error: {title}” */
  title?: string;
  /** 详情；不传则不显示 Show Details */
  details?: string;
  /** 重试按钮文字，默认 Retry；不传 onRetry 则不显示按钮 */
  retryText?: string;
  onRetry?: () => void;
  onToggle?: (next: AIErrorAlertState) => void;
}

export function AIErrorAlert({
  state, title = 'Error Reason Summary', details, retryText = 'Retry', onRetry, onToggle, className, ...rest
}: AIErrorAlertProps) {
  const [inner, setInner] = useState<AIErrorAlertState>('collapsed');
  const cur = state ?? inner;
  const expanded = cur === 'expanded';
  const toggle = () => {
    const next: AIErrorAlertState = expanded ? 'collapsed' : 'expanded';
    if (state === undefined) setInner(next);
    onToggle?.(next);
  };
  return (
    <div {...rest} role="alert" className={cx('wiz-error-alert', `wiz-error-alert--${cur}`, className)}>
      <div className="wiz-error-alert__content">
        <div className="wiz-error-alert__title">
          <i className="ri-error-warning-line wiz-error-alert__icon" aria-hidden="true" />
          <span>Error: {title}</span>
        </div>
        {details && (
          <>
            <button type="button" className="wiz-error-alert__toggle" aria-expanded={expanded} onClick={toggle}>
              <span>{expanded ? 'Hide Details' : 'Show Details'}</span>
              <i className={expanded ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'} aria-hidden="true" />
            </button>
            {expanded && <p className="wiz-error-alert__details">{details}</p>}
          </>
        )}
      </div>
      {onRetry && (
        <button type="button" className="wiz-error-alert__retry" onClick={onRetry}>
          <i className="ri-restart-line" aria-hidden="true" />
          <span>{retryText}</span>
        </button>
      )}
    </div>
  );
}
