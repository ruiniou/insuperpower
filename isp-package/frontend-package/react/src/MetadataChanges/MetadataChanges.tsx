import type { ReactNode } from 'react';
import { AddOn, type AddOnProps } from '../AddOn/AddOn';

export interface MetadataChangesProps extends Omit<AddOnProps, 'title' | 'count' | 'loading' | 'actions' | 'maxBodyHeight'> {
  /** 标题里的数量 */
  count: number;
  /** 展开内容（变更列表由调用方提供） */
  children?: ReactNode;
  /** 列表最大高度，默认 200 */
  maxBodyHeight?: number;
  /** 传入后头部右侧出现关闭按钮 */
  onClose?: () => void;
}

export function MetadataChanges({ count, maxBodyHeight = 200, onClose, children, ...rest }: MetadataChangesProps) {
  return (
    <AddOn
      {...rest}
      title={`${count} Metadata Changes`}
      maxBodyHeight={maxBodyHeight}
      actions={onClose ? (
        <button type="button" className="wiz-addon__icon-btn" aria-label="Close Metadata Changes" onClick={onClose}>
          <i className="ri-close-line" aria-hidden="true" />
        </button>
      ) : undefined}
    >
      {children}
    </AddOn>
  );
}
