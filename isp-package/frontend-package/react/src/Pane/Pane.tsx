import { useEffect, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../cx';
import './Pane.css';

export interface PaneProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 展开 / 折叠；折叠后内容仍挂载（保留状态），宽度收为 0、透明、不可聚焦 */
  open: boolean;
  /** 展开宽度（px）。不传且 flex 为 true 时，面板吸收剩余空间 */
  width?: number;
  /** 自适应面板：折叠时 flex-grow 1 → 0 过渡，内容最小宽 minWidth */
  flex?: boolean;
  minWidth?: number;
  /** 正在拖拽 Splitter：关闭过渡，宽度实时跟手 */
  dragging?: boolean;
  /** 面板内侧的留白（卡片之间的 8px 间隙放这里，折叠时一起收掉） */
  gapStart?: boolean;
  gapEnd?: boolean;
  children: ReactNode;
}

/**
 * 可折叠面板外壳：折叠 / 展开时宽度与透明度一起过渡（--wiz-motion-duration-panel，180ms）；
 * 内层固定宽度，动画期间内容不重排。参考 ds-5.0 §1.5 S-4。
 */
export function Pane({ open, width, flex = false, minWidth, dragging = false, gapStart, gapEnd, className, style, children, ...rest }: PaneProps) {
  const root = useRef<HTMLDivElement>(null);
  // React 18 不识别 inert 属性，直接设到 DOM 上：折叠后内容不可聚焦、不可点
  useEffect(() => { const el = root.current; if (!el) return; if (open) el.removeAttribute('inert'); else el.setAttribute('inert', ''); }, [open]);
  const outer: CSSProperties = flex ? { flexGrow: open ? 1 : 0, flexBasis: 0 } : { width: open ? width : 0 };
  const inner: CSSProperties = flex ? { minWidth } : { width };
  return (
    <div ref={root} className={cx('wiz-pane', flex && 'is-flex', open && 'is-open', dragging && 'is-dragging', className)} style={{ ...outer, ...style }}
      aria-hidden={open ? undefined : true} {...rest}>
      <div className={cx('wiz-pane__in', gapStart && 'has-gap-start', gapEnd && 'has-gap-end')} style={inner}>{children}</div>
    </div>
  );
}
