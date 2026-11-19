import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Avatar, type AvatarColor } from '../Avatar/Avatar';
import { cx } from '../cx';
import { Field, type FieldSize } from '../Field/Field';
import { Search } from '../Search/Search';
import { useControllable, useUid } from '../useControllable';
import './MemberSelect.css';

export interface MemberOption {
  value: string;
  name: string;
  /** 头像文字，默认取姓名前两个字符 */
  initials?: string;
  color?: AvatarColor;
  /** 姓名后的次要信息，如邮箱 */
  hint?: string;
  disabled?: boolean;
}

export interface MemberSelectProps {
  options: MemberOption[];
  value?: string | null;
  defaultValue?: string | null;
  /** 选中回调：(value, option) */
  onChange?: (value: string, option: MemberOption) => void;
  label?: ReactNode;
  required?: boolean;
  error?: ReactNode;
  hint?: ReactNode;
  /** box：带边框的表单控件；inline：无边框，悬停与聚焦才显边框，用于表格单元格 */
  variant?: 'box' | 'inline';
  size?: FieldSize;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  noMatchText?: string;
  className?: string;
  'aria-label'?: string;
}

const AV = { small: 20, medium: 24, large: 28 } as const;

/** 可搜索的单选成员选择器（移植自 Atlas MemberSingleSelect）：触发器显示头像加姓名，面板顶部搜索，选项带头像。面板挂到 body 并按触发器定位，不会被表格单元格裁切 */
export function MemberSelect({
  options, value, defaultValue, onChange, label, required, error, hint, variant = 'box', size = 'medium', disabled, placeholder = 'Select a member',
  searchPlaceholder = 'Search people', noMatchText = 'No matches', className, 'aria-label': ariaLabel,
}: MemberSelectProps) {
  const [current, setCurrent] = useControllable<string | null>(value, defaultValue ?? null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<CSSProperties>({});
  const uid = useUid('wiz-member');
  const listId = `${uid}-list`;
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === current);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => (o.name + ' ' + (o.hint ?? '')).toLowerCase().includes(q)) : options;
  }, [options, query]);

  const close = (refocus = true) => { setOpen(false); setQuery(''); if (refocus) trigger.current?.focus(); };
  const choose = (o: MemberOption) => { if (o.disabled) return; setCurrent(o.value); onChange?.(o.value, o); close(); };

  useEffect(() => {
    if (!open) return;
    const r = trigger.current!.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    const w = Math.max(r.width, 240);
    setPos({ left: Math.min(r.left, window.innerWidth - w - 8), width: w, ...(below < 300 && r.top > below ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }) });
    const idx = visible.findIndex((o) => o.value === current && !o.disabled);
    setActive(idx >= 0 ? idx : Math.max(0, visible.findIndex((o) => !o.disabled)));
    const onDoc = (e: MouseEvent) => { const t = e.target as Node; if (!panel.current?.contains(t) && !trigger.current?.contains(t)) close(false); };
    const onMove = (e: Event) => { if (!panel.current?.contains(e.target as Node)) close(false); };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => { document.removeEventListener('mousedown', onDoc); window.removeEventListener('scroll', onMove, true); window.removeEventListener('resize', onMove); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => { setActive(Math.max(0, visible.findIndex((o) => !o.disabled))); }, [query]);
  useEffect(() => { if (open) (document.getElementById(`${uid}-opt-${active}`) as HTMLElement | null)?.scrollIntoView?.({ block: 'nearest' }); }, [active, open, uid]);

  const move = (dir: 1 | -1) => {
    for (let n = 1, i = active; n <= visible.length; n++) {
      i = (i + dir + visible.length) % visible.length;
      if (!visible[i].disabled) { setActive(i); return; }
    }
  };
  const onPanelKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); if (visible[active]) choose(visible[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'Tab') close(false);
  };
  const onTriggerKey = (e: KeyboardEvent) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); } };

  const av = AV[size];
  const box = (
    <button ref={trigger} type="button" id={uid} disabled={disabled} aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined}
      aria-invalid={error ? true : undefined}
      className={cx('wiz-member', `wiz-member--${variant}`, `wiz-member--${size}`, open && 'is-open', !!error && 'is-error', className)}
      onClick={() => setOpen((o) => !o)} onKeyDown={onTriggerKey}>
      {selected ? <Avatar size={av} color={selected.color ?? 'brand-blue'} initials={selected.initials} name={selected.name} /> : <span className="wiz-member__ph-av" style={{ width: av, height: av }} aria-hidden="true"><i className="ri-user-line" /></span>}
      <span className={cx('wiz-member__text', !selected && 'is-placeholder')}>{selected ? selected.name : placeholder}</span>
      <i className={cx('ri-arrow-down-s-line', 'wiz-member__arrow', open && 'is-open')} aria-hidden="true" />
    </button>
  );

  return (
    <>
      {label || error || hint ? <Field label={label} required={required} error={error} hint={hint} size={size} htmlFor={uid} errorId={`${uid}-err`}>{box}</Field> : box}
      {open && createPortal(
        <div ref={panel} className="wiz-member__panel" style={pos} onKeyDown={onPanelKey}>
          <Search size="compact" width="100%" autoFocus placeholder={searchPlaceholder} aria-label={searchPlaceholder} aria-controls={listId} value={query} onChange={(e) => setQuery(e.target.value)} />
          <ul id={listId} role="listbox" aria-label={typeof label === 'string' ? label : ariaLabel ?? 'Members'} className="wiz-member__list">
            {visible.length === 0 && <li className="wiz-member__empty" role="presentation">{noMatchText}</li>}
            {visible.map((o, i) => (
              <li key={o.value} id={`${uid}-opt-${i}`} role="option" aria-selected={o.value === current} aria-disabled={o.disabled || undefined}
                className={cx('wiz-member__opt', o.value === current && 'is-selected', i === active && 'is-active', o.disabled && 'is-disabled')}
                onMouseDown={(e) => { e.preventDefault(); choose(o); }} onMouseEnter={() => !o.disabled && setActive(i)}>
                <Avatar size={24} color={o.color ?? 'brand-blue'} initials={o.initials} name={o.name} />
                <span className="wiz-member__name">{o.name}{o.hint && <small>{o.hint}</small>}</span>
                {o.value === current && <i className="ri-check-line wiz-member__tick" aria-hidden="true" />}
              </li>
            ))}
          </ul>
        </div>,
        document.body,
      )}
    </>
  );
}
