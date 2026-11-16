import type { InputHTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import './CheckPill.css';

/** Pill 多选（原型 .pill2）：整块可点的描边胶囊，内含 16 方框勾选；选中为品牌蓝描边 + 浅蓝底。文字较长时自动换行并变为圆角 8 的块 */
export interface CheckPillProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'children'> {
  onChange?: (checked: boolean) => void;
  children: ReactNode;
}

export function CheckPill({ checked, defaultChecked, onChange, disabled, className, children, ...rest }: CheckPillProps) {
  return (
    <label className={cx('wiz-checkpill', checked && 'is-on', disabled && 'is-disabled', className)}>
      <input {...rest} type="checkbox" className="wiz-checkpill__input" checked={checked} defaultChecked={defaultChecked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} />
      <span className="wiz-checkpill__box" aria-hidden="true">{checked && <i className="ri-check-line" />}</span>
      <span className="wiz-checkpill__text">{children}</span>
    </label>
  );
}
