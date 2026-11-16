import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import './AIRiskSummary.css';

export interface AIRiskSummaryItem {
  /** attention 需要关注（黄色警示图标）；reference 仅供参考（灰色信息图标） */
  level: 'attention' | 'reference';
  title: string;
  /** 第二行：可能的影响或依据 */
  detail?: string;
}

export interface AIRiskSummaryProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 头部标题，默认 Risk Summary */
  title?: string;
  items: AIRiskSummaryItem[];
  /** 自定义文字渲染（如高亮行内代码） */
  renderText?: (text: string) => ReactNode;
}

export function AIRiskSummary({ title = 'Risk Summary', items, renderText, className, ...rest }: AIRiskSummaryProps) {
  const t = (s: string) => (renderText ? renderText(s) : s);
  return (
    <div {...rest} className={cx('wiz-risk', className)}>
      <div className="wiz-risk__header">
        <i className="ri-alert-line wiz-risk__icon wiz-risk__icon--attention" aria-hidden="true" />
        <span className="wiz-risk__title">{title}</span>
        <span className="wiz-risk__count">{items.length}</span>
      </div>
      <ul className="wiz-risk__list">
        {items.map((it, i) => (
          <li key={i} className="wiz-risk__item">
            <span className="wiz-risk__slot">
              <i className={cx('wiz-risk__icon', it.level === 'attention' ? 'ri-alert-line wiz-risk__icon--attention' : 'ri-information-line wiz-risk__icon--reference')} aria-hidden="true" />
            </span>
            <span className="wiz-risk__text">
              <span className="wiz-risk__item-title">{t(it.title)}</span>
              {it.detail && <span className="wiz-risk__detail">{t(it.detail)}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
