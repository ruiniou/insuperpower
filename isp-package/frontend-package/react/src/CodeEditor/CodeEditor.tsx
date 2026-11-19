import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../cx';
import './CodeEditor.css';

export interface CodeEditorProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  'aria-label'?: string;
  /** 最小高度（px，默认 320） */
  minHeight?: number;
  className?: string;
}

/** SAS 语法高亮：注释 / 字符串 / 关键字 / 宏 / 数字 */
const SYNTAX = /(\/\*.*?\*\/|\*[^;]*;)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b(?:proc|sql|quit|data|run|create|table|select|from|where|group|by|on|and|not|options|title\d*|footnote\d*|as|in)\b)|(%[a-zA-Z_0-9]+)|(\b\d+\b)/gi;

function highlight(line: string): ReactNode {
  const out: ReactNode[] = [];
  let start = 0;
  let m: RegExpExecArray | null;
  SYNTAX.lastIndex = 0;
  while ((m = SYNTAX.exec(line))) {
    if (m.index > start) out.push(line.slice(start, m.index));
    const kind = m[1] ? 'comment' : m[2] ? 'string' : m[3] ? 'keyword' : m[4] ? 'macro' : 'number';
    out.push(<span key={m.index} className={`wiz-code-${kind}`}>{m[0]}</span>);
    start = SYNTAX.lastIndex;
  }
  if (start < line.length) out.push(line.slice(start));
  return out.length ? out : ' ';
}

const lineAt = (text: string, offset: number) => text.slice(0, offset).split('\n').length;
const foldable = (line: string) => /^(proc\s|data\s|%|\/\*)/i.test(line.trim());

/** 代码编辑器：行号栏 + 高亮层 + 透明 textarea 叠放；Tab 插入 2 空格；点行号选中该行 */
export function CodeEditor({ value, defaultValue = '', onChange, readOnly = false, 'aria-label': ariaLabel = 'Code editor', minHeight = 320, className }: CodeEditorProps) {
  const [inner, setInner] = useState(defaultValue);
  const [activeLine, setActiveLine] = useState(1);
  const input = useRef<HTMLTextAreaElement>(null);
  const text = value ?? inner;
  const lines = text.split('\n');

  const change = (next: string) => { if (value === undefined) setInner(next); onChange?.(next); };
  const selectLine = (n: number) => {
    setActiveLine(n);
    if (!input.current || readOnly) return;
    const offset = lines.slice(0, n - 1).reduce((s, l) => s + l.length + 1, 0);
    input.current.focus();
    input.current.setSelectionRange(offset, offset);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab' || readOnly) return;
    e.preventDefault();
    const f = e.currentTarget;
    const { selectionStart: s, selectionEnd: en } = f;
    const next = text.slice(0, s) + '  ' + text.slice(en);
    change(next);
    requestAnimationFrame(() => { f.setSelectionRange(s + 2, s + 2); setActiveLine(lineAt(next, s + 2)); });
  };

  return (
    <div className={cx('wiz-code-editor', className)} style={{ minHeight }} aria-label={ariaLabel}>
      <div className="wiz-code-editor__scroll">
        <div className="wiz-code-editor__surface" style={{ ['--wiz-code-lines' as string]: Math.max(lines.length, 1) }}>
          <div className="wiz-code-gutter" aria-hidden="true">
            {lines.map((line, i) => (
              <button key={i} type="button" tabIndex={-1} className={cx(activeLine === i + 1 && 'is-active', foldable(line) && 'is-foldable')} onClick={() => selectLine(i + 1)}>
                <span className="wiz-code-gutter__num">{i + 1}</span>
                <span className="wiz-code-gutter__fold">{foldable(line) && <i className="ri-arrow-down-s-line" />}</span>
              </button>
            ))}
          </div>
          <div className="wiz-code-content">
            <pre className="wiz-code-highlight" aria-hidden="true">
              {lines.map((line, i) => <div key={i} className={activeLine === i + 1 ? 'is-active' : undefined}><code>{highlight(line)}</code></div>)}
            </pre>
            <textarea ref={input} value={text} readOnly={readOnly} aria-label={ariaLabel} spellCheck={false} wrap="off"
              autoCapitalize="off" autoComplete="off" autoCorrect="off"
              onChange={(e) => change(e.target.value)} onSelect={(e) => setActiveLine(lineAt(e.currentTarget.value, e.currentTarget.selectionStart))} onKeyDown={onKeyDown} />
          </div>
        </div>
      </div>
    </div>
  );
}
