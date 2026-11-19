import type { HTMLAttributes } from 'react';
import { cx } from '../cx';
import { Markdown } from '../markdown/Markdown';
import './PureText.css';

export interface PureTextProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** AI 回复的 Markdown 源文本（渲染复用 Markdown） */
  children: string;
}

/** AI 纯文本回复：无内边距，文字与同流中卡片的左边缘对齐；正文 13px */
export function PureText({ children, className, ...rest }: PureTextProps) {
  return (
    <div {...rest} className={cx('wiz-pure-text', className)}>
      <Markdown>{children}</Markdown>
    </div>
  );
}
