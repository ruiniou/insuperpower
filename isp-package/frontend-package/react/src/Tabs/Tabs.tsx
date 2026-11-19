import { forwardRef, useRef, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../cx';
import { useControllable, useUid } from '../useControllable';
import './Tabs.css';

/** 主库 Tabs 293:206：Style A（灰底轨道 + 白色选中块）/ Style B（无轨道，选中为淡灰底）；Underline 取自交付包原型 .tabs（页面级分区，通栏底线 + 选中蓝色下划线） */
export type TabsVariant = 'style-a' | 'style-b' | 'underline';
/** 旧包 variant 别名：segmented → style-a；pill → style-b */
export type TabsLegacyVariant = 'segmented' | 'pill';
export type TabItemData = string | { value: string; label: ReactNode; disabled?: boolean };

export interface TabItemProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Tab Items Style A 274:155 / Style B 293:151 */
  variant?: TabsVariant;
  /** 选中态；Property 1 = Selected / Normal */
  selected?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

/** 单个页签（Tab Items） */
export const TabItem = forwardRef<HTMLButtonElement, TabItemProps>(function TabItem(
  { variant = 'style-a', selected = false, disabled, className, children, ...rest }, ref,
) {
  return (
    <button ref={ref} type="button" role="tab" aria-selected={selected} disabled={disabled} tabIndex={selected ? 0 : -1}
      className={cx('wiz-tab', `wiz-tab--${variant}`, selected && 'is-selected', className)} {...rest}>
      {children}
    </button>
  );
});

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: TabItemData[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  variant?: TabsVariant | TabsLegacyVariant;
}

const normVariant = (v: TabsVariant | TabsLegacyVariant): TabsVariant => (v === 'style-a' || v === 'segmented' ? 'style-a' : v === 'underline' ? 'underline' : 'style-b');

export function Tabs({ items, value, defaultValue, onChange, variant = 'style-a', className, ...rest }: TabsProps) {
  const norm = items.map((it) => (typeof it === 'string' ? { value: it, label: it, disabled: false } : { disabled: false, ...it }));
  const [current, setCurrent] = useControllable<string>(value, defaultValue ?? norm[0]?.value ?? '', onChange);
  const v = normVariant(variant);
  const id = useUid('wiz-tabs');
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKey = (e: KeyboardEvent) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const enabled = norm.map((n, i) => (n.disabled ? -1 : i)).filter((i) => i >= 0);
    const at = enabled.indexOf(norm.findIndex((n) => n.value === current));
    let next = at;
    if (e.key === 'ArrowRight') next = (at + 1) % enabled.length;
    if (e.key === 'ArrowLeft') next = (at - 1 + enabled.length) % enabled.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = enabled.length - 1;
    const idx = enabled[next];
    setCurrent(norm[idx].value);
    refs.current[idx]?.focus();
  };

  return (
    <div role="tablist" className={cx('wiz-tabs', `wiz-tabs--${v}`, className)} onKeyDown={onKey} {...rest}>
      {norm.map((it, i) => (
        <TabItem key={it.value} id={`${id}-${it.value}`} variant={v} selected={it.value === current} disabled={it.disabled}
          ref={(el) => { refs.current[i] = el; }} onClick={() => setCurrent(it.value)}>
          {it.label}
        </TabItem>
      ))}
    </div>
  );
}
