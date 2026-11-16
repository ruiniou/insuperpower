import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import './Popover.css';

/** up = 箭头在上边缘朝上（气泡位于锚点下方）；down = 箭头在下边缘朝下（气泡位于锚点上方） */
export type PopoverArrow = 'up' | 'down' | 'none';
/** panel = 原型 .pop（头 / 体 / 脚，描边）；confirm = 原型 .cfmb 确认气泡（无头，深阴影，按钮靠右） */
export type PopoverVariant = 'panel' | 'confirm';

export interface PopoverProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: PopoverVariant;
  arrow?: PopoverArrow;
  /** 箭头中心距气泡左边缘（px，默认 24） */
  arrowOffset?: number;
  /** 宽度（panel 默认 300，confirm 默认 320） */
  width?: number | string;
  /** 头：标题 */
  title?: ReactNode;
  /** 头：右侧（如状态标签） */
  extra?: ReactNode;
  /** 脚：按钮区（panel 左对齐；confirm 靠右） */
  footer?: ReactNode;
  /** 去掉绝对定位，由页面流排布（展示或自行定位时用）；默认 position:absolute，位置由调用方 style 决定 */
  inline?: boolean;
  /** 体 */
  children?: ReactNode;
}

/** 带箭头的通用气泡容器：箭头上 / 下、宽度、头 / 体 / 脚插槽 */
export function Popover({ variant = 'panel', arrow = 'up', arrowOffset = 24, width, title, extra, footer, inline, className, style, children, ...rest }: PopoverProps) {
  const w = width ?? (variant === 'confirm' ? 320 : 300);
  const hasHead = variant === 'panel' && (title !== undefined || extra !== undefined);
  return (
    <div role="dialog" aria-label={typeof title === 'string' ? title : undefined} className={cx('wiz-popover', `wiz-popover--${variant}`, inline && 'is-inline', className)} style={{ width: w, ...style }} {...rest}>
      {arrow !== 'none' && <span className={cx('wiz-popover__tail', arrow === 'down' && 'is-down')} style={{ left: arrowOffset - 5 }} aria-hidden="true" />}
      {hasHead && <div className="wiz-popover__head"><span className="wiz-popover__title">{title}</span>{extra}</div>}
      {children !== undefined && <div className="wiz-popover__body">{children}</div>}
      {footer && <div className="wiz-popover__foot">{footer}</div>}
    </div>
  );
}
