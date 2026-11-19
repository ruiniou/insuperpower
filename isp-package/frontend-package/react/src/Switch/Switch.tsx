import type { ReactNode } from 'react';
import { cx } from '../cx';
import { useControllable } from '../useControllable';
import './Switch.css';

/** Figma Switch 1174:677：Size（Small 28×16 / Medium 44×24 / Large 52×28）× State（Off / On） */
export type SwitchSize = 'small' | 'medium' | 'large';
export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  size?: SwitchSize;
  label?: ReactNode;
  className?: string;
  'aria-label'?: string;
  onChange?: (checked: boolean) => void;
}

export function Switch({ checked, defaultChecked = false, disabled, size = 'medium', label, className, onChange, ...rest }: SwitchProps) {
  const [on, setOn] = useControllable<boolean>(checked, defaultChecked, onChange);
  const sw = (
    <button
      {...rest}
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      className={cx('wiz-switch', `wiz-switch--${size}`, on && 'is-on', !label && className)}
      onClick={() => setOn(!on)}
    >
      <span className="wiz-switch__knob" />
    </button>
  );
  if (label == null) return sw;
  return (
    <label className={cx('wiz-switch-label', disabled && 'is-disabled', className)}>
      {sw}
      <span>{label}</span>
    </label>
  );
}
