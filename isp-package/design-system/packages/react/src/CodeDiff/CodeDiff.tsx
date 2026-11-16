import { useState, type HTMLAttributes } from 'react';
import { cx } from '../cx';
import './CodeDiff.css';

/** Figma 变体属性 State */
export type CodeDiffState = 'collapsed' | 'expanded';

export interface CodeDiffLine {
  /** add 新增行；del 删除行 */
  type: 'add' | 'del';
  /** 行号 */
  line: number;
  text: string;
}

export interface CodeDiffProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onToggle'> {
  /** 受控展开状态；不传则内部自管，初始 collapsed */
  state?: CodeDiffState;
  /** 头部标题，默认 Edited code */
  title?: string;
  /** 代码行；按 Figma 约定删除行在前、新增行在后，调用方负责排序 */
  lines: CodeDiffLine[];
  /** 新增 / 删除计数，默认按 lines 统计 */
  addedCount?: number;
  removedCount?: number;
  onToggle?: (next: CodeDiffState) => void;
}

export function CodeDiff({ state, title = 'Edited code', lines, addedCount, removedCount, onToggle, className, ...rest }: CodeDiffProps) {
  const [inner, setInner] = useState<CodeDiffState>('collapsed');
  const cur = state ?? inner;
  const expanded = cur === 'expanded';
  const added = addedCount ?? lines.filter((l) => l.type === 'add').length;
  const removed = removedCount ?? lines.filter((l) => l.type === 'del').length;
  const toggle = () => {
    const next: CodeDiffState = expanded ? 'collapsed' : 'expanded';
    if (state === undefined) setInner(next);
    onToggle?.(next);
  };
  return (
    <div {...rest} className={cx('wiz-code-diff', `wiz-code-diff--${cur}`, className)}>
      <button type="button" className="wiz-code-diff__header" aria-expanded={expanded} onClick={toggle}>
        <i className="ri-code-line wiz-code-diff__icon" aria-hidden="true" />
        <span className="wiz-code-diff__title">{title}</span>
        <span className="wiz-code-diff__counts">
          <span className="wiz-code-diff__add">+{added}</span>
          <span className="wiz-code-diff__del">-{removed}</span>
        </span>
        <span className="wiz-code-diff__spacer" />
        <i className="ri-arrow-right-s-line wiz-code-diff__chevron" aria-hidden="true" />
      </button>
      {expanded && (
        <div className="wiz-code-diff__lines">
          {lines.map((l, i) => (
            <div key={i} className={cx('wiz-code-diff__line', `wiz-code-diff__line--${l.type}`)}>
              <span className="wiz-code-diff__sign">{l.type === 'add' ? '+' : '−'}</span>
              <span className="wiz-code-diff__no">{l.line}</span>
              <span className="wiz-code-diff__code">{l.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
