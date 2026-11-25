import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { CloseButton } from '../CloseButton/CloseButton';
import { FEEDBACK_ICON, type FeedbackTone } from '../Message/feedbackTone';
import { cx } from '../cx';
import { OnStatusButton } from '../OnStatusButton/OnStatusButton';
import './Snackbar.css';

/** Figma Snackbar 889:3809：Property 1 → layout（Single Line / Detailed）× Type */
export type ToastStatus = FeedbackTone;
export type SnackbarType = 'neutral' | ToastStatus;

const STATUS_ICON: Record<SnackbarType, string> = {
  neutral: 'ri-information-line',
  info: 'ri-information-line',
  success: 'ri-checkbox-circle-line',
  warning: 'ri-error-warning-line',
  error: 'ri-close-circle-line',
};
export type SnackbarLayout = 'single' | 'detailed';
export interface SnackbarDetail {
  text: ReactNode;
  /** done = 完成对勾；loading = 转圈；none = 无图标 */
  status?: 'done' | 'loading' | 'none';
}
export interface SnackbarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  type?: SnackbarType;
  /** 缺省：传了 details 则 detailed，否则 single */
  layout?: SnackbarLayout;
  title?: ReactNode;
  description?: ReactNode;
  /** layout="detailed" 的明细行 */
  details?: SnackbarDetail[];
  /** 右侧操作按钮文字（On Status 按钮） */
  actionable?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  closable?: boolean;
  onClose?: () => void;
  /** 左侧图标，默认按状态选择 Remix 图标 */
  icon?: string;
}

export function Snackbar({
  type = 'info', layout, title, description, details, actionable = true, actionLabel, onAction, closable = true, onClose, icon,
  className, children, ...rest
}: SnackbarProps) {
  const lay: SnackbarLayout = layout ?? (details?.length ? 'detailed' : 'single');
  const content = description ?? children;
  const feedbackTone = lay === 'single' && type !== 'neutral' ? type : null;
  const action = actionable && actionLabel && onAction ? (
    <OnStatusButton size={lay === 'single' ? 'small' : 'medium'} onClick={onAction}>{actionLabel}</OnStatusButton>
  ) : null;
  const close = closable && (
    <CloseButton className="wiz-snackbar__close" onClick={onClose} />
  );
  const head = (
    <>
      <span className="wiz-snackbar__icon"><i className={icon ?? (feedbackTone ? FEEDBACK_ICON[feedbackTone] : STATUS_ICON[type])} aria-hidden="true" /></span>
      <div className="wiz-snackbar__text">
        {title != null && <div className="wiz-snackbar__title" title={typeof title === 'string' ? title : undefined}>{title}</div>}
        {content != null && <div className="wiz-snackbar__desc" title={typeof content === 'string' ? content : undefined}>{content}</div>}
      </div>
    </>
  );
  return (
    <div role={type === 'error' ? 'alert' : 'status'} {...rest} className={cx('wiz-snackbar', `wiz-snackbar--${type}`, `wiz-snackbar--${lay}`, feedbackTone && `wiz-feedback--${feedbackTone}`, className)}>
      {lay === 'single' ? (
        <>
          {head}
          {action && <span className="wiz-snackbar__action">{action}</span>}
          {close}
        </>
      ) : (
        <>
          <div className="wiz-snackbar__head">{head}</div>
          {details?.map((d, i) => (
            <div className="wiz-snackbar__detail" key={i}>
              <span className="wiz-snackbar__detail-icon">
                {d.status === 'done' && <i className="ri-checkbox-circle-line" aria-hidden="true" />}
                {d.status === 'loading' && <i className="ri-loader-4-line wiz-snackbar__spin" aria-hidden="true" />}
              </span>
              <span>{d.text}</span>
            </div>
          ))}
          {action && <div className="wiz-snackbar__foot">{action}</div>}
          {closable && <span className="wiz-snackbar__close-slot">{close}</span>}
        </>
      )}
    </div>
  );
}

/* ---- 队列：SnackbarProvider + useSnackbar（自动消失、悬停暂停、aria-live） ---- */
export interface SnackbarOptions extends Omit<SnackbarProps, 'onClose' | 'layout' | 'details' | 'closable' | 'type'> {
  type?: ToastStatus;
  /** 毫秒，0 = 手动关闭。默认普通提示 4000 ms，带操作的提示保持显示 */
  duration?: number;
}
interface Ctx { show: (o: SnackbarOptions) => string; dismiss: (id: string) => void }
const SnackbarCtx = createContext<Ctx | null>(null);

export function useSnackbar(): Ctx {
  const c = useContext(SnackbarCtx);
  if (!c) throw new Error('useSnackbar 需要在 <SnackbarProvider> 内使用');
  return c;
}

function Item({ id, opts, onDismiss }: { id: string; opts: SnackbarOptions; onDismiss: (id: string) => void }) {
  const { duration, onAction, ...props } = opts;
  const actionable = props.actionable !== false && Boolean(props.actionLabel && onAction);
  const timeout = duration ?? (actionable ? 0 : 4000);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (hovered || focused || timeout <= 0) return;
    const timer = setTimeout(() => onDismiss(id), timeout);
    return () => clearTimeout(timer);
  }, [hovered, focused, timeout, id, onDismiss]);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <Snackbar {...props} layout="single" closable actionable={actionable} onClose={() => onDismiss(id)}
        onAction={onAction && (() => { onAction(); onDismiss(id); })} />
    </div>
  );
}

export function SnackbarProvider({ children }: { children?: ReactNode }) {
  const [items, setItems] = useState<{ id: string; opts: SnackbarOptions }[]>([]);
  const seq = useRef(0);
  const dismiss = useCallback((id: string) => setItems((l) => l.filter((x) => x.id !== id)), []);
  const show = useCallback((opts: SnackbarOptions) => { const id = `snack-${++seq.current}`; setItems((l) => [...l, { id, opts }]); return id; }, []);
  const ctx = useMemo(() => ({ show, dismiss }), [show, dismiss]);
  return (
    <SnackbarCtx.Provider value={ctx}>
      {children}
      <div className="wiz-snackbar-region">
        {items.map((x) => <Item key={x.id} id={x.id} opts={x.opts} onDismiss={dismiss} />)}
      </div>
    </SnackbarCtx.Provider>
  );
}
