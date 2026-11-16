import { useRef, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../cx';
import { useControllable } from '../useControllable';
import './SegmentedControl.css';

/** text = 原型 .segs/.seg（无外框，高 32，选中灰底，可带图标 + 文字）；boxed = 原型 .seg 图标分段（带 1px 外框，仅图标） */
export type SegmentedControlVariant = 'text' | 'boxed';

export interface SegmentedItem {
  value: string;
  /** 文字；仅图标时必须传 aria-label */
  label?: ReactNode;
  /** ri 类名 */
  icon?: string;
  'aria-label'?: string;
  disabled?: boolean;
}

export interface SegmentedControlProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  items: SegmentedItem[];
  variant?: SegmentedControlVariant;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

/** 分段切换：单选，role=radiogroup；← → 切换并选中 */
export function SegmentedControl({ items, variant = 'text', value, defaultValue, onChange, className, ...rest }: SegmentedControlProps) {
  const [cur, setCur] = useControllable<string>(value, defaultValue ?? items[0]?.value ?? '', onChange);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const move = (i: number, dir: 1 | -1) => {
    for (let k = 1; k <= items.length; k++) {
      const j = (i + dir * k + items.length * k) % items.length;
      if (!items[j].disabled) { setCur(items[j].value); refs.current[j]?.focus(); return; }
    }
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(i, 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(i, -1); }
  };
  return (
    <div role="radiogroup" className={cx('wiz-seg', `wiz-seg--${variant}`, className)} {...rest}>
      {items.map((it, i) => {
        const on = it.value === cur;
        return (
          <button key={it.value} ref={(el) => { refs.current[i] = el; }} type="button" role="radio" aria-checked={on} aria-label={it['aria-label']}
            disabled={it.disabled} tabIndex={on ? 0 : -1} className={cx('wiz-seg__item', on && 'is-on')}
            onClick={() => setCur(it.value)} onKeyDown={(e) => onKey(e, i)}>
            {it.icon && <i className={it.icon} aria-hidden="true" />}
            {it.label !== undefined && <span>{it.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
