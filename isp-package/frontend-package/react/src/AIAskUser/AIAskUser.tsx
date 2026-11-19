import type { HTMLAttributes } from 'react';
import { cx } from '../cx';
import { AIAskOption } from '../AIAskOption/AIAskOption';
import { Button } from '../Button/Button';
import './AIAskUser.css';

/** Figma 变体属性 State、Step */
export type AIAskUserState = 'none' | 'option-selected' | 'custom-selected';
export type AIAskUserStep = '1 of 2' | '2 of 2';

export interface AIAskUserProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  state?: AIAskUserState;
  step?: AIAskUserStep;
  /** 头部标题，默认 Questions */
  title?: string;
  /** 问题文字 */
  question: string;
  /** 选项文字，字母徽标按 A、B、C… 自动生成；自定义输入项固定排在最后 */
  options: string[];
  /** state=option-selected 时选中的选项下标，默认 0 */
  selectedIndex?: number;
  /** 自定义输入项占位文字，默认 Or, describe your needs… */
  customPlaceholder?: string;
  onPrev?: () => void;
  onNext?: () => void;
  onSelectOption?: (index: number) => void;
  onSelectCustom?: () => void;
  onSkip?: () => void;
  /** 主按钮回调：step=1 of 2 时为 Continue，2 of 2 时为 Submit */
  onConfirm?: () => void;
}

const letter = (i: number) => String.fromCharCode(65 + i);

export function AIAskUser({
  state = 'none', step = '1 of 2', title = 'Questions', question, options, selectedIndex = 0,
  customPlaceholder, onPrev, onNext, onSelectOption, onSelectCustom, onSkip, onConfirm, className, ...rest
}: AIAskUserProps) {
  const [cur, total] = step.split(' of ');
  const isLast = cur === total;
  return (
    <div {...rest} className={cx('wiz-ai-ask-user', className)}>
      <div className="wiz-ai-ask-user__header">
        <span className="wiz-ai-ask-user__title"><i className="ri-question-line" aria-hidden="true" />{title}</span>
        <span className="wiz-ai-ask-user__pager">
          <button type="button" className="wiz-ai-ask-user__nav" aria-label="Previous" onClick={onPrev}><i className="ri-arrow-left-s-line" /></button>
          <span className="wiz-ai-ask-user__count">{cur} / {total}</span>
          <button type="button" className="wiz-ai-ask-user__nav" aria-label="Next" onClick={onNext}><i className="ri-arrow-right-s-line" /></button>
        </span>
      </div>
      <div className="wiz-ai-ask-user__body">
        <p className="wiz-ai-ask-user__question">{question}</p>
        <div className="wiz-ai-ask-user__options" role="listbox">
          {options.map((o, i) => (
            <AIAskOption
              key={i}
              letter={letter(i)}
              state={state === 'option-selected' && i === selectedIndex ? 'selected' : 'default'}
              onClick={() => onSelectOption?.(i)}
            >{o}</AIAskOption>
          ))}
          <AIAskOption
            type="custom"
            letter={letter(options.length)}
            state={state === 'custom-selected' ? 'selected' : 'default'}
            onClick={onSelectCustom}
          >{customPlaceholder}</AIAskOption>
        </div>
      </div>
      <div className="wiz-ai-ask-user__footer">
        <Button variant="secondary" size="small" onClick={onSkip}>Skip</Button>
        <Button variant="primary" size="small" status={state === 'none' ? 'disable' : 'default'} onClick={onConfirm}>
          {isLast ? 'Submit' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
