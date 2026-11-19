import type { HTMLAttributes } from 'react';
import { cx } from '../cx';
import './AttachedItemsChips.css';

/** Figma 变体属性 Status；hover 为强制显示悬停样式 */
export type AttachedItemsChipsStatus = 'default' | 'hover';

export interface AttachedItemsChipsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  status?: AttachedItemsChipsStatus;
  /** Figma：Item Name */
  itemName?: string;
  /** Figma：Show Icon（默认 true） */
  showIcon?: boolean;
  /** Figma：Icon，ri 类名（默认 ri-file-image-fill） */
  icon?: string;
  /** 点击右侧关闭 */
  onRemove?: () => void;
}

export function AttachedItemsChips({
  status = 'default', itemName = 'Filename201111.jpg', showIcon = true, icon = 'ri-file-image-fill', onRemove, className, ...rest
}: AttachedItemsChipsProps) {
  return (
    <div {...rest} className={cx('wiz-chip', status === 'hover' && 'is-hover', className)}>
      <span className="wiz-chip__content">
        {showIcon && <i className={cx(icon, 'wiz-chip__icon')} aria-hidden="true" />}
        <span className="wiz-chip__name">{itemName}</span>
      </span>
      <button type="button" className="wiz-chip__close" aria-label={`Remove ${itemName}`} onClick={onRemove}>
        <i className="ri-close-circle-fill" aria-hidden="true" />
      </button>
    </div>
  );
}
