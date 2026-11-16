import type { ReactNode } from 'react';
import { cx } from '../cx';
import { useControllable } from '../useControllable';
import './Radio.css';

/** Figma Radio 377:836：Default / hover / Selected / selected-hover（hover 由 forceHover 或真实悬停） */
export interface RadioProps {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  forceHover?: boolean;
  label?: ReactNode;
  name?: string;
  value?: string;
  className?: string;
  'aria-label'?: string;
  onChange?: () => void;
}

export function Radio({ checked, defaultChecked = false, disabled, forceHover, label, name, value, className, onChange, ...rest }: RadioProps) {
  const [on, setOn] = useControllable<boolean>(checked, defaultChecked, undefined);
  return (
    <label className={cx('wiz-radio', disabled && 'is-disabled', forceHover && 'is-hover', className)}>
      <input
        type="radio"
        className="wiz-radio__native"
        name={name}
        value={value}
        disabled={disabled}
        checked={on}
        onChange={() => { if (disabled) return; setOn(true); onChange?.(); }}
        {...rest}
      />
      <span className="wiz-radio__hit">
        <span className={cx('wiz-radio__ring', on && 'is-on')}>{on && <span className="wiz-radio__dot" />}</span>
      </span>
      {label != null && <span className="wiz-radio__label">{label}</span>}
    </label>
  );
}
