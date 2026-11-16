import { cx } from '../cx';
import { AddOn, type AddOnProps } from '../AddOn/AddOn';
import { Button } from '../Button/Button';
import './PendingChanges.css';

export interface PendingChangeItem {
  /** 行文字，如 Lines 3-5 */
  label: string;
}

export interface PendingChangesProps extends Omit<AddOnProps, 'title' | 'count' | 'loading' | 'actions' | 'children' | 'maxBodyHeight'> {
  items: PendingChangeItem[];
  /** 标题里的数量，默认 items.length */
  count?: number;
  /** 列表最大高度，默认 140 */
  maxBodyHeight?: number;
  onReject?: () => void;
  onAccept?: () => void;
  /** 点击某一项定位到代码 */
  onLocate?: (item: PendingChangeItem, index: number) => void;
}

export function PendingChanges({ items, count, maxBodyHeight = 140, onReject, onAccept, onLocate, className, ...rest }: PendingChangesProps) {
  return (
    <AddOn
      {...rest}
      className={cx('wiz-pending', className)}
      title={`${count ?? items.length} Pending Changes`}
      maxBodyHeight={maxBodyHeight}
      actions={(
        <>
          <Button size="small" variant="secondary" onClick={onReject}>Reject</Button>
          <Button size="small" variant="primary" onClick={onAccept}>Accept</Button>
        </>
      )}
    >
      {items.map((item, i) => (
        <button key={`${item.label}-${i}`} type="button" className="wiz-pending__item" onClick={() => onLocate?.(item, i)}>
          <i className="ri-code-s-slash-line" aria-hidden="true" />
          <span>{item.label}</span>
        </button>
      ))}
    </AddOn>
  );
}
