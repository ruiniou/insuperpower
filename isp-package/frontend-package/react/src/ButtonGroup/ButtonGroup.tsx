import { cx } from '../cx';
import './ButtonGroup.css';

/** Figma Buttons / Button Group 1146:208：Count 2 / 3 / 4（由 items 数量决定）× Hover（第 N 个） */
export interface ButtonGroupItem {
  value: string;
  /** Remix 图标类名 */
  icon?: string;
  label?: string;
  disabled?: boolean;
  /** 仅有图标时必填 */
  ariaLabel?: string;
}
export interface ButtonGroupProps {
  /** 2–4 个 */
  items: ButtonGroupItem[];
  /** 传入后为单选分段：当前项加 aria-pressed 并高亮；不传则为普通按钮组 */
  value?: string;
  onChange?: (value: string) => void;
  onItemClick?: (value: string) => void;
  /** 强制第 N 个（从 1 起）显示悬停样式，供展示用 */
  forceHoverIndex?: number;
  className?: string;
  'aria-label'?: string;
}

export function ButtonGroup({ items, value, onChange, onItemClick, forceHoverIndex, className, ...rest }: ButtonGroupProps) {
  return (
    <div role="group" {...rest} className={cx('wiz-button-group', className)}>
      {items.map((it, i) => {
        const pressed = value !== undefined ? it.value === value : undefined;
        return (
          <button
            key={it.value}
            type="button"
            disabled={it.disabled}
            aria-label={it.label ? undefined : it.ariaLabel}
            aria-pressed={pressed}
            className={cx('wiz-button-group__item', it.label && 'has-label', pressed && 'is-selected', forceHoverIndex === i + 1 && 'is-hover')}
            onClick={() => { onItemClick?.(it.value); onChange?.(it.value); }}
          >
            {it.icon && <i className={it.icon} aria-hidden="true" />}
            {it.label && <span>{it.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
