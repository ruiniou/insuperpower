import { Fragment, memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type HTMLAttributes, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { cx } from '../cx';
import { Tooltip } from '../Tooltip/Tooltip';
import { Checkbox } from '../Checkbox/Checkbox';
import { Select } from '../Select/Select';
import { Status } from '../Status/Status';
import './Table.css';

/* ───────── 单元格（主库 Column 356:875 / Column Header 337:1959 / Column Body 339:510） ───────── */

/** Column 的 Property 1：Content / Checkbox / Selector / Status / Link / Actions */
export type ColumnType = 'content' | 'checkbox' | 'selector' | 'status' | 'link' | 'actions';

function CellIconButton({ icon, label, active, onClick }: { icon: string; label: string; active?: boolean; onClick?: (e: MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <Tooltip content={label} nowrap>
      <button type="button" className={cx('wiz-col-iconbtn', active && 'is-active')} aria-label={label} onClick={onClick}>
        <i className={icon} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}

export interface ColumnHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Column Header 的 Property 1：Default / checkbox */
  checkbox?: boolean;
  children?: ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  /** 当前排序方向；null 为未排序 */
  sortDir?: 'asc' | 'desc' | null;
  filterActive?: boolean;
  onSort?: () => void;
  onFilter?: (e: MouseEvent<HTMLButtonElement>) => void;
  /** 右侧分隔线（Draggable Divider） */
  divider?: boolean;
}

/** 表头单元格：灰底 grey-20，高 32，下边框 grey-30；右侧排序 / 筛选图标按钮 24 */
export function ColumnHeader({ checkbox, children, sortable, filterable, sortDir = null, filterActive, onSort, onFilter, divider = true, className, ...rest }: ColumnHeaderProps) {
  if (checkbox) return <div className={cx('wiz-col-header', 'wiz-col-header--checkbox', className)} {...rest}>{children}</div>;
  const sortIcon = sortDir === 'asc' ? 'ri-sort-asc' : sortDir === 'desc' ? 'ri-sort-desc' : 'ri-arrow-up-down-line';
  return (
    <div className={cx('wiz-col-header', className)} {...rest}>
      <span className="wiz-col-header__text">{children}</span>
      {sortable && <CellIconButton icon={sortIcon} label="Sort" active={!!sortDir} onClick={(e) => { e.stopPropagation(); onSort?.(); }} />}
      {filterable && <CellIconButton icon="ri-filter-3-line" label="Filter" active={filterActive} onClick={(e) => { e.stopPropagation(); onFilter?.(e); }} />}
      {divider && <span className="wiz-col-header__divider" aria-hidden="true" />}
    </div>
  );
}

export interface ColumnBodyProps extends HTMLAttributes<HTMLDivElement> {
  type?: ColumnType;
  children?: ReactNode;
}

/** 单元格：白底，高 32，下边框 grey-30；type 决定内容排布（Checkbox 为 32×32 居中；Link / Actions 间距 16） */
export function ColumnBody({ type = 'content', className, children, ...rest }: ColumnBodyProps) {
  return <div className={cx('wiz-col-body', `wiz-col-body--${type}`, className)} {...rest}>{children}</div>;
}

/** Link 单元格里的链接（Link Button：内边距 6，13px，品牌蓝） */
export function CellLink({ className, children, ...rest }: HTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return <button type="button" className={cx('wiz-cell-link', className)} {...rest}>{children}</button>;
}
/** Actions 单元格里的图标按钮（24，16 图标） */
export function CellAction({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) {
  return <CellIconButton icon={icon} label={label} onClick={() => onClick?.()} />;
}

export interface ColumnProps extends HTMLAttributes<HTMLDivElement> {
  type?: ColumnType;
  /** 表头文字 */
  header?: ReactNode;
  /** 行数（默认 5） */
  rows?: number;
  /** 列宽（Actions 110，Checkbox 32，其余 176） */
  width?: number;
}

/** 主库 Column 356:875：一整列（表头 + 5 行）的静态展示，用于说明各 type 的单元格样式 */
export function Column({ type = 'content', header = 'Content Header', rows = 5, width, className, style, ...rest }: ColumnProps) {
  const w = width ?? (type === 'checkbox' ? 32 : type === 'actions' ? 110 : 176);
  return (
    <div className={cx('wiz-column', className)} style={{ ...style, width: w }} {...rest}>
      {type === 'checkbox'
        ? <ColumnHeader checkbox><Checkbox aria-label="Select all" /></ColumnHeader>
        : <ColumnHeader sortable filterable={type !== 'actions'} sortDir={null}>{header}</ColumnHeader>}
      {Array.from({ length: rows }, (_, i) => (
        <ColumnBody key={i} type={type}>
          {type === 'content' && <span className="wiz-col-body__text">Content</span>}
          {type === 'selector' && (<><span className="wiz-col-body__text">Content</span><i className="wiz-col-body__arrow ri-arrow-down-s-line" aria-hidden="true" /></>)}
          {type === 'checkbox' && <Checkbox aria-label="Select row" />}
          {type === 'status' && <Status variant="style2">Status</Status>}
          {type === 'link' && (<><CellLink>link A</CellLink><CellLink>link B</CellLink></>)}
          {type === 'actions' && (<><CellAction icon="ri-edit-line" label="Edit" /><CellAction icon="ri-delete-bin-line" label="Delete" /></>)}
        </ColumnBody>
      ))}
    </div>
  );
}

/* ───────── 整表（沿用旧包 Table.jsx 的结构与交互） ───────── */

export interface TableColumn {
  key: string;
  header: ReactNode;
  /** 自定义单元格内容；返回内容放在单元格内 */
  render?: (value: any, row: any, index: number) => ReactNode;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
}

/** 行高档位（px）：32 为主库默认，40 / 48 / 56 为列表型页面用 */
export type TableRowHeight = 32 | 40 | 48 | 56;
/** default = 主库样式（灰底表头、列分隔线、可拖拽列宽）；plain = 页面级列表（表头无填充、12px 次要色，无列分隔线与拖拽，分割线通栏，首尾单元格内缩 16） */
export type TableVariant = 'default' | 'plain';

export interface TableProps extends HTMLAttributes<HTMLDivElement> {
  columns: TableColumn[];
  rows: Record<string, any>[];
  selectable?: boolean;
  /** 保留旧包属性，无视觉效果（主库 Column 无斑马纹） */
  striped?: boolean;
  paginated?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  /** 勾选变化（行在传入 rows 中的下标） */
  onSelectionChange?: (selected: number[]) => void;
  /** 受控选中（行在传入 rows 中的下标）；传入后以它为准，勾选只触发 onSelectionChange */
  selectedRows?: number[];
  /** 行点击：整行可点（悬停态 + 指针）；行内按钮 / 链接 / 开关 / 菜单 / 复选框不触发。row 为原始行数据，index 为其在 rows 中的下标 */
  onRowClick?: (row: any, index: number) => void;
  /** 行高，默认 32 */
  rowHeight?: TableRowHeight;
  variant?: TableVariant;
  /** 列宽布局：auto（默认，首次渲染按内容自动分配后冻结）\| fixed（有 width 的列按该宽度，无 width 的列平分剩余宽度，适合「固定列 + 弹性列」的页面级列表） */
  columnLayout?: 'auto' | 'fixed';
  /** 分组：返回行所属组名；组名变化处插入一条分组行（整行跨列，高 32，灰底）。行序由调用方保证已按组排好 */
  groupBy?: (row: any) => string | undefined;
  /** 分组行内容，默认「组名 + 该页该组行数」 */
  renderGroup?: (group: string, count: number) => ReactNode;
  /** 高亮行（如抽屉正在查看的行），浅蓝底 */
  activeRow?: (row: any, index: number) => boolean;
  /** 某行是否可点（默认都可点；占位行返回 false 则无指针、不触发 onRowClick） */
  rowClickable?: (row: any, index: number) => boolean;
}

/** 单元格内容：render / value / row 引用都没变时不重建（columns 与 rows 用稳定引用即可命中） */
const BodyCell = memo(function BodyCell({ render, value, row, index }: { render?: TableColumn['render']; value: any; row: any; index: number }) {
  return <>{render ? render(value, row, index) : <TextCell>{value}</TextCell>}</>;
});

const INTERACTIVE = 'button, a, input, label, select, textarea, [role=switch], [role=checkbox], [role=menu], [role=menuitem], [role=dialog]';

const cmpVal = (v: any) => (v && typeof v === 'object' ? (v.label ?? '') : v);

/** 单行文本；溢出时悬停显示完整内容 */
function TextCell({ children }: { children: ReactNode }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  return (
    <span className="wiz-table__textwrap">
      <span ref={ref} className="wiz-table__text"
        onMouseEnter={() => { const el = ref.current; if (el && el.scrollWidth > el.clientWidth + 1) setShow(true); }}
        onMouseLeave={() => setShow(false)}>{children}</span>
      {show && <span role="tooltip" className="wiz-table__pop">{children}</span>}
    </span>
  );
}

function FilterPopover({ values, selected, onChange, onClose }: { values: string[]; selected: Set<string>; onChange: (s: Set<string>) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: Event) => { if (ref.current && !ref.current.parentElement?.contains(e.target as Node)) onClose(); };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
  }, [onClose]);
  const toggle = (v: string) => { const n = new Set(selected); if (n.has(v)) n.delete(v); else n.add(v); onChange(n); };
  return (
    <div ref={ref} className="wiz-table__filter" role="dialog" aria-label="Filter">
      <button type="button" className="wiz-table__filter-clear" onClick={() => onChange(new Set())}>Clear filter</button>
      {values.map((v) => (
        <label key={v} className="wiz-table__filter-row">
          <Checkbox checked={selected.size === 0 || selected.has(v)} onChange={() => toggle(v)} aria-label={v} />
          <span className="wiz-table__filter-text">{v}</span>
        </label>
      ))}
    </div>
  );
}

export function Table({
  columns, rows, selectable = false, paginated = false, pageSize: initialPageSize = 5, pageSizeOptions = [5, 10, 20],
  onSelectionChange, selectedRows, onRowClick, rowHeight = 32, variant = 'default', groupBy, renderGroup, activeRow, rowClickable, columnLayout = 'auto', className, style, striped: _striped, ...rest
}: TableProps) {
  const [innerSel, setInnerSel] = useState<Set<number>>(() => new Set());
  const selected = useMemo(() => (selectedRows ? new Set(selectedRows) : innerSel), [selectedRows, innerSel]);
  const [sort, setSort] = useState<{ key: string | null; dir: 'asc' | 'desc' | null }>({ key: null, dir: null });
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [page, setPage] = useState(0);
  const [widths, setWidths] = useState<Record<string, number>>({});
  const headRefs = useRef<Record<string, HTMLTableCellElement | null>>({});
  const measured = Object.keys(widths).length > 0;

  const distinct = useMemo(() => {
    const m: Record<string, string[]> = {};
    columns.forEach((c) => {
      if (!c.filterable) return;
      const seen: string[] = [];
      rows.forEach((r) => { const v = String(cmpVal(r[c.key])); if (!seen.includes(v)) seen.push(v); });
      m[c.key] = seen;
    });
    return m;
  }, [columns, rows]);

  const viewRows = useMemo(() => {
    let out = rows.map((r, i) => ({ r, i }));
    Object.entries(filters).forEach(([key, set]) => { if (set.size > 0) out = out.filter(({ r }) => set.has(String(cmpVal(r[key])))); });
    if (sort.key && sort.dir) {
      const k = sort.key;
      out = [...out].sort((a, b) => {
        const av = cmpVal(a.r[k]); const bv = cmpVal(b.r[k]);
        const c = av < bv ? -1 : av > bv ? 1 : 0;
        return sort.dir === 'asc' ? c : -c;
      });
    }
    return out;
  }, [rows, filters, sort]);

  const cycleSort = (key: string) => setSort((s) => (s.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : { key: null, dir: null }));
  const commit = (next: Set<number>) => { if (!selectedRows) setInnerSel(next); onSelectionChange?.([...next]); };
  const allOn = viewRows.length > 0 && viewRows.every(({ i }) => selected.has(i));
  const toggleAll = () => commit(allOn ? new Set() : new Set(viewRows.map(({ i }) => i)));
  const toggle = (i: number) => { const n = new Set(selected); if (n.has(i)) n.delete(i); else n.add(i); commit(n); };

  useLayoutEffect(() => {
    if (measured || columnLayout === 'fixed') return;
    const init: Record<string, number> = {};
    columns.forEach((c) => { const el = headRefs.current[c.key]; if (el) init[c.key] = Math.round(el.getBoundingClientRect().width); });
    if (!Object.keys(init).length || Object.values(init).some((w) => w <= 0)) return;
    setWidths(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startResize = (key: string, e: MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX;
    const startW = widths[key] || headRefs.current[key]?.getBoundingClientRect().width || 120;
    const move = (ev: globalThis.MouseEvent) => setWidths((p) => ({ ...p, [key]: Math.max(64, startW + ev.clientX - startX) }));
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
  };

  const total = viewRows.length;
  const pageCount = paginated ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const curPage = Math.min(page, pageCount - 1);
  const pageRows = paginated ? viewRows.slice(curPage * pageSize, curPage * pageSize + pageSize) : viewRows;
  const rangeStart = total === 0 ? 0 : curPage * pageSize + 1;
  const rangeEnd = paginated ? Math.min(total, (curPage + 1) * pageSize) : total;

  return (
    <div className={cx('wiz-table', variant === 'plain' && 'wiz-table--plain', className)}
      style={{ ...(rowHeight !== 32 && ({ '--wiz-table-row-height': `${rowHeight}px` } as CSSProperties)), ...style }} {...rest}>
      <table className={cx('wiz-table__grid', (measured || columnLayout === 'fixed') && 'is-fixed')}>
        <colgroup>
          {selectable && <col className="wiz-table__col-sel" />}
          {columns.map((c) => <col key={c.key} style={{ width: widths[c.key] ?? (columnLayout === 'fixed' ? c.width : undefined) }} />)}
        </colgroup>
        <thead>
          <tr>
            {selectable && (
              <th className="wiz-table__th wiz-table__th--sel" scope="col">
                <Checkbox state={allOn ? 'checked' : selected.size ? 'indeterminate' : 'unchecked'} onChange={toggleAll} aria-label="Select all" />
              </th>
            )}
            {columns.map((c, ci) => (
              <th key={c.key} scope="col" className="wiz-table__th" ref={(el) => { headRefs.current[c.key] = el; }}
                style={{ width: widths[c.key] ?? c.width, textAlign: c.align }}
                aria-sort={sort.key === c.key ? (sort.dir === 'asc' ? 'ascending' : sort.dir === 'desc' ? 'descending' : 'none') : undefined}>
                <span className="wiz-table__th-inner">
                  <span className="wiz-table__th-text"><TextCell>{c.header}</TextCell></span>
                  {c.sortable && (
                    <CellIconButton icon={sort.key === c.key && sort.dir === 'asc' ? 'ri-sort-asc' : sort.key === c.key && sort.dir === 'desc' ? 'ri-sort-desc' : 'ri-arrow-up-down-line'}
                      label={`Sort ${typeof c.header === 'string' ? c.header : c.key}`} active={sort.key === c.key && !!sort.dir} onClick={() => cycleSort(c.key)} />
                  )}
                  {c.filterable && (
                    <span className="wiz-table__filter-wrap">
                      <CellIconButton icon="ri-filter-3-line" label={`Filter ${typeof c.header === 'string' ? c.header : c.key}`}
                        active={(filters[c.key]?.size ?? 0) > 0 && (filters[c.key]?.size ?? 0) < (distinct[c.key]?.length ?? 0)}
                        onClick={() => setOpenFilter(openFilter === c.key ? null : c.key)} />
                      {openFilter === c.key && (
                        <FilterPopover values={distinct[c.key] ?? []} selected={filters[c.key] ?? new Set()} onClose={() => setOpenFilter(null)}
                          onChange={(set) => setFilters((f) => ({ ...f, [c.key]: set }))} />
                      )}
                    </span>
                  )}
                </span>
                {variant === 'default' && ci < columns.length - 1 && (
                  <span className="wiz-table__resize" role="separator" aria-orientation="vertical" onMouseDown={(e) => startResize(c.key, e)}><span /></span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageRows.map(({ r: row, i: ri }, pi) => {
            const isSel = selectable && selected.has(ri);
            const clickable = !!onRowClick && (rowClickable ? rowClickable(row, ri) : true);
            const g = groupBy?.(row);
            const showGroup = g !== undefined && (pi === 0 || groupBy!(pageRows[pi - 1].r) !== g);
            const gCount = showGroup ? pageRows.filter((x) => groupBy!(x.r) === g).length : 0;
            return (
              <Fragment key={ri}>
                {showGroup && (
                  <tr className="wiz-table__group"><td colSpan={columns.length + (selectable ? 1 : 0)}>{renderGroup ? renderGroup(g!, gCount) : <>{g} <span className="wiz-table__group-n">{gCount}</span></>}</td></tr>
                )}
                <tr className={cx('wiz-table__row', isSel && 'is-selected', clickable && 'is-clickable', activeRow?.(row, ri) && 'is-active')}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={clickable ? (e: MouseEvent<HTMLTableRowElement>) => { if (!(e.target as HTMLElement).closest(INTERACTIVE)) onRowClick!(row, ri); } : undefined}
                  onKeyDown={clickable ? (e: ReactKeyboardEvent<HTMLTableRowElement>) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onRowClick!(row, ri); } } : undefined}>
                  {selectable && (
                    <td className="wiz-table__td wiz-table__td--sel"><Checkbox checked={selected.has(ri)} onChange={() => toggle(ri)} aria-label="Select row" /></td>
                  )}
                  {columns.map((c) => (
                    <td key={c.key} className="wiz-table__td" style={{ textAlign: c.align }}>
                      <BodyCell render={c.render} value={row[c.key]} row={row} index={ri} />
                    </td>
                  ))}
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
      {paginated && (
        <div className="wiz-table__pager">
          <span className="wiz-table__pager-size">
            Rows per page:
            <span className="wiz-table__pager-select">
              <Select size="small" value={String(pageSize)} options={pageSizeOptions.map(String)} aria-label="Rows per page"
                onChange={(v) => { setPageSize(Number(v)); setPage(0); }} />
            </span>
          </span>
          <span className="wiz-table__pager-range">{rangeStart}–{rangeEnd} of {total}</span>
          <span className="wiz-table__pager-btns">
            <Tooltip content="Previous page" nowrap><button type="button" className="wiz-col-iconbtn" aria-label="Previous page" disabled={curPage === 0} onClick={() => setPage(Math.max(0, curPage - 1))}><i className="ri-arrow-left-s-line" aria-hidden="true" /></button></Tooltip>
            <Tooltip content="Next page" nowrap><button type="button" className="wiz-col-iconbtn" aria-label="Next page" disabled={curPage >= pageCount - 1} onClick={() => setPage(Math.min(pageCount - 1, curPage + 1))}><i className="ri-arrow-right-s-line" aria-hidden="true" /></button></Tooltip>
          </span>
        </div>
      )}
    </div>
  );
}
