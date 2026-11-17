import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../cx';
import { useUid } from '../useControllable';
import './Tooltip.css';

/** Figma Tooltip 1167:1280：Direction = 气泡相对触发元素的位置 */
export type TooltipDirection = 'top' | 'bottom' | 'left' | 'right';
export interface TooltipProps {
  content: ReactNode;
  /** 气泡相对触发元素的位置，默认 bottom（下方 2px，水平居中）；top / bottom 放不下时自动翻转，左右越界时整体平移 */
  direction?: TooltipDirection;
  /** 悬停延迟 ms，默认 150（参考 Atlas） */
  delay?: number;
  /** 单行不换行（图标按钮）；默认最宽 232px 内换行 */
  nowrap?: boolean;
  /** 显示指向触发元素的小箭头（默认不显示，间距 2px） */
  arrow?: boolean;
  /** 强制显示，供展示用；不传则悬停 / 聚焦显示，Esc 关闭 */
  open?: boolean;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

const GAP = 2;

export function Tooltip({ content, direction = 'bottom', delay = 150, nowrap, arrow = false, open: forceOpen, disabled, className, children }: TooltipProps) {
  const [shown, setShown] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; off: boolean; dir: TooltipDirection } | null>(null);
  const trigger = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const id = useUid('wiz-tooltip');
  const visible = !disabled && (forceOpen ?? shown);

  /** 触发器所在的菜单 / 下拉已展开时（aria-expanded=true），入口处于 Hovered 态，不再出现 Tooltip */
  const expanded = () => !!trigger.current?.closest('[aria-expanded="true"]');
  const show = () => { clearTimeout(timer.current); timer.current = setTimeout(() => { if (!expanded()) setShown(true); }, delay); };
  const hide = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setShown(false), 100); };
  const hideNow = () => { clearTimeout(timer.current); setShown(false); };
  useEffect(() => () => clearTimeout(timer.current), []);

  const place = useCallback(() => {
    const t = trigger.current?.getBoundingClientRect(); const b = bubble.current?.getBoundingClientRect();
    if (!t || !b) return;
    const cx0 = t.left + t.width / 2; const cy0 = t.top + t.height / 2;
    const gap = GAP + (arrow ? 4 : 0);
    const vw = window.innerWidth; const vh = window.innerHeight;
    let dir = direction;
    // 上下：按气泡是否放得下翻转
    if (dir === 'bottom' && t.bottom + gap + b.height > vh && t.top - gap - b.height >= 0) dir = 'top';
    else if (dir === 'top' && t.top - gap - b.height < 0 && t.bottom + gap + b.height <= vh) dir = 'bottom';
    if (dir === 'right' && t.right + gap + b.width > vw && t.left - gap - b.width >= 0) dir = 'left';
    else if (dir === 'left' && t.left - gap - b.width < 0 && t.right + gap + b.width <= vw) dir = 'right';
    const p = {
      top: { top: t.top - b.height - gap, left: cx0 - b.width / 2 },
      bottom: { top: t.bottom + gap, left: cx0 - b.width / 2 },
      left: { top: cy0 - b.height / 2, left: t.left - b.width - gap },
      right: { top: cy0 - b.height / 2, left: t.right + gap },
    }[dir];
    // 左右 / 上下整体平移，不超出视口（留 4px）
    const left = Math.max(4, Math.min(p.left, vw - b.width - 4));
    const top = Math.max(4, Math.min(p.top, vh - b.height - 4));
    setPos({ top: Math.round(top), left: Math.round(left), dir, off: t.bottom < 0 || t.top > vh });
  }, [direction, arrow]);

  useLayoutEffect(() => { if (visible) place(); else setPos(null); }, [visible, place, content]);
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') hideNow(); };
    window.addEventListener('scroll', place, true); window.addEventListener('resize', place); document.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place); document.removeEventListener('keydown', onKey); };
  }, [visible, place]);

  return (
    <>
      <span
        ref={trigger}
        className={cx('wiz-tooltip-trigger', className)}
        aria-describedby={visible ? id : undefined}
        onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} onMouseDown={hideNow}
      >
        {children}
      </span>
      {visible && createPortal(
        <div
          ref={bubble}
          id={id}
          role="tooltip"
          className={cx('wiz-tooltip', `wiz-tooltip--${pos?.dir ?? direction}`, nowrap && 'is-nowrap', arrow && 'has-arrow')}
          style={pos ? { top: pos.top, left: pos.left, visibility: pos.off ? 'hidden' : undefined } : { position: 'fixed', top: 0, left: 0, visibility: 'hidden' }}
        >
          <div className="wiz-tooltip__bubble">{content}</div>
          {arrow && <span className="wiz-tooltip__arrow" />}
        </div>,
        document.body,
      )}
    </>
  );
}
