import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import './OnStatusButton.css';

/** Figma Buttons / On Status 889:3634：用在深色或彩色状态条上的半透明按钮；Size 的 Default 档记为 medium */
export type OnStatusButtonSize = 'small' | 'medium' | 'large';
export type OnStatusButtonStatus = 'default' | 'hover' | 'disable';
export interface OnStatusButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  size?: OnStatusButtonSize;
  status?: OnStatusButtonStatus;
  leftIcon?: string;
  rightIcon?: string;
  children: ReactNode;
}

export function OnStatusButton({ size = 'medium', status = 'default', leftIcon, rightIcon, className, children, type = 'button', disabled, ...rest }: OnStatusButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || status === 'disable'}
      className={cx('wiz-on-status', `wiz-on-status--${size}`, status === 'hover' && 'is-hover', status === 'disable' && 'is-disabled', className)}
    >
      {leftIcon && <i className={leftIcon} aria-hidden="true" />}
      <span>{children}</span>
      {rightIcon && <i className={rightIcon} aria-hidden="true" />}
    </button>
  );
}
