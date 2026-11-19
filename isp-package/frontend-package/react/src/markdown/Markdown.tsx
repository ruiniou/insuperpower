import { isValidElement, type HTMLAttributes, type ReactNode } from 'react';
import ReactMarkdown, { type Components, type ExtraProps } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cx } from '../cx';
import { remarkAlerts, type CalloutType } from './remarkAlerts';
import {
  MarkdownBlockquote, MarkdownCallout, MarkdownCheckbox, MarkdownCitation, MarkdownCodeBlock, MarkdownDivider,
  MarkdownHeading, MarkdownImage, MarkdownInlineCode, MarkdownLink, MarkdownTable,
} from './elements';
import './Markdown.css';

const textOf = (n: ReactNode): string =>
  typeof n === 'string' || typeof n === 'number' ? String(n)
    : Array.isArray(n) ? n.map(textOf).join('')
    : isValidElement(n) ? textOf((n.props as { children?: ReactNode }).children) : '';

const heading = (level: 1 | 2 | 3 | 4 | 5 | 6) =>
  function H({ node: _n, className, ...p }: HTMLAttributes<HTMLHeadingElement> & ExtraProps) {
    // remark-gfm 脚注区自带的 sr-only 标题保持视觉隐藏
    if (className?.includes('sr-only')) return <h2 {...p} className="wiz-md-sr-only" />;
    return <MarkdownHeading level={level} {...p} />;
  };

const components: Components = {
  h1: heading(1), h2: heading(2), h3: heading(3), h4: heading(4), h5: heading(5), h6: heading(6),
  p: ({ node: _n, ...p }) => <p {...p} className="wiz-md-p" />,
  strong: ({ node: _n, ...p }) => <strong {...p} className="wiz-md-strong" />,
  em: ({ node: _n, ...p }) => <em {...p} className="wiz-md-em" />,
  del: ({ node: _n, ...p }) => <del {...p} className="wiz-md-del" />,
  a: ({ node: _n, ...p }) => {
    const raw = p as Record<string, unknown>;
    if (raw['data-footnote-ref'] !== undefined) return <MarkdownCitation {...p} />;
    if (raw['data-footnote-backref'] !== undefined) return null;
    return <MarkdownLink {...p} />;
  },
  sup: ({ node: _n, ...p }) => <sup {...p} className="wiz-md-sup" />,
  code: ({ node: _n, ...p }) => <MarkdownInlineCode {...p} />,
  pre: ({ node: _n, children }) => {
    const child = Array.isArray(children) ? children[0] : children;
    const props = isValidElement(child) ? (child.props as { className?: string; children?: ReactNode }) : {};
    const lang = /language-([^\s]+)/.exec(props.className ?? '')?.[1];
    return <MarkdownCodeBlock code={textOf(props.children).replace(/\n$/, '')} language={lang} />;
  },
  ul: ({ node: _n, className, ...p }) => <ul {...p} className={cx('wiz-md-list', className?.includes('contains-task-list') && 'wiz-md-list--task')} />,
  ol: ({ node: _n, ...p }) => <ol {...p} className="wiz-md-list wiz-md-list--ordered" />,
  li: ({ node: _n, className, children, ...p }) => {
    if (className?.includes('task-list-item')) {
      const kids = Array.isArray(children) ? children : [children];
      const box = kids.find((k) => isValidElement(k) && (k.props as { type?: string }).type === 'checkbox');
      const checked = !!(box && (box.props as { checked?: boolean }).checked);
      return <li {...p} className={cx('wiz-md-task', checked && 'wiz-md-task--checked')}>{kids}</li>;
    }
    return <li {...p} className="wiz-md-li">{children}</li>;
  },
  input: ({ node: _n, type, checked }) => (type === 'checkbox' ? <MarkdownCheckbox checked={!!checked} /> : null),
  blockquote: ({ node: _n, ...p }) => <MarkdownBlockquote {...p} />,
  div: ({ node: _n, ...p }) => {
    const t = (p as Record<string, unknown>)['data-callout'] as CalloutType | undefined;
    if (t) { const { ['data-callout']: _c, ...rest } = p as Record<string, unknown>; return <MarkdownCallout type={t} {...rest} />; }
    return <div {...p} />;
  },
  hr: () => <MarkdownDivider />,
  table: ({ node: _n, ...p }) => <MarkdownTable {...p} />,
  section: ({ node: _n, className, ...p }) =>
    (p as Record<string, unknown>)['data-footnotes'] !== undefined
      ? <section {...p} className="wiz-md-footnotes" />
      : <section {...p} className={className} />,
  img: ({ node: _n, src, alt, title }) => <MarkdownImage src={typeof src === 'string' ? src : undefined} alt={alt} caption={title} />,
};

export interface MarkdownProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Markdown 源文本。原始 HTML 不会被渲染 */
  children: string;
}

/** 把 Markdown 字符串渲染为 Wiz 样式内容（GFM、GFM Alert 形式的 Callout、脚注、任务列表） */
export function Markdown({ children, className, ...rest }: MarkdownProps) {
  return (
    <div {...rest} className={cx('wiz-md', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkAlerts]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
