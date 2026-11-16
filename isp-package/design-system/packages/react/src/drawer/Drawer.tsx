import { useEffect, useState, type HTMLAttributes, type ReactNode } from 'react';
import { CloseButton } from '../CloseButton/CloseButton';
import { Splitter } from '../Splitter/Splitter';
import { cx } from '../cx';
import './Drawer.css';

/** 右侧覆盖层抽屉（原型 .dr）：绝对定位于最近的定位祖先，标题栏 48 + 关闭 + 滚动体；左缘 Splitter 可拖宽 */
export interface DrawerProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  open?: boolean;
  title: ReactNode;
  /** 标题后的浅色说明（常规字重） */
  subtitle?: ReactNode;
  onClose?: () => void;
  /** 受控宽度；不传则内部自管，初始为 defaultWidth */
  width?: number;
  defaultWidth?: number;
  min?: number;
  max?: number;
  onWidthChange?: (w: number) => void;
  /** 是否可拖宽，默认 true */
  resizable?: boolean;
  /** 距定位祖先顶部的偏移（用于避开页头），默认 0 */
  top?: number | string;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function Drawer({
  open = true, title, subtitle, onClose, width, defaultWidth = 440, min = 320, max = 560, onWidthChange, resizable = true,
  top = 0, className, style, children, ...rest
}: DrawerProps) {
  const [inner, setInner] = useState(clamp(defaultWidth, min, max));
  const w = clamp(width ?? inner, min, max);
  useEffect(() => {
    if (!open || !onClose) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  const set = (next: number) => { const v = clamp(next, min, max); if (width == null) setInner(v); onWidthChange?.(v); };
  return (
    <aside {...rest} className={cx('wiz-drawer', className)} style={{ width: w, top, ...style }}>
      {resizable && (
        <Splitter className="wiz-drawer__split" reverse aria-label="Resize drawer" value={w} min={min} max={max} onResize={(d) => set(w + d)} />
      )}
      <div className="wiz-drawer__head">
        <span className="wiz-drawer__title">{title}{subtitle != null && <span className="wiz-drawer__sub">{subtitle}</span>}</span>
        {onClose && <CloseButton onClick={onClose} />}
      </div>
      <div className="wiz-drawer__body">{children}</div>
    </aside>
  );
}

/** 抽屉内的「键 / 值 / 操作」行（原型 .kv）：键列 90，高 44 */
export interface DrawerRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}
export function DrawerRow({ label, action, className, children, ...rest }: DrawerRowProps) {
  return (
    <div {...rest} className={cx('wiz-drawer__row', className)}>
      <span className="wiz-drawer__row-k">{label}</span>
      <span className="wiz-drawer__row-v">{children}</span>
      <span>{action}</span>
    </div>
  );
}

/** 抽屉内的分节标题行（标题 + 计数 + 右侧操作），高 48 */
export function DrawerSectionHead({ title, count, actions, className, ...rest }: Omit<HTMLAttributes<HTMLDivElement>, 'title'> & { title: ReactNode; count?: number; actions?: ReactNode }) {
  return (
    <div {...rest} className={cx('wiz-drawer__sec', className)}>
      <span className="wiz-drawer__sec-t">{title}{count != null && <i>{count}</i>}</span>
      {actions}
    </div>
  );
}
