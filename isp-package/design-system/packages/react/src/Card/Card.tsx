import type { CSSProperties, HTMLAttributes } from 'react';
import { cx } from '../cx';
import './Card.css';

export type CardElevation = 'ring' | 'card' | 'flat';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** ring = 1px 灰描边（默认）；card = Button 阴影；flat = 无 */
  elevation?: CardElevation;
  /** 内边距（px，默认 20） */
  padding?: number;
  /** 圆角（px，默认 16） */
  radius?: number;
  /** 可点击卡片：指针 + 悬停描边变品牌蓝，可聚焦 */
  interactive?: boolean;
}

export function Card({ elevation = 'ring', padding, radius, interactive, className, style, children, ...rest }: CardProps) {
  const vars = { ...(padding !== undefined && { '--wiz-card-padding': `${padding}px` }), ...(radius !== undefined && { '--wiz-card-radius': `${radius}px` }) } as CSSProperties;
  return <div className={cx('wiz-card', `wiz-card--${elevation}`, interactive && 'is-interactive', className)} tabIndex={interactive ? 0 : undefined} style={{ ...vars, ...style }} {...rest}>{children}</div>;
}
