import type { HTMLAttributes, ReactNode } from 'react';
import { Status, type StatusTone } from '@wiz/react';
import { cx } from '../cx';
import './AttentionRow.css';

export interface AttentionRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 类型 Badge 文字：Update / Review / Ready / Running / Study / Failed… */
  tag: string;
  tagTone: StatusTone;
  title: string;
  /** 一行说明 */
  description: string;
  /** 至多两个按钮（次按钮在前、主按钮在后），由调用方传入库 Button */
  actions?: ReactNode;
}

/** Needs your attention 里的一行：类型 Badge + 标题 + 说明 + 按钮 */
export function AttentionRow({ tag, tagTone, title, description, actions, className, ...rest }: AttentionRowProps) {
  return (
    <div className={cx('wiz-isp-ar', className)} {...rest}>
      <span className="wiz-isp-ar__tag"><Status tone={tagTone}>{tag}</Status></span>
      <div className="wiz-isp-ar__text"><b>{title}</b><span>{description}</span></div>
      {actions && <div className="wiz-isp-ar__actions">{actions}</div>}
    </div>
  );
}

export interface AttentionSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: string;
  count: number;
  /** count 为 0 时显示的文案 */
  emptyText?: string;
}

/** 画布下方的待办区：标题 + 数量 + 行列表；空时显示 All caught up. */
export function AttentionSection({ title, count, emptyText = 'All caught up.', className, children, ...rest }: AttentionSectionProps) {
  return (
    <section className={cx('wiz-isp-as', className)} aria-label={title} {...rest}>
      <h3 className="wiz-isp-as__head">{title}<span className="wiz-isp-as__cnt">{count}</span></h3>
      {count === 0 ? <div className="wiz-isp-as__empty">{emptyText}</div> : children}
    </section>
  );
}
