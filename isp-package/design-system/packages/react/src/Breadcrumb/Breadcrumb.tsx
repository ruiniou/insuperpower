import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cx } from '../cx';
import { useUid } from '../useControllable';
import './Breadcrumb.css';

/** 同级切换下拉里的一行（平铺列表，与交付包原型 .cmenu 一致） */
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
  /** 传入则该项名称悬停（约 200ms）展开同级切换下拉；点击（无 href/onClick 时）、↓ 键同样可展开。不显示 ▾，避免与分隔符 › 混淆 */
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
  /** lg = 16px / 行高 24（页头，默认，与原型一致）；md = 14px / 行高 20；sm = 13px（body-2）/ 行高 20，紧凑页头 */
  size?: 'sm' | 'md' | 'lg';
}

const HOVER_OPEN_MS = 200;
const HOVER_CLOSE_MS = 150;

/** 带同级切换的层级：名称本身是触发器，悬停 200ms 展开、离开 150ms 收起；点击 / ↓ / Enter 也可展开（触屏与键盘） */
function SwitchMenu({ item, name }: { item: BreadcrumbItem; name: (trigger: React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }, open: boolean) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const [focusSearch, setFocusSearch] = useState(false);
  const [q, setQ] = useState('');
  const root = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const timer = useRef<number>();
  const menuId = useUid('wiz-crumb-menu');
  const ph = item.searchPlaceholder ?? 'Search';
  const clear = () => window.clearTimeout(timer.current);
  useEffect(() => clear, []);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const show = (byHover: boolean) => { clear(); setFocusSearch(!byHover); setOpen(true); };
  const hide = () => { clear(); setOpen(false); setQ(''); };
  const schedule = (fn: () => void, ms: number) => { clear(); timer.current = window.setTimeout(fn, ms); };
  const s = q.trim().toLowerCase();
  const list = (item.options ?? []).filter((o) => !s || o.label.toLowerCase().includes(s));
  const pick = (o: BreadcrumbOption) => { hide(); item.onSwitch?.(o.value, o); trigger.current?.focus(); };
  const close = () => { hide(); trigger.current?.focus(); };

  return (
    <span ref={root} className="wiz-crumb-mw"
      onMouseEnter={() => { if (!open) schedule(() => show(true), HOVER_OPEN_MS); else clear(); }}
      onMouseLeave={() => schedule(hide, HOVER_CLOSE_MS)}
      onKeyDown={(e) => { if (e.key === 'Escape' && open) { e.stopPropagation(); close(); } }}>
      {name({
        ref: trigger, 'aria-haspopup': 'menu', 'aria-expanded': open, 'aria-controls': open ? menuId : undefined,
        onClick: () => (open ? hide() : show(false)),
        onKeyDown: (e) => { if (e.key === 'ArrowDown') { e.preventDefault(); show(false); } },
      } as React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }, open)}
      {open && (
        <div id={menuId} role="menu" aria-label={ph} className="wiz-crumb-menu">
          <label className="wiz-crumb-search">
            <i className="ri-search-line" aria-hidden="true" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={ph} aria-label={ph} autoComplete="off" autoFocus={focusSearch} />
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
 * 其余为链接，悬停出现底色胶囊（与带菜单层级一致，不变色、无下划线）；带 options 的项无 ▾，悬停名称后展开同级切换下拉。
 */
export function Breadcrumb({ items, size = 'lg', className, ...rest }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cx('wiz-breadcrumb', `wiz-breadcrumb--${size}`, className)} {...rest}>
      <ol className="wiz-breadcrumb__list">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          const label = (<>{item.icon && <i className={cx('wiz-crumb__icon', item.icon)} aria-hidden="true" />}<span className="wiz-crumb__text">{item.label}</span></>);
          const title = typeof item.label === 'string' ? item.label : undefined;
          const hasMenu = !!item.options?.length;
          const renderName = (t: React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> } = {}, open = false) => {
            const cls = cx('wiz-crumb', last && 'is-current', !last && (item.href || item.onClick) && 'is-link', hasMenu && 'has-menu', open && 'is-open');
            if (last) {
              // 当前页：有同级切换时是按钮（点击展开），否则是纯文本
              return hasMenu
                ? <button type="button" className={cls} aria-current="page" title={title} {...t} ref={t.ref as React.Ref<HTMLButtonElement>}>{label}</button>
                : <span className={cls} aria-current="page" title={title}>{label}</span>;
            }
            if (item.href) return <a className={cls} href={item.href} title={title} {...t} onClick={item.onClick} ref={t.ref as React.Ref<HTMLAnchorElement>}>{label}</a>;
            if (item.onClick) return <button type="button" className={cls} title={title} {...t} onClick={item.onClick} ref={t.ref as React.Ref<HTMLButtonElement>}>{label}</button>;
            return hasMenu
              ? <button type="button" className={cls} title={title} {...t} ref={t.ref as React.Ref<HTMLButtonElement>}>{label}</button>
              : <span className={cls} title={title}>{label}</span>;
          };
          return (
            <li key={i} className="wiz-breadcrumb__item">
              {i > 0 && <i className="wiz-breadcrumb__sep ri-arrow-right-s-line" aria-hidden="true" />}
              {hasMenu ? <SwitchMenu item={item} name={renderName} /> : renderName()}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
