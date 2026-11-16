import { Fragment, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../cx';
import './Steps.css';

/** 主库 Step 330:282：Property 2 = Default / Loading / Completed；Property 1 = 标题是否加深 */
export type StepStatus = 'completed' | 'active' | 'loading' | 'upcoming';
export interface StepData { label: ReactNode; description?: ReactNode }

export interface StepItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** completed = Completed；active = Default 且 Property 1 = true（蓝色实心圆）；upcoming = Default 且 Property 1 = false（灰描边圆）；loading = Loading */
  status?: StepStatus;
  number?: ReactNode;
  label?: ReactNode;
  /** 不传则不显示描述（Show Description = false） */
  description?: ReactNode;
  /** 标题是否加深（Property 1）；默认 active / loading 为深色 */
  selected?: boolean;
  /** 竖向步骤条：在圆下方画连接线 */
  connector?: boolean;
}

/** 单个步骤（Step）：24px 状态圆 + 标题 + 描述 */
export function StepItem({ status = 'upcoming', number, label, description, selected, connector = false, className, ...rest }: StepItemProps) {
  const dark = selected ?? (status === 'active' || status === 'loading');
  return (
    <div className={cx('wiz-step', `wiz-step--${status}`, dark && 'is-dark', connector && 'has-connector', className)}
      aria-current={status === 'active' || status === 'loading' ? 'step' : undefined} {...rest}>
      <span className="wiz-step__rail">
        <span className="wiz-step__disc" aria-hidden="true">
          {status === 'completed' ? <i className="ri-check-line" /> : status === 'loading' ? null : number}
        </span>
        {connector && <span className="wiz-step__line" aria-hidden="true" />}
      </span>
      <span className="wiz-step__content">
        <span className="wiz-step__name">{label}</span>
        {description != null && <span className="wiz-step__desc">{description}</span>}
      </span>
    </div>
  );
}

export interface StepsProps extends HTMLAttributes<HTMLDivElement> {
  steps: StepData[];
  /** 当前步骤（从 0 起）；之前为 completed，之后为 upcoming */
  current?: number;
  /** 当前步骤显示加载圈（Loading） */
  loading?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

/** 主库 Stepper 330:237：步骤之间为 expand-left-right-line 连接图标，间距 24 */
export function Steps({ steps, current = 0, loading = false, orientation = 'horizontal', className, ...rest }: StepsProps) {
  const vertical = orientation === 'vertical';
  const statusOf = (i: number): StepStatus => (i < current ? 'completed' : i === current ? (loading ? 'loading' : 'active') : 'upcoming');
  return (
    <div role="list" className={cx('wiz-steps', vertical && 'wiz-steps--vertical', className)} {...rest}>
      {steps.map((s, i) => (
        <Fragment key={i}>
          <StepItem role="listitem" status={statusOf(i)} number={i + 1} label={s.label} description={s.description}
            connector={vertical && i < steps.length - 1} />
          {!vertical && i < steps.length - 1 && <i className="wiz-steps__sep ri-expand-left-right-line" aria-hidden="true" />}
        </Fragment>
      ))}
    </div>
  );
}
