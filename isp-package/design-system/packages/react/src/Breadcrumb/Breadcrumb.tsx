import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cx } from '../cx';
import { useUid } from '../useControllable';
import './Breadcrumb.css';

/** ▾ 同级切换下拉里的一行（平铺列表，与交付包原型 .cmenu 一致） */
export interface BreadcrumbOption {
  value: string;
  label: string;
  /** 行前图标 ri 类名 */
  icon?: string;
}

export interface BreadcrumbItem {
  label: ReactNode;
  href?: string;
  onClick?: () => void;
  /** 前置图标 ri 类名 */
  icon?: string;
  /** 传入则该项右侧出现 ▾，点击打开同级切换下拉 */
  options?: BreadcrumbOption[];
  /** 下拉里当前项的 value（该行高亮并打勾） */
  currentValue?: string;
  /** 选中某一行（点名称本身只触发 onClick / href 导航） */
  onSwitch?: (value: string, option: BreadcrumbOption) => void;
  /** 下拉搜索框占位与 aria-label，也用作菜单 aria-label */
  searchPlaceholder?: string;
}

export interface BreadcrumbProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  items: BreadcrumbItem[];
  /** lg = 16px / 行高 24（页头，默认，与原型一致）；md = 14px / 行高 20 */
  size?: 'md' | 'lg';
}

function SwitchMenu({ item }: { item: BreadcrumbItem }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const root = useRef<HTMLSpanElement>(null);
  const chev = useRef<HTMLButtonElement>(null);
  const menuId = useUid('wiz-crumb-menu');
  const ph = item.searchPlaceholder ?? 'Search';
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const s = q.trim().toLowerCase();
  const list = (item.options ?? []).filter((o) => !s || o.label.toLowerCase().includes(s));
  const pick = (o: BreadcrumbOption) => { setOpen(false); setQ(''); item.onSwitch?.(o.value, o); chev.current?.focus(); };
  const close = () => { setOpen(false); chev.current?.focus(); };

  return (
    <span ref={root} className="wiz-crumb-wrap" onKeyDown={(e) => { if (e.key === 'Escape' && open) { e.stopPropagation(); close(); } }}>
      <button ref={chev} type="button" className="wiz-crumb-chev" aria-label={`Switch ${typeof item.label === 'string' ? item.label : ''}`.trim()}
        aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
        onClick={() => { setOpen((v) => !v); setQ(''); }}>
        <i className="ri-arrow-down-s-line" aria-hidden="true" />
      </button>
      {open && (
        <div id={menuId} role="menu" aria-label={ph} className="wiz-crumb-menu">
          <label className="wiz-crumb-search">
            <i className="ri-search-line" aria-hidden="true" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={ph} aria-label={ph} autoComplete="off" autoFocus />
          </label>
          <div className="wiz-crumb-body">
            {list.map((o) => {
              const current = o.value === item.currentValue;
              return (
                <div key={o.value} role="menuitemradio" aria-checked={current} tabIndex={0} className={cx('wiz-crumb-row', current && 'is-current')}
                  onClick={() => pick(o)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(o); } }}>
                  {o.icon && <i className={cx('wiz-crumb-row__icon', o.icon)} aria-hidden="true" />}
                  <span className="wiz-crumb-row__label">{o.label}</span>
                  {current && <i className="wiz-crumb-row__check ri-check-line" aria-hidden="true" />}
                </div>
              );
            })}
            {list.length === 0 && <div className="wiz-crumb-empty">No results</div>}
          </div>
        </div>
      )}
    </span>
  );
}

/**
 * 面包屑（以交付包原型 .crumb / .cmenu 为准）：最后一项为当前页（字重 500、深色、不可点）；
 * 其余为链接，悬停变品牌蓝并加下划线；带 options 的项右侧有 ▾，点击打开同级切换下拉。
 */
export function Breadcrumb({ items, size = 'lg', className, ...rest }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cx('wiz-breadcrumb', `wiz-breadcrumb--${size}`, className)} {...rest}>
      <ol className="wiz-breadcrumb__list">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          const label = (<>{item.icon && <i className={cx('wiz-crumb__icon', item.icon)} aria-hidden="true" />}<span className="wiz-crumb__text">{item.label}</span></>);
          const title = typeof item.label === 'string' ? item.label : undefined;
          const name = last
            ? <span className="wiz-crumb is-current" aria-current="page" title={title}>{label}</span>
            : item.href
              ? <a className="wiz-crumb is-link" href={item.href} onClick={item.onClick} title={title}>{label}</a>
              : item.onClick
                ? <button type="button" className="wiz-crumb is-link" onClick={item.onClick} title={title}>{label}</button>
                : <span className="wiz-crumb" title={title}>{label}</span>;
          return (
            <li key={i} className="wiz-breadcrumb__item">
              {i > 0 && <i className="wiz-breadcrumb__sep ri-arrow-right-s-line" aria-hidden="true" />}
              {item.options?.length ? <span className="wiz-crumb-mw">{name}<SwitchMenu item={item} /></span> : name}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
