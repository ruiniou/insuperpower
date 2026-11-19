import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import './KeyValueRow.css';

export interface KeyValueRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label: ReactNode;
  /** 值右侧的操作（图标按钮、链接） */
  action?: ReactNode;
  /** 键列宽（px），默认 90 */
  labelWidth?: number;
  /** 最小行高（px），默认 44 */
  minHeight?: number;
  /** 值可换行（默认单行省略）；换行时行高随内容增长，键与首行文字顶部对齐 */
  wrap?: boolean;
  /** 底部分隔线，默认有 */
  divider?: boolean;
  children?: ReactNode;
}

/** 通用键值行：键列固定宽，值占满剩余，可带操作；供抽屉、信息卡、依据面板、节点页共用 */
export function KeyValueRow({ label, action, labelWidth = 90, minHeight = 44, wrap, divider = true, className, style, children, ...rest }: KeyValueRowProps) {
  const vars = { '--wiz-kv-label-width': labelWidth + 'px', '--wiz-kv-min-height': minHeight + 'px', ...style } as CSSProperties;
  return (
    <div {...rest} style={vars} className={cx('wiz-kv', wrap && 'is-wrap', !divider && 'no-divider', className)}>
      <span className="wiz-kv__k">{label}</span>
      <span className="wiz-kv__v">{children}</span>
      {action != null && <span className="wiz-kv__a">{action}</span>}
    </div>
  );
}
