import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../cx';
import { Tooltip } from '../Tooltip/Tooltip';
import './CloseButton.css';

/** Figma Close button 377:864：Default / hover（hover 为强制显示） */
export interface CloseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  status?: 'default' | 'hover';
}

export function CloseButton({ status = 'default', className, type = 'button', 'aria-label': ariaLabel = 'Close', ...rest }: CloseButtonProps) {
  return (
    <Tooltip content={ariaLabel} nowrap>
      <button {...rest} type={type} aria-label={ariaLabel} className={cx('wiz-close-button', status === 'hover' && 'is-hover', className)}>
        <i className="ri-close-line" aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
