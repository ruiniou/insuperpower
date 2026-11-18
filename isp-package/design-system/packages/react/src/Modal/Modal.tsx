import { useEffect, useRef, type HTMLAttributes, type ReactNode, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../Button/Button';
import { CloseButton } from '../CloseButton/CloseButton';
import { cx } from '../cx';
import { useUid } from '../useControllable';
import './Modal.css';

/** 框架布局取自 Atlas：默认宽 480、圆角 8、头部（标题 + 关闭）/ 内容 / 页脚（上边线，按钮右对齐）；确认类弹窗用 ConfirmDialog */
export interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  open?: boolean;
  title?: ReactNode;
  width?: number | string;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 不传 = 默认「取消 / 确认」；传 null = 不显示确认栏 */
  footer?: ReactNode | null;
  /** 点击遮罩关闭，默认 true */
  closeOnOverlayClick?: boolean;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Modal({
  open = true, title = 'Modal Title', children, width = 480, onClose, onCancel, onConfirm,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel', footer, closeOnOverlayClick = true, className, style, ...rest
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useUid('wiz-modal-title');

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialogRef.current)?.focus();
    return () => { document.body.style.overflow = overflow; prev?.focus?.(); };
  }, [open]);

  if (!open) return null;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); return; }
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!items.length) { e.preventDefault(); return; }
    const a = items[0]; const z = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === a || document.activeElement === dialogRef.current)) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  };

  return createPortal(
    <div className="wiz-modal-overlay" onMouseDown={(e) => { if (closeOnOverlayClick && e.target === e.currentTarget) onClose?.(); }}>
      <div
        {...rest}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx('wiz-modal', className)}
        style={{ width, ...style }}
        onKeyDown={onKeyDown}
      >
        <div className="wiz-modal__title-bar">
          <h2 className="wiz-modal__title" id={titleId}>{title}</h2>
          <CloseButton onClick={onClose} />
        </div>
        <div className="wiz-modal__content">{children}</div>
        {footer !== null && (
          <div className="wiz-modal__confirm-bar">
            {footer ?? (
              <>
                <Button onClick={onCancel ?? onClose}>{cancelLabel}</Button>
                <Button variant="primary" onClick={onConfirm}>{confirmLabel}</Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
