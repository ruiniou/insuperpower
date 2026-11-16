import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import './AIAskOption.css';

/** Figma 变体属性 State、Type */
export type AIAskOptionState = 'default' | 'hover' | 'selected';
export type AIAskOptionType = 'selection' | 'custom';

export interface AIAskOptionProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onSelect'> {
  state?: AIAskOptionState;
  type?: AIAskOptionType;
  /** 字母徽标，如 A */
  letter: string;
  /** 选项文字；type=custom 时作为占位提示（默认 Or, describe your needs…） */
  children?: ReactNode;
}

export function AIAskOption({ state = 'default', type = 'selection', letter, children, className, ...rest }: AIAskOptionProps) {
  const custom = type === 'custom';
  return (
    <div
      {...rest}
      role="option"
      aria-selected={state === 'selected'}
      className={cx('wiz-ai-ask-option', `wiz-ai-ask-option--${state}`, custom && 'wiz-ai-ask-option--custom', className)}
    >
      <span className="wiz-ai-ask-option__letter">{letter}</span>
      <p className="wiz-ai-ask-option__text">{children ?? (custom ? 'Or, describe your needs…' : 'Option')}</p>
    </div>
  );
}
