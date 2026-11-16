import { useEffect, useRef, useState, type HTMLAttributes, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react';
import { cx } from '../cx';
import './Splitter.css';

/** 键盘步长（px） */
export const SPLITTER_KEY_STEP = 16;

export interface SplitterProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onResize'> {
  /** x（默认）：左右并排的面板，竖线、col-resize；y：上下堆叠，横线、row-resize */
  axis?: 'x' | 'y';
  /** 取反增量：拖动右侧（或下方）面板的前沿时使用 */
  reverse?: boolean;
  /** 占用的布局空间（默认 1，即主库 1px；用于卡片之间的间隙时可加大，线仍居中 1px） */
  size?: number;
  /** 自上次回调起的指针增量（px）；方向键每次发 ±16 */
  onResize?: (delta: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  /** 当前面板尺寸，仅用于 aria-valuenow；面板尺寸与上下限由父级维护 */
  value?: number;
  min?: number;
  max?: number;
  /** 强制显示悬停样式（展示用；真实悬停 200ms 后同效） */
  state?: 'default' | 'hover';
}

/** 主库 Draggable Divider 337:1977（旧包 Splitter）：默认 1px grey-40；悬停 / 拖动为 2px 品牌蓝。点击热区 10px */
export function Splitter({
  axis = 'x', reverse = false, size = 1, onResize, onResizeStart, onResizeEnd, value, min, max, state,
  className, style, 'aria-label': ariaLabel = 'Resize panel', ...rest
}: SplitterProps) {
  const [shown, setShown] = useState(false);
  const [dragging, setDragging] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const last = useRef(0);
  const stop = useRef<(() => void) | null>(null);
  const horizontal = axis === 'x';

  useEffect(() => () => { clearTimeout(timer.current); stop.current?.(); }, []);

  const emit = (delta: number) => { if (delta) onResize?.(reverse ? -delta : delta); };

  const down = (e: ReactMouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    last.current = horizontal ? e.clientX : e.clientY;
    const prev = { cursor: document.body.style.cursor, userSelect: document.body.style.userSelect };
    document.body.style.cursor = horizontal ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
    setDragging(true);
    onResizeStart?.();
    const move = (ev: MouseEvent) => {
      const point = horizontal ? ev.clientX : ev.clientY;
      const delta = point - last.current;
      last.current = point;
      emit(delta);
    };
    const end = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', end);
      document.body.style.cursor = prev.cursor;
      document.body.style.userSelect = prev.userSelect;
      stop.current = null;
      setDragging(false);
      onResizeEnd?.();
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', end);
    stop.current = end;
  };

  const key = (e: KeyboardEvent) => {
    const back = horizontal ? 'ArrowLeft' : 'ArrowUp';
    const forward = horizontal ? 'ArrowRight' : 'ArrowDown';
    if (e.key !== back && e.key !== forward) return;
    e.preventDefault();
    emit(e.key === forward ? SPLITTER_KEY_STEP : -SPLITTER_KEY_STEP);
  };

  const visible = state === 'hover' || shown || dragging;
  return (
    <div role="separator" tabIndex={0} aria-label={ariaLabel} aria-orientation={horizontal ? 'vertical' : 'horizontal'}
      aria-valuenow={value} aria-valuemin={min} aria-valuemax={max}
      className={cx('wiz-splitter', `wiz-splitter--${axis}`, visible && 'is-active', dragging && 'is-dragging', className)}
      style={{ [horizontal ? 'width' : 'height']: size, ...style }}
      onMouseDown={down} onKeyDown={key}
      onMouseEnter={() => { clearTimeout(timer.current); timer.current = setTimeout(() => setShown(true), 200); }}
      onMouseLeave={() => { clearTimeout(timer.current); setShown(false); }}
      {...rest}>
      <span className="wiz-splitter__hit" aria-hidden="true" />
      <span className="wiz-splitter__bar" aria-hidden="true" />
    </div>
  );
}
