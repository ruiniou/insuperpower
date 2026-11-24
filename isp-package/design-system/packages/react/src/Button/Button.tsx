import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import './Button.css';

/** Figma 主库：Primary 784:1013、Secondary 784:1029、Danger 2367:1571、Link Button 337:1734 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'link';
/** Figma 变体属性 Size（Danger 的 Default / Medium 见 dangerStyle） */
export type ButtonSize = 'small' | 'medium' | 'large';
/** Figma 变体属性 Status；hover 为强制显示悬停样式（真实悬停也会生效）；loading 仅 Primary 有 */
export type ButtonStatus = 'default' | 'hover' | 'disable' | 'loading';
/** Danger 专用：Figma Size=Default（白底红字）/ Size=Medium（红底白字） */
export type ButtonDangerStyle = 'outline' | 'solid';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  status?: ButtonStatus;
  dangerStyle?: ButtonDangerStyle;
  /** 左图标 ri 类名 */
  leftIcon?: string;
  /** 右图标 ri 类名 */
  rightIcon?: string;
  /** 撑满父容器宽度（卡片内整行按钮） */
  block?: boolean;
  /** 阴影：Primary 和 Danger 可用 none 关闭默认阴影；Secondary 和 Link 无阴影 */
  shadow?: 'default' | 'none';
  children: ReactNode;
}

export function Button({
  variant = 'secondary', size = 'medium', status = 'default', dangerStyle = 'outline',
  leftIcon, rightIcon, block, shadow = 'default', className, children, type = 'button', disabled, ...rest
}: ButtonProps) {
  const loading = status === 'loading';
  const isDisabled = disabled || status === 'disable' || loading;
  const left = loading ? 'ri-loader-4-line' : leftIcon;
  return (
    <button
      {...rest}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cx(
        'wiz-button', `wiz-button--${variant}`,
        variant !== 'link' && `wiz-button--${size}`,
        variant === 'danger' && `wiz-button--danger-${dangerStyle}`,
        block && 'is-block', shadow === 'none' && 'is-flat',
        status === 'hover' && 'is-hover', status === 'disable' && 'is-disabled', loading && 'is-loading',
        className,
      )}
    >
      {left && <i className={cx(left, loading && 'wiz-button__spin')} aria-hidden="true" />}
      <span className="wiz-button__label">{children}</span>
      {rightIcon && <i className={rightIcon} aria-hidden="true" />}
    </button>
  );
}
