import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import { Logo } from '../Logo/Logo';
import './TopNav.css';

/** 主库 Top Nav 14:2349：Mac-ProjectSelector（左侧三色圆点）/ Win-ProjectSelector（右侧最小化、最大化、关闭） */
export type TopNavPlatform = 'mac' | 'win';

export interface TopNavProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  platform?: TopNavPlatform;
  /** 左侧 Logo；默认 With Name 的 Logo */
  logo?: ReactNode;
  /** 项目选择器文字 */
  project?: ReactNode;
  /** 点击项目选择器 */
  onProjectClick?: () => void;
  /** 右侧自定义区（项目选择器与窗口控件之间） */
  actions?: ReactNode;
  /** Win 窗口控件回调 */
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
}

export function TopNav({ platform = 'mac', logo, project, onProjectClick, actions, onMinimize, onMaximize, onClose, className, ...rest }: TopNavProps) {
  return (
    <header className={cx('wiz-topnav', `wiz-topnav--${platform}`, className)} {...rest}>
      {platform === 'mac' && (
        <div className="wiz-topnav__section wiz-topnav__lights" aria-hidden="true"><span /><span /><span /></div>
      )}
      <div className="wiz-topnav__section">{logo ?? <Logo />}</div>
      <div className="wiz-topnav__project">
        {project != null && (
          <button type="button" className="wiz-topnav__selector" aria-haspopup="menu" onClick={onProjectClick}>
            <span className="wiz-topnav__selector-text">{project}</span>
            <i className="ri-arrow-down-s-line" aria-hidden="true" />
          </button>
        )}
      </div>
      {actions && <div className="wiz-topnav__actions">{actions}</div>}
      {platform === 'win' && (
        <div className="wiz-topnav__win">
          <button type="button" aria-label="Minimize" onClick={onMinimize}><i className="ri-subtract-line" aria-hidden="true" /></button>
          <button type="button" aria-label="Maximize" onClick={onMaximize}><i className="ri-checkbox-blank-line" aria-hidden="true" /></button>
          <button type="button" aria-label="Close" onClick={onClose}><i className="ri-close-line" aria-hidden="true" /></button>
        </div>
      )}
    </header>
  );
}
