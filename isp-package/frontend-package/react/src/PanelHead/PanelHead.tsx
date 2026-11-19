import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import { Tooltip } from '../Tooltip/Tooltip';
import './PanelHead.css';

export interface PanelHeadProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 面板类型图标（ri 类名）；文件名等放进 iconLabel，悬停显示 */
  icon?: string;
  iconLabel?: string;
  /** 最左的附加控件，如 Outline 收起后的展开按钮 */
  leading?: ReactNode;
  /** 标题（单行省略）；内容本身已说明用途的面板可不传 */
  title?: ReactNode;
  /** 紧跟其后的中性小字，如进度、确认状态；空则不显示 */
  meta?: ReactNode;
  /** 右侧：面板自己的操作 */
  actions?: ReactNode;
  /** 第二行：仅有一排编辑工具的面板使用 */
  toolbar?: ReactNode;
}

/** 面板 Head：高 48，内边距 0 16，左图标 / 标题 / 状态文字，右操作区，可选第二行工具条 */
export function PanelHead({ icon, iconLabel, leading, title, meta, actions, toolbar, className, ...rest }: PanelHeadProps) {
  const ic = icon && <i className={cx('wiz-panelhead__icon', icon)} role={iconLabel ? 'img' : undefined} aria-label={iconLabel} aria-hidden={iconLabel ? undefined : true} />;
  return (
    <div className={cx('wiz-panelhead', className)} {...rest}>
      <div className="wiz-panelhead__row">
        {leading}
        {ic && (iconLabel ? <Tooltip content={iconLabel} direction="bottom">{ic}</Tooltip> : ic)}
        {title != null && <span className="wiz-panelhead__title">{title}</span>}
        {meta != null && meta !== false && <span className="wiz-panelhead__meta">{meta}</span>}
        {actions && <span className="wiz-panelhead__actions">{actions}</span>}
      </div>
      {toolbar && <div className="wiz-panelhead__toolbar">{toolbar}</div>}
    </div>
  );
}
