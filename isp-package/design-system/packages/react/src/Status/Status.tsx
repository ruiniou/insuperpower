import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import './Status.css';

/** 主库 Status 337:838（旧包 Badge）：Style1 浅底描边、Style2 实心、Style3 带勾图标、Only dot 小圆点 */
export type StatusVariant = 'style1' | 'style2' | 'style3' | 'dot';
export type StatusTone = 'purple' | 'blue' | 'green' | 'red' | 'yellow' | 'grey';

/** 主库变体默认配色：Style1 紫、Style2 绿、Style3 蓝、Only dot 蓝 */
const DEFAULT_TONE: Record<StatusVariant, StatusTone> = { style1: 'purple', style2: 'green', style3: 'blue', dot: 'blue' };

export interface StatusProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant;
  /** 覆盖默认配色（同一结构换语义色阶）；不传则按主库 */
  tone?: StatusTone;
  /** 仅 style3：左侧图标 ri 类名，默认 ri-check-fill */
  icon?: string;
  /** 文字大小写：upper（默认，主库）\| normal（句式，用于 Latest / Official / 3 behind 等） */
  textCase?: 'upper' | 'normal';
  /** dot 变体可带文字 */
  children?: ReactNode;
}

export function Status({ variant = 'style1', tone, icon = 'ri-check-fill', textCase = 'upper', className, children, ...rest }: StatusProps) {
  const t = tone ?? DEFAULT_TONE[variant];
  if (variant === 'dot') {
    return (
      <span className={cx('wiz-status', 'wiz-status--dot', `wiz-status--${t}`, children != null && 'has-text', className)} {...rest}>
        <span className="wiz-status__dot" aria-hidden="true" />
        {children != null && <span className="wiz-status__dot-text">{children}</span>}
      </span>
    );
  }
  return (
    <span className={cx('wiz-status', `wiz-status--${variant}`, `wiz-status--${t}`, textCase === 'normal' && 'is-normal-case', className)} {...rest}>
      {variant === 'style3' && <i className={cx('wiz-status__icon', icon)} aria-hidden="true" />}
      <span className="wiz-status__text">{children}</span>
    </span>
  );
}
