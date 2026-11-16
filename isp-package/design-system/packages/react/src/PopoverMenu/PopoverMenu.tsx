import { useEffect, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../cx';
import { useUid } from '../useControllable';
import './PopoverMenu.css';

/** 菜单项（以原型 .menu2 为准：项高 32、圆角 8、选中项品牌蓝 + 字重 500） */
export interface PopoverMenuItem {
  label?: ReactNode;
  value?: string;
  icon?: string;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  selected?: boolean;
  /** 为 true 时该项渲染为分隔线 */
  divider?: boolean;
  onClick?: () => void;
}

export interface MenuItemProps {
  item: PopoverMenuItem;
  onClick?: () => void;
  /** 强制显示悬停样式（展示用） */
  forceHover?: boolean;
}

/** 菜单里的一行，也可单独用于自定义菜单 */
export function MenuItem({ item, onClick, forceHover }: MenuItemProps) {
  return (
    <button type="button" role="menuitem" disabled={item.disabled} onClick={onClick}
      className={cx('wiz-menu-item', item.selected && 'is-selected', item.danger && 'is-danger', forceHover && 'is-hover')}>
      {item.icon && <i className={cx('wiz-menu-item__icon', item.icon)} aria-hidden="true" />}
      <span className="wiz-menu-item__label">{item.label}</span>
      {item.shortcut && <span className="wiz-menu-item__shortcut">{item.shortcut}</span>}
    </button>
  );
}

export interface PopoverMenuProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'onSelect'> {
  /** 点击后打开菜单的触发元素 */
  trigger: ReactNode;
  items: PopoverMenuItem[];
  /** 选中回调：(value ?? label, item) */
  onSelect?: (value: string, item: PopoverMenuItem) => void;
  align?: 'left' | 'right';
  /** 菜单最小宽度（默认 200） */
  width?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PopoverMenu({ trigger, items, onSelect, align = 'left', width = 200, open: openProp, onOpenChange, className, ...rest }: PopoverMenuProps) {
  const [inner, setInner] = useState(false);
  const open = openProp ?? inner;
  const setOpen = (v: boolean) => { if (openProp === undefined) setInner(v); onOpenChange?.(v); };
  const root = useRef<HTMLSpanElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuId = useUid('wiz-menu');

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const focusables = () => Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? []);

  useEffect(() => { if (open && openProp === undefined) focusables()[0]?.focus(); }, [open, openProp]);

  const choose = (it: PopoverMenuItem) => {
    if (it.disabled) return;
    setOpen(false);
    it.onClick?.();
    onSelect?.(it.value ?? String(it.label ?? ''), it);
    root.current?.querySelector<HTMLElement>('button, [tabindex]')?.focus();
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); root.current?.querySelector<HTMLElement>('button, [tabindex]')?.focus(); return; }
    if (e.key === 'Tab' && open) { setOpen(false); return; }
    if (e.key === 'ArrowDown' && !open && !menu.current?.contains(e.target as Node)) { e.preventDefault(); setOpen(true); return; }
    if (!open || !menu.current?.contains(e.target as Node)) return;
    const list = focusables();
    const at = list.indexOf(document.activeElement as HTMLButtonElement);
    const move = (i: number) => { e.preventDefault(); list[(i + list.length) % list.length]?.focus(); };
    if (e.key === 'ArrowDown') move(at + 1);
    else if (e.key === 'ArrowUp') move(at - 1);
    else if (e.key === 'Home') move(0);
    else if (e.key === 'End') move(list.length - 1);
  };

  return (
    <span ref={root} className={cx('wiz-popover-menu', className)} onKeyDown={onKey} {...rest}>
      <span className="wiz-popover-menu__trigger" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined} onClick={() => setOpen(!open)}>{trigger}</span>
      {open && (
        <div ref={menu} id={menuId} role="menu" className={cx('wiz-menu', align === 'right' && 'is-right')} style={{ minWidth: width }}>
          {items.map((it, i) => it.divider
            ? <span key={`d${i}`} role="separator" className="wiz-menu__divider" />
            : <MenuItem key={it.value ?? String(it.label ?? i)} item={it} onClick={() => choose(it)} />)}
        </div>
      )}
    </span>
  );
}
