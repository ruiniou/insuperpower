import { useEffect, type ReactNode } from 'react';
import { Button } from '../Button/Button';
import { Modal } from '../Modal/Modal';
import './ConfirmDialog.css';

export interface ConfirmDialogProps {
  open?: boolean;
  /** 动词开头的标题式大小写，如 Discard Changes? */
  title: string;
  /** 先说后果，再说不会受影响的部分；一两句 */
  description: ReactNode;
  /** 确认要做的动作，动词开头，如 Discard Changes。不要写 OK / Confirm */
  confirmLabel: string;
  children?: ReactNode;
  showConfirm?: boolean;
  /** Give the destructive action visual priority while keeping initial focus on the safe action. */
  primaryDanger?: boolean;
  width?: number;
  /** 退回的动作，动词开头，如 Keep Editing。不要写 Cancel */
  cancelLabel: string;
  /** danger：确认动作是破坏性的，安全选项（cancel）为主按钮并在右侧；default：确认动作为主按钮 */
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  /** 退回：点取消按钮、右上角关闭、Esc、遮罩都走这里 */
  onCancel: () => void;
}

/**
 * 二次确认 / 拦截弹窗（Atlas 框架：宽 440；破坏性确认时标题前带 32 的红色警示图标块）。
 * 默认以安全选项为主按钮。使用 primaryDanger 时改用实心 Danger 按钮，初始焦点仍落在安全选项。
 * 文案必须按 ui_content_writer skill 写（边界情况弹窗不得自拟）。
 */
export function ConfirmDialog({ open = true, title, description, confirmLabel, cancelLabel, tone = 'default', onConfirm, onCancel, children, showConfirm = true, primaryDanger = false, width = 440 }: ConfirmDialogProps) {
  // 破坏性确认：初始焦点落在安全选项上（Modal 默认聚焦第一个可聚焦元素，即关闭按钮）
  useEffect(() => { if (open && tone === 'danger') document.querySelector<HTMLElement>('.wiz-confirm__safe')?.focus(); }, [open, tone]);
  const danger = tone === 'danger';
  return (
    <Modal open={open} title={<>{danger && <span className="wiz-confirm__icon" aria-hidden="true"><i className="ri-error-warning-line" /></span>}{title}</>} width={width} onClose={onCancel}
      footer={danger && primaryDanger
        ? <><Button className="wiz-confirm__safe wiz-confirm__safe--neutral" variant="link" onClick={onCancel}>{cancelLabel}</Button>{showConfirm && <Button variant="danger" dangerStyle="solid" onClick={onConfirm}>{confirmLabel}</Button>}</>
        : danger
        ? <>{showConfirm && <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>}<Button className="wiz-confirm__safe" variant="primary" onClick={onCancel}>{cancelLabel}</Button></>
        : <><Button onClick={onCancel}>{cancelLabel}</Button>{showConfirm && <Button variant="primary" onClick={onConfirm}>{confirmLabel}</Button>}</>}>
      <p className="wiz-confirm__text">{description}</p>
      {children}
    </Modal>
  );
}
