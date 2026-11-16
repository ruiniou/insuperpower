import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import { PipelineStatusIcon, type PipelineState } from '../PipelineStatus/PipelineStatus';
import './NodeCard.css';

export interface NodeCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  state: PipelineState;
  /** 标题（节点名） */
  title: string;
  /** 标题下一行的状态说明，如 Locked v2 */
  caption: string;
  /** 点标题行收起 */
  onCollapse?: () => void;
  /** false = 非展开态（Inputs 以外不使用），默认 true */
  selected?: boolean;
}

/** 展开的节点信息卡：标题行（状态图标 + 名称 + Caption）+ 内容。位置、宽度由调用方 style 决定；第 1 行节点向下展开，第 2 行向上展开 */
export function NodeCard({ state, title, caption, onCollapse, selected = true, className, children, ...rest }: NodeCardProps) {
  return (
    <div className={cx('wiz-isp-xc', selected && 'is-selected', className)} {...rest}>
      <button type="button" className="wiz-isp-xc__head" onClick={onCollapse} aria-label={`Collapse ${title}`}>
        <PipelineStatusIcon state={state} />
        <span className="wiz-isp-xc__title"><b>{title}</b><small>{caption}</small></span>
      </button>
      {children}
    </div>
  );
}

/** 灰底键值行容器 */
export function NodeCardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('wiz-isp-xc__body', className)} {...rest} />;
}

export interface NodeCardRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label: string;
  /** 值：链接、文字，以及行内小按钮 */
  children: ReactNode;
}

export function NodeCardRow({ label, children, className, ...rest }: NodeCardRowProps) {
  return (
    <div className={cx('wiz-isp-xc__row', className)} {...rest}>
      <div className="wiz-isp-xc__label">{label}</div>
      <div className="wiz-isp-xc__value">{children}</div>
    </div>
  );
}

/** 黄色提示条（如 Shell v2 available） */
export function NodeCardNote({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('wiz-isp-xc__note', className)} {...rest} />;
}

/** 底部主按钮区 */
export function NodeCardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('wiz-isp-xc__footer', className)} {...rest} />;
}

/** 替换文件前的影响预览：文案 + 确认 / 取消按钮（按钮由调用方传入） */
export function NodeCardConfirm({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('wiz-isp-xc__confirm', className)} {...rest} />;
}
