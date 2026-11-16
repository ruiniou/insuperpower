import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../cx';
import { Chip } from '../Chip/Chip';
import { Field, FieldBox, resolveFieldState, type FieldSize, type FieldState } from '../Field/Field';
import { useControllable, useUid } from '../useControllable';
import './Select.css';

export type SelectOption = string | { value: string; label: string; disabled?: boolean };
type Opt = { value: string; label: string; disabled?: boolean };

export interface SelectBaseProps {
  label?: ReactNode;
  required?: boolean;
  error?: ReactNode;
  /** 控件下方的辅助说明 */
  hint?: ReactNode;
  size?: FieldSize;
  state?: FieldState;
  disabled?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  /** 输入框内键入过滤选项 */
  searchable?: boolean;
  /** 强制展开，供展示用 */
  open?: boolean;
  id?: string;
  name?: string;
  className?: string;
  noMatchText?: string;
}

interface Internal extends SelectBaseProps {
  multiple: boolean;
  value?: string | string[];
  defaultValue?: string | string[];
  onChangeAny?: (v: string | string[], option?: Opt) => void;
}

const norm = (o: SelectOption): Opt => (typeof o === 'string' ? { value: o, label: o } : o);

/** Select 与 Multi Select 共用实现：自绘 listbox，键盘 ↑↓ Home End Enter Esc Tab，aria combobox */
export function SelectBase({
  label, required, error, hint, size = 'medium', state, disabled, placeholder = 'Select...', options = [], searchable = false,
  open: forceOpen, id, name, className, noMatchText = 'No matches', multiple, value, defaultValue, onChangeAny,
}: Internal) {
  const opts = useMemo(() => options.map(norm), [options]);
  const uid = useUid('wiz-select');
  const baseId = id ?? uid;
  const listId = `${baseId}-list`;
  const st = resolveFieldState(state, { error, disabled });
  const isDisabled = st === 'disable';

  const [current, setCurrent] = useControllable<string | string[]>(value, defaultValue ?? (multiple ? [] : ''), (v) => onChangeAny?.(v));
  const [openState, setOpen] = useState(false);
  const open = (forceOpen ?? openState) && !isDisabled;
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedVals = multiple ? (Array.isArray(current) ? current : []) : [];
  const selectedOpt = !multiple ? opts.find((o) => o.value === current) : undefined;
  const visible = useMemo(
    () => (searchable && query ? opts.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : opts),
    [opts, searchable, query],
  );
  const isSelected = (v: string) => (multiple ? selectedVals.includes(v) : v === current);

  useEffect(() => {
    if (!open) { setQuery(''); return; }
    const idx = visible.findIndex((o) => isSelected(o.value) && !o.disabled);
    setActive(idx >= 0 ? idx : Math.max(0, visible.findIndex((o) => !o.disabled)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query]);

  useEffect(() => {
    if (!open || forceOpen !== undefined) return;
    const onDoc = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, forceOpen]);

  useEffect(() => {
    if (open) (listRef.current?.children[active] as HTMLElement | undefined)?.scrollIntoView?.({ block: 'nearest' });
  }, [active, open]);

  const choose = (o: Opt) => {
    if (o.disabled) return;
    if (multiple) {
      const next = selectedVals.includes(o.value) ? selectedVals.filter((v) => v !== o.value) : [...selectedVals, o.value];
      setCurrent(next);
      setQuery('');
      inputRef.current?.focus();
    } else {
      setCurrent(o.value);
      onChangeAny?.(o.value, o);
      setOpen(false);
      setQuery('');
    }
  };
  const remove = (v: string) => setCurrent(selectedVals.filter((x) => x !== v));

  const move = (dir: 1 | -1) => {
    if (!visible.length) return;
    let i = active;
    for (let n = 0; n < visible.length; n++) {
      i = (i + dir + visible.length) % visible.length;
      if (!visible[i].disabled) { setActive(i); return; }
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (isDisabled) return;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); if (!open) setOpen(true); else move(1); break;
      case 'ArrowUp': e.preventDefault(); if (!open) setOpen(true); else move(-1); break;
      case 'Home': if (open) { e.preventDefault(); setActive(Math.max(0, visible.findIndex((o) => !o.disabled))); } break;
      case 'End': if (open) { e.preventDefault(); const r = [...visible].reverse().findIndex((o) => !o.disabled); setActive(r < 0 ? 0 : visible.length - 1 - r); } break;
      case 'Enter': case ' ':
        if (e.key === ' ' && searchable) break;
        e.preventDefault();
        if (!open) setOpen(true); else if (visible[active]) choose(visible[active]);
        break;
      case 'Escape': if (open) { e.preventDefault(); e.stopPropagation(); setOpen(false); } break;
      case 'Tab': setOpen(false); break;
      case 'Backspace': if (multiple && searchable && !query && selectedVals.length) remove(selectedVals[selectedVals.length - 1]); break;
    }
  };

  const hasValue = multiple ? selectedVals.length > 0 : !!selectedOpt;
  const activeId = open && visible[active] ? `${baseId}-opt-${active}` : undefined;
  const chipSize = size === 'small' ? 'small' : 'default';

  const inputEl = searchable && (
    <input
      ref={inputRef}
      className={cx('wiz-field__native', 'wiz-select__input', !multiple && selectedOpt && 'has-selected')}
      value={query}
      disabled={isDisabled}
      placeholder={multiple ? (hasValue ? '' : placeholder) : (selectedOpt?.label ?? placeholder)}
      role="combobox"
      aria-expanded={open}
      aria-controls={listId}
      aria-autocomplete="list"
      aria-activedescendant={activeId}
      aria-labelledby={undefined}
      id={baseId}
      onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true); }}
    />
  );

  return (
    <Field label={label} required={required} error={error} hint={hint} size={size} htmlFor={baseId} errorId={`${baseId}-err`} className={cx('wiz-select-field', className)}>
      <div className="wiz-select" ref={rootRef} onKeyDown={onKeyDown}>
        <FieldBox
          state={open && st === 'default' ? 'focus' : st}
          className={cx('wiz-select__box', multiple && 'wiz-select__box--multi', size === 'small' && 'wiz-select__box--s', size === 'large' && 'wiz-select__box--l')}
          tabIndex={isDisabled || searchable ? -1 : 0}
          role={searchable ? undefined : 'combobox'}
          aria-haspopup={searchable ? undefined : 'listbox'}
          aria-expanded={searchable ? undefined : open}
          aria-controls={searchable ? undefined : listId}
          aria-activedescendant={searchable ? undefined : activeId}
          aria-invalid={st === 'error' || undefined}
          aria-describedby={st === 'error' ? `${baseId}-err` : undefined}
          aria-disabled={isDisabled || undefined}
          id={searchable ? undefined : baseId}
          onMouseDown={(e) => {
            if (isDisabled) return;
            if ((e.target as HTMLElement).closest('.wiz-chip__close')) return;
            if (searchable) { if (e.target !== inputRef.current) { e.preventDefault(); inputRef.current?.focus(); } }
            setOpen((o) => !o);
          }}
        >
          {multiple ? (
            <span className="wiz-select__chips">
              {selectedVals.map((v) => (
                <Chip key={v} size={chipSize} disabled={isDisabled} onRemove={isDisabled ? undefined : () => remove(v)} removeLabel={`Remove ${opts.find((o) => o.value === v)?.label ?? v}`}>
                  {opts.find((o) => o.value === v)?.label ?? v}
                </Chip>
              ))}
              {searchable ? inputEl : !hasValue && <span className="wiz-select__placeholder">{placeholder}</span>}
            </span>
          ) : searchable ? inputEl : (
            <span className={cx('wiz-select__value', !hasValue && 'is-placeholder')}>{selectedOpt ? selectedOpt.label : placeholder}</span>
          )}
          <i className={cx('ri-arrow-down-s-line', 'wiz-select__arrow', open && 'is-open')} aria-hidden="true" />
        </FieldBox>
        {name && <input type="hidden" name={name} value={multiple ? selectedVals.join(',') : String(current ?? '')} />}
        {open && (
          <ul ref={listRef} id={listId} role="listbox" aria-multiselectable={multiple || undefined} className="wiz-select__list">
            {visible.length === 0 && <li className="wiz-select__empty" role="presentation">{noMatchText}</li>}
            {visible.map((o, i) => {
              const sel = isSelected(o.value);
              return (
                <li
                  key={o.value}
                  id={`${baseId}-opt-${i}`}
                  role="option"
                  aria-selected={sel}
                  aria-disabled={o.disabled || undefined}
                  className={cx('wiz-select__option', sel && 'is-selected', i === active && 'is-active', o.disabled && 'is-disabled')}
                  onMouseDown={(e) => { e.preventDefault(); choose(o); }}
                  onMouseEnter={() => !o.disabled && setActive(i)}
                >
                  {multiple && <span className={cx('wiz-select__check', sel && 'is-on')}>{sel && <i className="ri-check-line" aria-hidden="true" />}</span>}
                  <span className="wiz-select__text">{o.label}</span>
                  {!multiple && sel && <i className="ri-check-line wiz-select__tick" aria-hidden="true" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Field>
  );
}
