import type { HTMLAttributes } from 'react';
import { cx } from '../cx';
import './Message.css';

/** Figma Message 377:970（Warning 样式）；其余类型沿用同一结构换语义色 */
export type MessageTone = 'warning' | 'error' | 'success' | 'info';
export interface MessageProps extends HTMLAttributes<HTMLDivElement> {
  tone?: MessageTone;
  closable?: boolean;
  onClose?: () => void;
}

const ICON: Record<MessageTone, string> = {
  warning: 'ri-error-warning-fill', error: 'ri-close-circle-fill', success: 'ri-checkbox-circle-fill', info: 'ri-information-fill',
};

export function Message({ tone = 'warning', closable = false, onClose, className, children, ...rest }: MessageProps) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} {...rest} className={cx('wiz-message', `wiz-message--${tone}`, className)}>
      <i className={cx(ICON[tone], 'wiz-message__icon')} aria-hidden="true" />
      <div className="wiz-message__content">{children}</div>
      {closable && (
        <button type="button" className="wiz-message__close" aria-label="Close" onClick={onClose}>
          <i className="ri-close-line" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
