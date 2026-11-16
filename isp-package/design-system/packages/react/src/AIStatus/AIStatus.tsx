import type { HTMLAttributes } from 'react';
import { cx } from '../cx';
import './AIStatus.css';

/** Figma 变体：Type=Text 时 Property 1 为 High/Medium/Low；Type=Number 时为 >90% / 80%-90% / 70%-80% */
export type AIStatusTextLevel = 'high' | 'medium' | 'low';
export type AIStatusNumberLevel = '>90%' | '80%-90%' | '70%-80%';

type Base = Omit<HTMLAttributes<HTMLSpanElement>, 'children'>;
export type AIStatusProps =
  | (Base & { type: 'text'; level: AIStatusTextLevel })
  | (Base & { type: 'number'; level: AIStatusNumberLevel; /** 显示的数值，默认 90%/85%/75% */ value?: string });

const TONE = { high: 'high', medium: 'medium', low: 'low', '>90%': 'high', '80%-90%': 'medium', '70%-80%': 'low' } as const;
const FILLED = { high: 3, medium: 2, low: 1 } as const;
const LABEL = { high: 'High', medium: 'Medium', low: 'Low' } as const;
const DEFAULT_VALUE = { '>90%': '90%', '80%-90%': '85%', '70%-80%': '75%' } as const;

export function AIStatus(props: AIStatusProps) {
  const tone = TONE[props.level];
  if (props.type === 'number') {
    const { type: _t, level, value, className, ...rest } = props;
    return (
      <span {...rest} className={cx('wiz-ai-status', 'wiz-ai-status--number', `wiz-ai-status--${tone}`, className)}>
        {value ?? DEFAULT_VALUE[level]}
      </span>
    );
  }
  const { type: _t, level, className, ...rest } = props;
  const filled = FILLED[level as AIStatusTextLevel];
  return (
    <span {...rest} className={cx('wiz-ai-status', 'wiz-ai-status--text', `wiz-ai-status--${tone}`, className)}>
      <span className="wiz-ai-status__bars" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span key={i} className={cx('wiz-ai-status__bar', i <= filled && 'is-filled')} />
        ))}
      </span>
      <span className="wiz-ai-status__label">{LABEL[level as AIStatusTextLevel]}</span>
    </span>
  );
}
