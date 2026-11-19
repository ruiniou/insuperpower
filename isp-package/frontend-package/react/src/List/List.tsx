import { useState, type HTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import { cx } from '../cx';
import { useControllable } from '../useControllable';
import { Checkbox, type CheckboxState } from '../Checkbox/Checkbox';
import { Switch } from '../Switch/Switch';
import './List.css';

export interface ListItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  /** 主库 List Item 335:214：Property 1 = Selected / Normal */
  active?: boolean;
  label?: ReactNode;
  /** 第二行说明（旧包） */
  description?: ReactNode;
  /** 右侧数字（Show Number） */
  count?: number | string;
  /** 左侧展开箭头（Show Toggle）；open 为展开态，收起时箭头朝右 */
  expandable?: boolean;
  open?: boolean;
  onToggle?: () => void;
  /** 缩进层级，每级 20px */
  level?: number;
  /** 左侧图标 ri 类名 */
  icon?: string;
  checkbox?: CheckboxState;
  onCheck?: (checked: boolean) => void;
  switchOn?: boolean;
  onSwitch?: (checked: boolean) => void;
  trailing?: ReactNode;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
}

/** 主库 List Item：高 32、左右 8、图标与文字间距 4、圆角 8 */
export function ListItem({
  active = false, label, description, count, expandable = false, open = false, onToggle, level = 0, icon,
  checkbox, onCheck, switchOn, onSwitch, trailing, onClick, className, style, ...rest
}: ListItemProps) {
  const interactive = !!(onClick || onToggle);
  return (
    <div
      role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined}
      aria-current={active ? 'true' : undefined} aria-expanded={expandable ? open : undefined}
      className={cx('wiz-list-item', active && 'is-active', description != null && 'has-desc', className)}
      style={level ? { ...style, paddingLeft: `calc(var(--wiz-spacing-sm) + ${level * 20}px)` } : style}
      onClick={(e) => { if (expandable) onToggle?.(); onClick?.(e); }}
      onKeyDown={(e) => { if (interactive && (e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); e.currentTarget.click(); } }}
      {...rest}
    >
      {expandable ? <i className={cx('wiz-list-item__toggle ri-arrow-down-s-line', !open && 'is-closed')} aria-hidden="true" />
        : level > 0 ? <span className="wiz-list-item__toggle" aria-hidden="true" /> : null}
      {checkbox && <span className="wiz-list-item__slot" onClick={(e) => e.stopPropagation()}><Checkbox state={checkbox} onChange={onCheck} aria-label="Select" /></span>}
      {icon && <i className={cx('wiz-list-item__icon', icon)} aria-hidden="true" />}
      <span className="wiz-list-item__main">
        <span className="wiz-list-item__label">{label}</span>
        {description != null && <span className="wiz-list-item__desc">{description}</span>}
      </span>
      {count != null && <span className="wiz-list-item__count">{count}</span>}
      {switchOn != null && <span className="wiz-list-item__slot" onClick={(e) => e.stopPropagation()}><Switch size="small" checked={switchOn} onChange={onSwitch} aria-label="Toggle" /></span>}
      {trailing && <span className="wiz-list-item__slot">{trailing}</span>}
    </div>
  );
}

/** 主库 List Group 337:1102：白底、内边距 8、行紧贴 */
export function ListGroup({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div role="group" className={cx('wiz-list-group', className)} {...rest}>{children}</div>;
}

/** 分组分隔：不传 label 为 1px 线 */
export function ListDivider({ label, className, ...rest }: { label?: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div role="separator" className={cx('wiz-list-divider', className)} {...rest}>
      {label != null && <span className="wiz-list-divider__label">{label}</span>}
      <span className="wiz-list-divider__line" />
    </div>
  );
}

export interface ListProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 标题行（高 48，H4）；不传则不显示 */
  title?: ReactNode;
  /** 标题行右侧操作区 */
  actions?: ReactNode;
}

/** 主库 List 335:405：标题 + 若干 ListGroup / ListDivider */
export function List({ title, actions, className, children, ...rest }: ListProps) {
  return (
    <div className={cx('wiz-list', className)} {...rest}>
      {(title != null || actions) && (
        <div className="wiz-list__title"><span className="wiz-list__title-text">{title}</span>{actions}</div>
      )}
      {children}
    </div>
  );
}

export interface TreeNode { id: string; label: ReactNode; icon?: string; count?: number | string; children?: TreeNode[] }
export interface TreeListProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  nodes: TreeNode[];
  defaultOpen?: string[];
  /** 允许选中（选中行高亮） */
  selectable?: boolean;
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
}

/** 旧包 TreeList：数据驱动的可折叠树，基于 ListItem */
export function TreeList({ nodes, defaultOpen = [], selectable = false, selectedId, defaultSelectedId, onSelect, className, ...rest }: TreeListProps) {
  const [open, setOpen] = useState(() => new Set(defaultOpen));
  const [sel, setSel] = useControllable<string | undefined>(selectedId, defaultSelectedId, (v) => v !== undefined && onSelect?.(v));
  const toggle = (id: string) => setOpen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const render = (list: TreeNode[], level: number): ReactNode[] => list.flatMap((node) => {
    const kids = !!node.children?.length;
    const isOpen = open.has(node.id);
    const row = (
      <ListItem key={node.id} level={level} icon={node.icon} label={node.label} count={node.count}
        expandable={kids} open={isOpen} onToggle={() => toggle(node.id)}
        active={!kids && (selectable || !!onSelect) && sel === node.id}
        onClick={kids ? undefined : () => setSel(node.id)} />
    );
    return kids && isOpen ? [row, ...render(node.children!, level + 1)] : [row];
  });
  return <div role="tree" className={cx('wiz-tree-list', className)} {...rest}>{render(nodes, 0)}</div>;
}
