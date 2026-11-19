import { Fragment, type HTMLAttributes } from 'react';
import { cx } from '../cx';
import './StepNav.css';

export interface StepNavItem {
  value: string;
  label: string;
  /** ri 类名 */
  icon: string;
  /** 该步骤已锁定：文字后显示小锁 */
  locked?: boolean;
  disabled?: boolean;
}

export interface StepNavProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  items: StepNavItem[];
  /** 当前步骤 */
  value: string;
  onChange?: (value: string) => void;
}

/** 步骤导航：图标 + 文字，步骤间 →；当前步骤灰底并带 aria-current="step"，已锁定步骤显示小锁。点击只切换，不表示完成 */
export function StepNav({ items, value, onChange, className, 'aria-label': ariaLabel = 'Steps', ...rest }: StepNavProps) {
  return (
    <nav aria-label={ariaLabel} className={cx('wiz-stepnav', className)} {...rest}>
      {items.map((it, i) => {
        const on = it.value === value;
        return (
          <Fragment key={it.value}>
            {i > 0 && <i className="wiz-stepnav__arrow ri-arrow-right-line" aria-hidden="true" />}
            <button type="button" disabled={it.disabled} aria-current={on ? 'step' : undefined} className={cx('wiz-stepnav__item', on && 'is-current')} onClick={() => onChange?.(it.value)}>
              <span className="wiz-stepnav__icon"><i className={it.icon} aria-hidden="true" /></span>
              <span>{it.label}</span>
              {it.locked && <i className="wiz-stepnav__lock ri-lock-line" role="img" aria-label="Locked" />}
            </button>
          </Fragment>
        );
      })}
    </nav>
  );
}
