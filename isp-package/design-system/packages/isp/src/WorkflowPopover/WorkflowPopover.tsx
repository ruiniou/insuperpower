import type { HTMLAttributes, ReactNode } from 'react';
import { Popover, Status, type StatusTone } from '@wiz/react';
import { cx } from '../cx';
import { RefLink } from '../RefLink/RefLink';
import './WorkflowPopover.css';

export interface WorkflowPopoverLine {
  /** 左列标签；同组第 2 行起可留空 */
  label: string;
  text: string;
  /** 传入则 text 渲染为跳转链接 */
  onOpen?: () => void;
}

export interface WorkflowPopoverProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Workflow 名 */
  title: string;
  /** 右上状态 Badge */
  badge: string;
  badgeTone: StatusTone;
  lines: WorkflowPopoverLine[];
  /** 底部按钮（主按钮 + All workflows），由调用方传入库 Button */
  footer: ReactNode;
  /** below = 气泡在连线按钮下方（箭头朝上）；above = 在上方（箭头朝下） */
  placement: 'below' | 'above';
  /** 箭头相对气泡左边缘的位置（px） */
  tailLeft: number;
}

/** 连线按钮弹出的 Workflow 气泡：名称 + 状态、Inputs / Output / Latest run、底部按钮。位置（left + top 或 bottom）由调用方 style 决定 */
export function WorkflowPopover({ title, badge, badgeTone, lines, footer, placement, tailLeft, className, children, ...rest }: WorkflowPopoverProps) {
  return (
    <Popover arrow={placement === 'above' ? 'down' : 'up'} arrowOffset={tailLeft} title={title} extra={<Status tone={badgeTone}>{badge}</Status>} footer={footer} className={cx('wiz-isp-pop', className)} {...rest}>
      {lines.map((l, i) => (
        <div className="wiz-isp-pop__line" key={i}>
          <span>{l.label}</span>
          <span className="wiz-isp-pop__val">{l.onOpen ? <RefLink onClick={l.onOpen}>{l.text}</RefLink> : l.text}</span>
        </div>
      ))}
      {children}
    </Popover>
  );
}
