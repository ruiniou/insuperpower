import type { ReactNode } from 'react';
import { cx } from '../cx';
import { AddOn, type AddOnProps } from '../AddOn/AddOn';
import { LabelStatus, type LabelStatusValue } from '../LabelStatus/LabelStatus';
import './EventProgress.css';

export interface EventProgressItem {
  status: LabelStatusValue;
  label: string;
  /** 行右侧操作区，如 Skip / Stop */
  trailing?: ReactNode;
}

export interface EventProgressProps extends Omit<AddOnProps, 'title' | 'count' | 'loading' | 'actions' | 'children' | 'maxBodyHeight'> {
  items: EventProgressItem[];
  /** 标题，默认 Event Progress */
  title?: string;
  /** 列表最大高度，默认 180 */
  maxBodyHeight?: number;
}

export function EventProgress({ items, title = 'Event Progress', maxBodyHeight = 180, className, ...rest }: EventProgressProps) {
  const done = items.filter((i) => i.status === 'done').length;
  const running = items.some((i) => i.status === 'running');
  return (
    <AddOn
      {...rest}
      className={cx('wiz-event-progress', className)}
      title={title}
      count={`${done}/${items.length}`}
      loading={running}
      maxBodyHeight={maxBodyHeight}
    >
      {items.map((item, i) => (
        <LabelStatus key={`${item.label}-${i}`} status={item.status} trailing={item.trailing}>{item.label}</LabelStatus>
      ))}
    </AddOn>
  );
}
