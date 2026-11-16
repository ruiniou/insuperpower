import type { HTMLAttributes, ReactNode } from 'react';
import { Checkbox } from '../Checkbox/Checkbox';
import { cx } from '../cx';
import './PickList.css';

export interface PickListItem {
  id: string;
  /** 与 columns 一一对应的单元格内容 */
  cells: ReactNode[];
  /** 行内「已选」时才显示的控件列由 cells 自己决定；此处只控制勾选框 */
  disabled?: boolean;
  /** 行的可访问名（勾选框的 aria-label） */
  label?: string;
}
export interface PickListColumn { header: ReactNode; /** CSS 宽度，默认 minmax(0,1fr) */ width?: string }

/** 多选选择器（原型 .pick）：描边圆角 8、表头 30、行最小 40、选中行浅蓝底、体部可限高滚动 */
export interface PickListProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  columns: PickListColumn[];
  items: PickListItem[];
  selected: string[];
  onToggle: (id: string, checked: boolean) => void;
  /** 体部最大高度，默认 228 */
  maxBodyHeight?: number;
}

export function PickList({ columns, items, selected, onToggle, maxBodyHeight = 228, className, ...rest }: PickListProps) {
  const tpl = `24px ${columns.map((c) => c.width ?? 'minmax(0,1fr)').join(' ')}`;
  const on = new Set(selected);
  return (
    <div {...rest} className={cx('wiz-picklist', className)}>
      <div className="wiz-picklist__head" style={{ gridTemplateColumns: tpl }}>
        <span />
        {columns.map((c, i) => <span key={i}>{c.header}</span>)}
      </div>
      <div className="wiz-picklist__body" style={{ maxHeight: maxBodyHeight }}>
        {items.map((it) => (
          <div key={it.id} className={cx('wiz-picklist__row', on.has(it.id) && 'is-on')} style={{ gridTemplateColumns: tpl }}>
            <Checkbox checked={on.has(it.id)} disabled={it.disabled} aria-label={it.label ?? it.id} onChange={(c) => onToggle(it.id, c)} />
            {it.cells.map((c, i) => <span key={i} className="wiz-picklist__cell">{c}</span>)}
          </div>
        ))}
      </div>
    </div>
  );
}
