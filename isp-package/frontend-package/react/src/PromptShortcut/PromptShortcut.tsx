import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../cx';
import './PromptShortcut.css';

/** Figma 变体属性 Status；hover 为强制显示悬停样式（真实悬停也会生效） */
export type PromptShortcutStatus = 'default' | 'hover' | 'disable';

export interface PromptShortcutProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  status?: PromptShortcutStatus;
  /** 标题文字 */
  children: string;
  /** 传入即为 Figma 的 With Description=True（两行、宽度撑满） */
  description?: string;
  /** Figma：Show Icon（默认 true） */
  showIcon?: boolean;
  /** Figma：Icon，ri 类名（默认 ri-sparkling-2-line） */
  icon?: string;
}

export function PromptShortcut({
  status = 'default', children, description, showIcon = true, icon = 'ri-sparkling-2-line', className, type = 'button', disabled, ...rest
}: PromptShortcutProps) {
  const isDisabled = disabled || status === 'disable';
  return (
    <button
      {...rest}
      type={type}
      disabled={isDisabled}
      className={cx('wiz-shortcut', description != null && 'wiz-shortcut--desc', status === 'hover' && 'is-hover', isDisabled && 'is-disabled', className)}
    >
      {showIcon && <span className="wiz-shortcut__icon"><i className={icon} aria-hidden="true" /></span>}
      <span className="wiz-shortcut__text">
        <span className="wiz-shortcut__title">{children}</span>
        {description != null && <span className="wiz-shortcut__desc">{description}</span>}
      </span>
    </button>
  );
}
