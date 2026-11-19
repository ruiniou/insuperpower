import { useState, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../cx';
import './AddOn.css';

export interface AddOnProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 标题（Subtitle 2） */
  title: ReactNode;
  /** 标题右侧计数，如 1/3 */
  count?: ReactNode;
  /** 右侧转圈（进行中） */
  loading?: boolean;
  /** 头部右侧操作区（点击不触发展开收起），如 Reject / Accept */
  actions?: ReactNode;
  /** 受控展开；不传则内部自管（配合 defaultExpanded） */
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** 展开后列表最大高度（px），超出纵向滚动；默认 140 */
  maxBodyHeight?: number;
  /** 叠在 Add-on 下方的输入框（通常是 <PromptInput />）；传入后与外壳叠放，间距 -16 */
  input?: ReactNode;
  /** 展开后的内容 */
  children?: ReactNode;
}

/** 输入框上方的 Add-on 外壳：顶部圆角条，头部可展开收起。Pending Changes / Metadata Changes / Event Progress 均基于它。 */
export function AddOn({
  title, count, loading = false, actions, expanded: expandedProp, defaultExpanded = false, onExpandedChange,
  maxBodyHeight = 140, input, children, className, ...rest
}: AddOnProps) {
  const [inner, setInner] = useState(defaultExpanded);
  const expanded = expandedProp ?? inner;
  const toggle = () => {
    if (expandedProp === undefined) setInner(!expanded);
    onExpandedChange?.(!expanded);
  };
  const hasBody = children != null && children !== false;
  return (
    <div {...rest} className={cx('wiz-addon', input == null && 'wiz-addon--standalone', className)}>
      <div className="wiz-addon__strip">
        <div className="wiz-addon__header" onClick={toggle}>
          <button type="button" className="wiz-addon__toggle" aria-expanded={expanded}>
            <i className={expanded ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'} aria-hidden="true" />
            <span className="wiz-addon__title">{title}</span>
          </button>
          {count != null && <span className="wiz-addon__count">{count}</span>}
          {loading && <i className="ri-loader-4-line wiz-addon__spinner" aria-label="In progress" />}
          {actions != null && <span className="wiz-addon__actions" onClick={(e) => e.stopPropagation()}>{actions}</span>}
        </div>
        {expanded && hasBody && (
          <div className="wiz-addon__body" style={{ maxHeight: maxBodyHeight }}>{children}</div>
        )}
      </div>
      {input != null && <div className="wiz-addon__input">{input}</div>}
    </div>
  );
}
