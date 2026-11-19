import { forwardRef, useRef, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { Field, FieldBox, resolveFieldState, type FieldSize, type FieldState } from '../Field/Field';
import { useUid } from '../useControllable';

/** Figma Input / Multiple Line 443:646（Size × State；Small 48 / Medium 64 / Large 80 起） */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  required?: boolean;
  error?: ReactNode;
  /** 控件下方的辅助说明 */
  hint?: ReactNode;
  size?: FieldSize;
  state?: FieldState;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, required, error, hint, size = 'medium', state, disabled, id, className, rows, ...rest }, ref,
) {
  const uid = useUid('wiz-textarea');
  const taId = id ?? uid;
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; h: number; min: number } | null>(null);
  const st = resolveFieldState(state, { error, disabled: disabled || state === 'disable' });
  return (
    <Field label={label} required={required} error={error} hint={hint} size={size} htmlFor={taId} errorId={`${taId}-err`} className={className}>
      <FieldBox ref={boxRef} state={st} multiline>
        <textarea
          {...rest}
          ref={ref}
          id={taId}
          rows={rows}
          className="wiz-field__native"
          disabled={st === 'disable'}
          required={required}
          aria-invalid={st === 'error' || undefined}
          aria-describedby={st === 'error' ? `${taId}-err` : undefined}
        />
        <span
          className="wiz-field__grip"
          aria-hidden="true"
          onPointerDown={(e) => {
            const box = boxRef.current; if (!box) return;
            e.currentTarget.setPointerCapture?.(e.pointerId);
            drag.current = { y: e.clientY, h: box.offsetHeight, min: parseFloat(getComputedStyle(box).minHeight) || 0 };
          }}
          onPointerMove={(e) => {
            const d = drag.current; const box = boxRef.current; if (!d || !box) return;
            box.style.height = `${Math.max(d.min, d.h + e.clientY - d.y)}px`;
          }}
          onPointerUp={() => { drag.current = null; }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round"><path d="M9 3 3 9M9 6.5 6.5 9" /></svg>
        </span>
      </FieldBox>
    </Field>
  );
});
