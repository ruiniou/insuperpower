import type { HTMLAttributes } from 'react';
import { cx } from '../cx';
import { FEEDBACK_ICON, type FeedbackTone } from './feedbackTone';
import './Message.css';

/** Figma Message 377:970（Warning 样式）；其余类型沿用同一结构换语义色 */
export type MessageTone = FeedbackTone;
export interface MessageProps extends HTMLAttributes<HTMLDivElement> {
  tone?: MessageTone;
  closable?: boolean;
  onClose?: () => void;
}

export function Message({ tone = 'warning', closable = false, onClose, className, children, ...rest }: MessageProps) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} {...rest} className={cx('wiz-message', `wiz-message--${tone}`, `wiz-feedback--${tone}`, className)}>
      <i className={cx(FEEDBACK_ICON[tone], 'wiz-message__icon')} aria-hidden="true" />
      <div className="wiz-message__content">{children}</div>
      {closable && (
        <button type="button" className="wiz-message__close" aria-label="Close" onClick={onClose}>
          <i className="ri-close-line" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
