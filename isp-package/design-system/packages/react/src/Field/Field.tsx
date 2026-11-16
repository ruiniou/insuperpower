import { forwardRef, type ReactNode } from 'react';
import { cx } from '../cx';
import './Field.css';

/** Figma Input 系列变体属性 Size */
export type FieldSize = 'small' | 'medium' | 'large';
/** Figma Input 系列变体属性 State；hover / focus 为强制显示（真实悬停、聚焦同效） */
export type FieldState = 'default' | 'hover' | 'focus' | 'error' | 'disable';

export interface FieldProps {
  label?: ReactNode;
  required?: boolean;
  /** 有值即进入 Error 态并在下方显示 */
  error?: ReactNode;
  size?: FieldSize;
  /** label 指向的控件 id */
  htmlFor?: string;
  errorId?: string;
  /** 控件下方的辅助说明（无错误时显示） */
  hint?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/** 标题 + 必填星号 + 控件 + 错误信息 的外壳（Input / Textarea / Select / Multi Select 共用） */
export function Field({ label, required, error, size = 'medium', htmlFor, errorId, hint, className, children }: FieldProps) {
  return (
    <div className={cx('wiz-field', `wiz-field--${size}`, className)}>
      {label != null && (
        <label className="wiz-field__title" htmlFor={htmlFor}>
          {required && <span className="wiz-field__star" aria-hidden="true">*</span>}
          <span>{label}</span>
        </label>
      )}
      {children}
      {error != null && error !== false && error !== '' && (
        <div className="wiz-field__error" id={errorId} role="alert">{error}</div>
      )}
      {hint != null && hint !== false && !(error != null && error !== false && error !== '') && <div className="wiz-field__hint">{hint}</div>}
    </div>
  );
}

export function resolveFieldState(state: FieldState | undefined, o: { error?: ReactNode; disabled?: boolean }): FieldState {
  if (o.disabled) return 'disable';
  if (o.error != null && o.error !== false && o.error !== '') return 'error';
  return state ?? 'default';
}

/** 带描边的输入框外壳 */
export const FieldBox = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { state: FieldState; multiline?: boolean }>(function FieldBox({ state, multiline, className, children, ...rest }, ref) {
  return (
    <div
      {...rest}
      ref={ref}
      className={cx('wiz-field__box', multiline && 'wiz-field__box--multi',
        state === 'hover' && 'is-hover', state === 'focus' && 'is-focus', state === 'error' && 'is-error', state === 'disable' && 'is-disabled', className)}
    >
      {children}
    </div>
  );
});
