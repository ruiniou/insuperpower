import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode, type AnchorHTMLAttributes, type TableHTMLAttributes } from 'react';
import { cx } from '../cx';
import { tokenizeSas } from './highlightSas';
import type { CalloutType } from './remarkAlerts';
import './Markdown.css';

/* ---------- Heading：H1–H6 同一个样式（14 / 600 / 下边距 8） ---------- */
export interface MarkdownHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** 语义层级，仅影响标签，不影响样式 */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}
export function MarkdownHeading({ level = 1, className, ...rest }: MarkdownHeadingProps) {
  const Tag = `h${level}` as 'h1';
  return <Tag {...rest} className={cx('wiz-md-heading', className)} />;
}

/* ---------- Link ---------- */
export type MarkdownLinkState = 'default' | 'hover' | 'focus' | 'visited';
export interface MarkdownLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** 仅用于预览强制显示某一状态；实际使用交给浏览器伪类 */
  state?: MarkdownLinkState;
}
export function MarkdownLink({ state, className, href, ...rest }: MarkdownLinkProps) {
  const external = !!href && /^https?:\/\//i.test(href);
  return (
    <a
      {...rest}
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={cx('wiz-md-link', state && `wiz-md-link--${state}`, className)}
    />
  );
}

/* ---------- Inline code ---------- */
export function MarkdownInlineCode({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <code {...rest} className={cx('wiz-md-inline-code', className)} />;
}

/* ---------- Callout ---------- */
const CALLOUT: Record<CalloutType, { title: string; icon: string }> = {
  note: { title: 'Note', icon: 'ri-information-line' },
  tip: { title: 'Tip', icon: 'ri-check-line' },
  warning: { title: 'Warning', icon: 'ri-alert-line' },
  caution: { title: 'Caution', icon: 'ri-close-circle-line' },
};
export interface MarkdownCalloutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  type?: CalloutType;
  /** 标题，默认为类型名 */
  title?: string;
}
export function MarkdownCallout({ type = 'note', title, className, children, ...rest }: MarkdownCalloutProps) {
  const cfg = CALLOUT[type];
  return (
    <div {...rest} role="note" className={cx('wiz-md-callout', `wiz-md-callout--${type}`, className)}>
      <div className="wiz-md-callout__header">
        <i className={cx(cfg.icon, 'wiz-md-callout__icon')} aria-hidden="true" />
        <span className="wiz-md-callout__title">{title ?? cfg.title}</span>
      </div>
      <div className="wiz-md-callout__body">{children}</div>
    </div>
  );
}

/* ---------- Blockquote ---------- */
export interface MarkdownBlockquoteProps extends HTMLAttributes<HTMLQuoteElement> {
  /** 出处，显示在引用下方 */
  attribution?: string;
}
export function MarkdownBlockquote({ attribution, className, children, ...rest }: MarkdownBlockquoteProps) {
  return (
    <blockquote {...rest} className={cx('wiz-md-blockquote', className)}>
      {children}
      {attribution && <span className="wiz-md-blockquote__attribution">{attribution}</span>}
    </blockquote>
  );
}

/* ---------- Divider ---------- */
export function MarkdownDivider({ className, ...rest }: HTMLAttributes<HTMLHRElement>) {
  return <hr {...rest} className={cx('wiz-md-divider', className)} />;
}

/* ---------- Task item ---------- */
export interface MarkdownTaskItemProps extends HTMLAttributes<HTMLLIElement> {
  checked?: boolean;
}
export function MarkdownTaskItem({ checked = false, className, children, ...rest }: MarkdownTaskItemProps) {
  return (
    <li {...rest} className={cx('wiz-md-task', checked && 'wiz-md-task--checked', className)}>
      <MarkdownCheckbox checked={checked} />
      <span className="wiz-md-task__text">{children}</span>
    </li>
  );
}
export function MarkdownCheckbox({ checked }: { checked: boolean }) {
  return (
    <span className="wiz-md-task__slot">
      <span role="checkbox" aria-checked={checked} aria-disabled="true" className={cx('wiz-md-checkbox', checked && 'wiz-md-checkbox--checked')}>
        {checked && <i className="ri-check-line" aria-hidden="true" />}
      </span>
    </span>
  );
}

/* ---------- Table ---------- */
export function MarkdownTable({ className, children, ...rest }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="wiz-md-table">
      <table {...rest} className={className}>{children}</table>
    </div>
  );
}

