import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../cx';
import { OnStatusButton } from '../OnStatusButton/OnStatusButton';
import './Snackbar.css';

/** Figma Snackbar 889:3809：Property 1 → layout（Single Line / Detailed）× Type */
export type SnackbarType = 'neutral' | 'success' | 'info' | 'warning' | 'error';
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
  actionLabel?: string;
  onAction?: () => void;
  closable?: boolean;
  onClose?: () => void;
  /** 左侧图标，默认 ri-information-line */
  icon?: string;
}

export function Snackbar({
  type = 'neutral', layout, title, description, details, actionLabel, onAction, closable = true, onClose, icon = 'ri-information-line',
  className, children, ...rest
}: SnackbarProps) {
  const lay: SnackbarLayout = layout ?? (details?.length ? 'detailed' : 'single');
  const action = actionLabel ? <OnStatusButton onClick={onAction}>{actionLabel}</OnStatusButton> : null;
  const close = closable && (
    <button type="button" className="wiz-snackbar__close" aria-label="Close" onClick={onClose}><i className="ri-close-line" aria-hidden="true" /></button>
  );
  const head = (
    <>
      <span className="wiz-snackbar__icon"><i className={icon} aria-hidden="true" /></span>
      <div className="wiz-snackbar__text">
        {title != null && <div className="wiz-snackbar__title">{title}</div>}
        {(description != null || children != null) && <div className="wiz-snackbar__desc">{description ?? children}</div>}
      </div>
    </>
  );
  return (
    <div role={type === 'error' ? 'alert' : 'status'} {...rest} className={cx('wiz-snackbar', `wiz-snackbar--${type}`, `wiz-snackbar--${lay}`, className)}>
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
export interface SnackbarOptions extends Omit<SnackbarProps, 'onClose'> {
  /** 毫秒，0 = 不自动消失，默认 4000 */
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
  const { duration = 4000, ...props } = opts;
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const start = useCallback(() => { if (duration > 0) timer.current = setTimeout(() => onDismiss(id), duration); }, [duration, id, onDismiss]);
  const stop = () => clearTimeout(timer.current);
  useEffect(() => { start(); return stop; }, [start]);
  return (
    <div onMouseEnter={stop} onMouseLeave={start}>
      <Snackbar {...props} onClose={() => onDismiss(id)} onAction={() => { props.onAction?.(); onDismiss(id); }} />
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
      <div className="wiz-snackbar-region" aria-live="polite">
        {items.map((x) => <Item key={x.id} id={x.id} opts={x.opts} onDismiss={dismiss} />)}
      </div>
    </SnackbarCtx.Provider>
  );
}
