import { useState, type HTMLAttributes } from 'react';
import { cx } from '../cx';
import './AIToolCall.css';

/** Figma 变体属性 State；hover 仅用于预览（真实悬停同效） */
export type AIToolCallState = 'collapsed' | 'hover' | 'expanded';

export interface AIToolCallProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onToggle'> {
  /** 受控状态；不传则内部自管，初始 collapsed */
  state?: AIToolCallState;
  /** 工具名，默认 Tool name */
  toolName?: string;
  /** 参数，每项一行（等宽字体） */
  args?: string[];
  /** 结果，每项一行 */
  result?: string[];
  onToggle?: (next: 'collapsed' | 'expanded') => void;
}

function Block({ label, lines }: { label: string; lines: string[] }) {
  return (
    <div className="wiz-tool-call__section">
      <span className="wiz-tool-call__label">{label}</span>
      <div className="wiz-tool-call__code">
        {lines.map((l, i) => <div key={i} className="wiz-tool-call__line">{l}</div>)}
      </div>
    </div>
  );
}

export function AIToolCall({
  state, toolName = 'Tool name', args = ['code area', 'proc format;'], result = ['Result detail'], onToggle, className, ...rest
}: AIToolCallProps) {
  const [inner, setInner] = useState<'collapsed' | 'expanded'>('collapsed');
  const cur = state ?? inner;
  const expanded = cur === 'expanded';
  const toggle = () => {
    const next = expanded ? 'collapsed' : 'expanded';
    if (state === undefined) setInner(next);
    onToggle?.(next);
  };
  return (
    <div {...rest} className={cx('wiz-tool-call', `wiz-tool-call--${cur}`, className)}>
      <button type="button" className="wiz-tool-call__header" aria-expanded={expanded} onClick={toggle}>
        <i className={cx('wiz-tool-call__icon', expanded ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line')} aria-hidden="true" />
        <i className="ri-tools-line wiz-tool-call__icon" aria-hidden="true" />
        <span className="wiz-tool-call__name">{toolName}</span>
      </button>
      {expanded && (
        <div className="wiz-tool-call__details">
          <Block label="Arguments" lines={args} />
          <Block label="Result" lines={result} />
        </div>
      )}
    </div>
  );
}
