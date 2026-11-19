import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { Field, FieldBox, resolveFieldState, type FieldSize, type FieldState } from '../Field/Field';
import { useUid } from '../useControllable';

/** Figma Input / Single Line 365:1106（Size × State；Content 由是否有值决定） */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: ReactNode;
  required?: boolean;
  /** 有值即 Error 态并显示错误文案 */
  error?: ReactNode;
  /** 控件下方的辅助说明 */
  hint?: ReactNode;
  size?: FieldSize;
  /** 强制显示的状态，供展示用；真实交互自动生效 */
  state?: FieldState;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, required, error, hint, size = 'medium', state, disabled, id, className, ...rest }, ref,
) {
  const uid = useUid('wiz-input');
  const inputId = id ?? uid;
  const st = resolveFieldState(state, { error, disabled: disabled || state === 'disable' });
  return (
    <Field label={label} required={required} error={error} hint={hint} size={size} htmlFor={inputId} errorId={`${inputId}-err`} className={className}>
      <FieldBox state={st}>
        <input
          {...rest}
          ref={ref}
          id={inputId}
          className="wiz-field__native"
          disabled={st === 'disable'}
          required={required}
          aria-invalid={st === 'error' || undefined}
          aria-describedby={st === 'error' ? `${inputId}-err` : undefined}
        />
      </FieldBox>
    </Field>
  );
});
