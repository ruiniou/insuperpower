import type { HTMLAttributes } from 'react';
import { cx } from '../cx';
import './AIAskUserResult.css';

/** Figma 变体属性 State */
export type AIAskUserResultState = 'answered' | 'skipped';

export interface AIAskUserResultPair { question: string; answer: string }

export interface AIAskUserResultProps extends HTMLAttributes<HTMLDivElement> {
  state?: AIAskUserResultState;
  /** state=answered 时的问答对 */
  pairs?: AIAskUserResultPair[];
  /** state=skipped 时的文字，默认 Skipped question */
  skippedText?: string;
}

export function AIAskUserResult({ state = 'answered', pairs = [], skippedText = 'Skipped question', className, ...rest }: AIAskUserResultProps) {
  return (
    <div {...rest} className={cx('wiz-ai-ask-user-result', `wiz-ai-ask-user-result--${state}`, className)}>
      {state === 'skipped' ? (
        <p>{skippedText}</p>
      ) : (
        pairs.map((p, i) => (
          <div className="wiz-ai-ask-user-result__pair" key={i}>
            <p>Q: {p.question}</p>
            <p>A: {p.answer}</p>
          </div>
        ))
      )}
    </div>
  );
}
