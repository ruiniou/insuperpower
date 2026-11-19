import { forwardRef, useCallback, useRef, useState, type CSSProperties, type FocusEvent, type InputHTMLAttributes, type KeyboardEvent } from 'react';
import { cx } from '../cx';
import { Tooltip } from '../Tooltip/Tooltip';
import './Search.css';

/** Figma Search 273:337：Default / Hover / Search（有内容或聚焦） */
export type SearchState = 'default' | 'hover' | 'search';
/** default = 主库 40 高；compact = 32 高、14px（与同排按钮 / 筛选对齐） */
export type SearchSize = 'default' | 'compact';
export interface SearchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'width'> {
  /** 宽度，默认 280（collapsible 时为展开后的宽度） */
  width?: number | string;
  size?: SearchSize;
  /** 强制显示的状态，供展示用 */
  state?: SearchState;
  /** 展开形态：初始只显示搜索图标按钮，点击展开为输入框；失焦且为空时收起 */
  collapsible?: boolean;
  /** collapsible 的初始展开状态 */
  defaultExpanded?: boolean;
  /** 点击右侧搜索按钮或在输入框内按 Enter 触发 */
  onSearch?: () => void;
}

export const Search = forwardRef<HTMLInputElement, SearchProps>(function Search(
  { width = 280, size = 'default', state, disabled, collapsible, defaultExpanded = false, onSearch, onKeyDown, onBlur, onChange, className, placeholder = 'Search protocol name, ID, etc.', ...rest }, ref,
) {
  const [open, setOpen] = useState(defaultExpanded);
  const [typed, setTyped] = useState(String(rest.defaultValue ?? ''));
  const inner = useRef<HTMLInputElement | null>(null);
  const setRef = useCallback((el: HTMLInputElement | null) => {
    inner.current = el;
    if (typeof ref === 'function') ref(el); else if (ref) ref.current = el;
  }, [ref]);
  const value = rest.value !== undefined ? String(rest.value) : typed;
  const expanded = !collapsible || open || value !== '';
  const keyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.key === 'Enter' && !e.defaultPrevented) onSearch?.();
    if (e.key === 'Escape' && collapsible && value === '') { setOpen(false); }
  };
  const blur = (e: FocusEvent<HTMLInputElement>) => { onBlur?.(e); if (collapsible && e.currentTarget.value === '') setOpen(false); };

  if (!expanded) {
    return (
      <Tooltip content={rest['aria-label'] ?? 'Search'} nowrap>
        <button type="button" className={cx('wiz-search-toggle', `wiz-search-toggle--${size}`, className)} aria-label={rest['aria-label'] ?? 'Search'} aria-expanded={false} disabled={disabled}
          onClick={() => { setOpen(true); requestAnimationFrame(() => inner.current?.focus()); }}>
          <i className="ri-search-line" aria-hidden="true" />
        </button>
      </Tooltip>
    );
  }
  const style: CSSProperties = { width };
  return (
    <div className={cx('wiz-search', size === 'compact' && 'wiz-search--compact', state === 'hover' && 'is-hover', state === 'search' && 'is-search', disabled && 'is-disabled', className)} style={style} role="search">
      <input {...rest} ref={setRef} type="search" className="wiz-search__input" placeholder={placeholder} disabled={disabled}
        autoFocus={collapsible && open && !defaultExpanded}
        onChange={(e) => { setTyped(e.target.value); onChange?.(e); }} onKeyDown={keyDown} onBlur={blur} />
      <button type="button" className="wiz-search__btn" aria-label="Search" disabled={disabled} onClick={onSearch}>
        <i className="ri-search-line" aria-hidden="true" />
      </button>
    </div>
  );
});