/* ---------- Code block ---------- */
const LANG: Record<string, string> = {
  sas: 'SAS', tsx: 'TSX', ts: 'TypeScript', typescript: 'TypeScript', jsx: 'JSX', js: 'JavaScript', javascript: 'JavaScript',
  python: 'Python', py: 'Python', r: 'R', sql: 'SQL', markdown: 'Markdown', md: 'Markdown', json: 'JSON', html: 'HTML',
  css: 'CSS', bash: 'Bash', sh: 'Shell', yaml: 'YAML', yml: 'YAML', xml: 'XML',
};
export const getLanguageLabel = (lang?: string) => {
  const l = lang?.trim();
  return l ? LANG[l.toLowerCase()] ?? l.toUpperCase() : 'Code';
};
export type MarkdownCopyState = 'default' | 'copied';
export interface MarkdownCodeBlockProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  code: string;
  language?: string;
  /** 显示头部（语言名 + Copy），默认 true */
  showHeader?: boolean;
  /** 受控复制状态；不传则点击后内部切到 copied 1.5 秒 */
  copyState?: MarkdownCopyState;
}
export function MarkdownCodeBlock({ code, language, showHeader = true, copyState, className, ...rest }: MarkdownCodeBlockProps) {
  const [inner, setInner] = useState<MarkdownCopyState>('default');
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const cur = copyState ?? inner;
  const copy = async () => {
    try { await navigator.clipboard?.writeText(code); } catch { /* 无剪贴板权限时仍给出反馈 */ }
    setInner('copied');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setInner('default'), 1500);
  };
  const isSas = language?.trim().toLowerCase() === 'sas';
  return (
    <div {...rest} className={cx('wiz-md-code', className)}>
      {showHeader && (
        <div className="wiz-md-code__header">
          <span className="wiz-md-code__lang">{getLanguageLabel(language)}</span>
          <button type="button" className={cx('wiz-md-code__copy', cur === 'copied' && 'wiz-md-code__copy--copied')} onClick={copy}>
            <i className={cur === 'copied' ? 'ri-checkbox-circle-line' : 'ri-file-copy-line'} aria-hidden="true" />
            <span>{cur === 'copied' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      )}
      <pre className="wiz-md-code__body"><code>
        {isSas
          ? tokenizeSas(code).map((t, i) => (t.type ? <span key={i} className={`wiz-md-tok wiz-md-tok--${t.type}`}>{t.text}</span> : t.text))
          : code}
      </code></pre>
    </div>
  );
}

/* ---------- Image ---------- */
export type MarkdownImageState = 'loaded' | 'loading' | 'error';
export interface MarkdownImageProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'title'> {
  src?: string;
  alt?: string;
  /** 图注 */
  caption?: string;
  /** 仅用于预览强制显示某一状态；不传则按图片真实加载结果切换 */
  state?: MarkdownImageState;
}
export function MarkdownImage({ src, alt, caption, state, className, ...rest }: MarkdownImageProps) {
  const [auto, setAuto] = useState<MarkdownImageState>('loading');
  const cur = state ?? (src ? auto : 'error');
  return (
    <span {...rest} className={cx('wiz-md-image', className)}>
      {cur !== 'loaded' && (
        <span className="wiz-md-image__placeholder" role={cur === 'error' ? 'img' : undefined} aria-label={cur === 'error' ? alt || 'Image could not be loaded' : undefined}>
          <i className="ri-image-line" aria-hidden="true" />
          <span>{cur === 'error' ? 'Image could not be loaded' : 'Loading image…'}</span>
        </span>
      )}
      {src && state === undefined && cur !== 'error' && (
        <img className="wiz-md-image__img" src={src} alt={alt ?? ''} hidden={cur === 'loading'} onLoad={() => setAuto('loaded')} onError={() => setAuto('error')} />
      )}
      {src && state === 'loaded' && <img className="wiz-md-image__img" src={src} alt={alt ?? ''} />}
      {caption && <span className="wiz-md-image__caption">{caption}</span>}
    </span>
  );
}

/* ---------- Citation / Footnote ---------- */
export interface MarkdownCitationProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  state?: 'default' | 'hover' | 'focus';
}
export function MarkdownCitation({ state, className, children, ...rest }: MarkdownCitationProps) {
  return <a {...rest} className={cx('wiz-md-citation', state && `wiz-md-citation--${state}`, className)}>{children}</a>;
}
export interface MarkdownFootnoteProps extends HTMLAttributes<HTMLDivElement> {
  number: ReactNode;
}
export function MarkdownFootnote({ number, className, children, ...rest }: MarkdownFootnoteProps) {
  return (
    <div {...rest} className={cx('wiz-md-footnote', className)}>
      <span className="wiz-md-footnote__no">{number}</span>
      <span className="wiz-md-footnote__text">{children}</span>
    </div>
  );
}
