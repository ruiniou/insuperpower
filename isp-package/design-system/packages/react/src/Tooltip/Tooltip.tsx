import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../cx';
import { useUid } from '../useControllable';
import './Tooltip.css';

/** Figma Tooltip 1167:1280：Direction = 气泡相对触发元素的位置 */
export type TooltipDirection = 'top' | 'bottom' | 'left' | 'right';
export interface TooltipProps {
  content: ReactNode;
  direction?: TooltipDirection;
  /** 悬停延迟 ms，默认 200 */
  delay?: number;
  /** 强制显示，供展示用；不传则悬停 / 聚焦显示，Esc 关闭 */
  open?: boolean;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

const GAP = 2;

export function Tooltip({ content, direction = 'top', delay = 200, open: forceOpen, disabled, className, children }: TooltipProps) {
  const [shown, setShown] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; off: boolean } | null>(null);
  const trigger = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const id = useUid('wiz-tooltip');
  const visible = !disabled && (forceOpen ?? shown);

  const show = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setShown(true), delay); };
  const hide = () => { clearTimeout(timer.current); setShown(false); };
  useEffect(() => () => clearTimeout(timer.current), []);

  const place = useCallback(() => {
    const t = trigger.current?.getBoundingClientRect(); const b = bubble.current?.getBoundingClientRect();
    if (!t || !b) return;
    const cx0 = t.left + t.width / 2; const cy0 = t.top + t.height / 2;
    const p = {
      top: { top: t.top - b.height - GAP, left: cx0 - b.width / 2 },
      bottom: { top: t.bottom + GAP, left: cx0 - b.width / 2 },
      left: { top: cy0 - b.height / 2, left: t.left - b.width - GAP },
      right: { top: cy0 - b.height / 2, left: t.right + GAP },
    }[direction];
    setPos({ top: Math.round(p.top), left: Math.round(Math.max(4, p.left)), off: t.bottom < 0 || t.top > window.innerHeight });
  }, [direction]);

  useLayoutEffect(() => { if (visible) place(); else setPos(null); }, [visible, place, content]);
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') hide(); };
    window.addEventListener('scroll', place, true); window.addEventListener('resize', place); document.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place); document.removeEventListener('keydown', onKey); };
  }, [visible, place]);

  return (
    <>
      <span
        ref={trigger}
        className={cx('wiz-tooltip-trigger', className)}
        aria-describedby={visible ? id : undefined}
        onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}
      >
        {children}
      </span>
      {visible && createPortal(
        <div
          ref={bubble}
          id={id}
          role="tooltip"
          className={cx('wiz-tooltip', `wiz-tooltip--${direction}`)}
          style={pos ? { top: pos.top, left: pos.left, visibility: pos.off ? 'hidden' : undefined } : { top: 0, left: 0, visibility: 'hidden' }}
        >
          <div className="wiz-tooltip__bubble">{content}</div>
          <span className="wiz-tooltip__arrow" />
        </div>,
        document.body,
      )}
    </>
  );
}
