import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import { Tooltip } from '../Tooltip/Tooltip';
import { PopoverMenu } from '../PopoverMenu/PopoverMenu';
import './Outline.css';

/** 条目类型：Table / Listing / Figure（图标在标题前） */
export type OutlineKind = 'table' | 'listing' | 'figure';
const KIND_ICON: Record<OutlineKind, string> = { table: 'ri-table-line', listing: 'ri-file-list-3-line', figure: 'ri-line-chart-line' };
const KIND_LABEL: Record<OutlineKind, string> = { table: 'Table', listing: 'Listing', figure: 'Figure' };

/** 状态位：行尾只显示一个，优先级 locked > warn > edited > done > 空 */
export type OutlineMark = 'locked' | 'warn' | 'edited' | 'done' | null;
export function outlineMark(s: { locked?: boolean; warn?: boolean; edited?: boolean; done?: boolean }): OutlineMark {
  return s.locked ? 'locked' : s.warn ? 'warn' : s.edited ? 'edited' : s.done ? 'done' : null;
}
const MARK_ICON: Record<'locked' | 'edited' | 'done', string> = { locked: 'ri-lock-line', edited: 'ri-pencil-line', done: 'ri-checkbox-circle-fill' };

export interface OutlineRowProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'title'> {
  kind: OutlineKind;
  /** 编号，如 14.1.3.1 */
  no: string;
  title: string;
  mark?: OutlineMark;
  /** 状态位的悬停文字（Locked / Edited / Reviewed / No source text），黄点的正式说明在详情面板里 */
  markLabel?: string;
  /** 当前项：浅蓝底、蓝字 */
  active?: boolean;
  /** 未实现的条目：aria-disabled，指针为默认，不可选 */
  disabled?: boolean;
}

/** Outline 条目行：高 28，`类型图标 编号 标题（单行省略） …… 状态位` */
export function OutlineRow({ kind, no, title, mark = null, markLabel, active, disabled, onClick, className, ...rest }: OutlineRowProps) {
  return (
    <button type="button" aria-current={active ? 'true' : undefined} aria-disabled={disabled || undefined} className={cx('wiz-outline__row', active && 'is-active', disabled && 'is-disabled', className)}
      onClick={disabled ? undefined : onClick} {...rest}>
      <i className={cx('wiz-outline__kind', KIND_ICON[kind])} role="img" aria-label={KIND_LABEL[kind]} title={KIND_LABEL[kind]} />
      <span className="wiz-outline__text"><span className="wiz-outline__no">{no}</span> {title}</span>
      {mark && (
        mark === 'warn'
          ? <span className="wiz-outline__mark is-warn" role="img" aria-label={markLabel ?? 'Needs attention'} title={markLabel}><span className="wiz-outline__dot" /></span>
          : <i className={cx('wiz-outline__mark', mark === 'done' && 'is-done', MARK_ICON[mark])} role="img" aria-label={markLabel ?? mark} title={markLabel} />
      )}
    </button>
  );
}

export interface OutlineGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  no: string;
  title: string;
  /** 已完成 / 总数；全部完成后右侧换成对勾 */
  done: number;
  total: number;
  open: boolean;
  onToggle: () => void;
  children?: ReactNode;
}

/** Outline 分组行：高 28，`展开箭头 编号 标题 …… 已完成/总数` */
export function OutlineGroup({ no, title, done, total, open, onToggle, className, children, ...rest }: OutlineGroupProps) {
  const all = total > 0 && done >= total;
  return (
    <div className={cx('wiz-outline__group', className)} {...rest}>
      <button type="button" aria-expanded={open} className="wiz-outline__head" onClick={onToggle}>
        <i className={cx('wiz-outline__chev ri-arrow-down-s-line', !open && 'is-closed')} aria-hidden="true" />
        <span className="wiz-outline__text"><span className="wiz-outline__no">{no}</span> {title}</span>
        {all
          ? <i className="wiz-outline__mark is-done ri-checkbox-circle-fill" role="img" aria-label="All done" />
          : <span className="wiz-outline__count">{done}/{total}</span>}
      </button>
      {open && <div role="group" aria-label={no + ' ' + title}>{children}</div>}
    </div>
  );
}

export interface OutlineFilterOption { value: string; label: string; count: number }
export interface OutlineFilterProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: OutlineFilterOption[];
  value: string;
  /** 代表「不筛选」的 value，默认 options[0] */
  allValue?: string;
  onChange: (value: string) => void;
}

/** 带计数的筛选下拉；有筛选时按钮显示当前项并出现清除 */
export function OutlineFilter({ options, value, allValue, onChange, className, ...rest }: OutlineFilterProps) {
  const all = allValue ?? options[0]?.value;
  const active = value !== all;
  const cur = options.find((o) => o.value === value);
  return (
    <div className={cx('wiz-outline__filter', className)} {...rest}>
      <PopoverMenu width={200} onSelect={(v) => onChange(v)}
        items={options.map((o) => ({ value: o.value, selected: o.value === value, label: <span className="wiz-outline__opt"><span>{o.label}</span><span className="wiz-outline__optn">{o.count}</span></span> }))}
        trigger={<button type="button" className={cx('wiz-outline__fbtn', active && 'is-on')} aria-label={'Filter' + (active && cur ? ': ' + cur.label : '')}><i className="ri-filter-3-line" aria-hidden="true" /><span>{active && cur ? cur.label : 'Filter'}</span><i className="ri-arrow-down-s-line" aria-hidden="true" /></button>} />
      {active && <Tooltip content="Clear filter" nowrap><button type="button" className="wiz-outline__fclear" aria-label="Clear filter" onClick={() => onChange(all)}><i className="ri-close-line" aria-hidden="true" /></button></Tooltip>}
    </div>
  );
}
