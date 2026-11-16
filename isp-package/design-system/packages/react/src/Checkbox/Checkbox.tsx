import { useEffect, useRef, type ReactNode } from 'react';
import { cx } from '../cx';
import { useControllable } from '../useControllable';
import './Checkbox.css';

/** Figma checkbox 254:304：Status（Uncheck / Check / Intermediate）× Hover × Disable */
export type CheckboxState = 'unchecked' | 'checked' | 'indeterminate';
export interface CheckboxProps {
  /** 状态；优先于 checked / indeterminate */
  state?: CheckboxState;
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  /** 强制显示悬停样式，供展示用 */
  forceHover?: boolean;
  label?: ReactNode;
  name?: string;
  value?: string;
  className?: string;
  'aria-label'?: string;
  onChange?: (checked: boolean) => void;
}

export function Checkbox({
  state, checked, defaultChecked = false, indeterminate = false, disabled = false, forceHover = false,
  label, name, value, className, onChange, ...rest
}: CheckboxProps) {
  const [on, setOn] = useControllable<boolean>(state ? state !== 'unchecked' : checked, defaultChecked, undefined);
  const resolved: CheckboxState = state ?? (indeterminate ? 'indeterminate' : on ? 'checked' : 'unchecked');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = resolved === 'indeterminate'; }, [resolved]);
  return (
    <label className={cx('wiz-checkbox', disabled && 'is-disabled', forceHover && 'is-hover', className)}>
      <input
        ref={ref}
        type="checkbox"
        className="wiz-checkbox__native"
        name={name}
        value={value}
        disabled={disabled}
        checked={resolved === 'checked'}
        aria-checked={resolved === 'indeterminate' ? 'mixed' : resolved === 'checked'}
        onChange={(e) => { if (disabled) return; setOn(e.target.checked); onChange?.(e.target.checked); }}
        {...rest}
      />
      <span className={cx('wiz-checkbox__hit')}>
        <span className={cx('wiz-checkbox__box', resolved !== 'unchecked' && 'is-on')}>
          {resolved === 'checked' && <i className="ri-check-line" aria-hidden="true" />}
          {resolved === 'indeterminate' && <i className="ri-subtract-line" aria-hidden="true" />}
        </span>
      </span>
      {label != null && <span className="wiz-checkbox__label">{label}</span>}
    </label>
  );
}
