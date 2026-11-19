import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import './Chip.css';

/** Figma Chip 1121:329：Size × Properties（Normal / Disable） */
export type ChipSize = 'default' | 'small';
export interface ChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  size?: ChipSize;
  disabled?: boolean;
  /** 传入则显示关闭图标 */
  onRemove?: () => void;
  removeLabel?: string;
  children: ReactNode;
}

export function Chip({ size = 'default', disabled, onRemove, removeLabel = 'Remove', className, children, ...rest }: ChipProps) {
  return (
    <span {...rest} className={cx('wiz-chip', `wiz-chip--${size}`, disabled && 'is-disabled', className)}>
      <span className="wiz-chip__label">{children}</span>
      {onRemove && (
        <button type="button" className="wiz-chip__close" aria-label={removeLabel} disabled={disabled}
          onClick={(e) => { e.stopPropagation(); onRemove(); }} onMouseDown={(e) => e.stopPropagation()}>
          <i className="ri-close-line" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}
