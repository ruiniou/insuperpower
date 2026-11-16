import { useState, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../cx';
import './SideBar.css';

/** 主库 Side Bar Tabs 14:2426：Property 1 = Unselected / Selected / Hover；Show Text 对应 collapsed */
export type SideBarTabState = 'unselected' | 'selected' | 'hover';

/** solid = 实心品牌蓝 + 白字（主库）；soft = 浅蓝底 + 蓝字 + 中粗（交付包原型 .ni.on） */
export type SideBarSelectedTone = 'solid' | 'soft';

export interface SideBarTabsProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'children'> {
  /** 图标 ri 类名 */
  icon?: string;
  label?: string;
  /** 第二行小字（如最近事件所属 Study）；有则高 44 */
  description?: string;
  /** 当前页（Selected） */
  active?: boolean;
  /** 强制显示状态（展示用；真实悬停同效） */
  state?: SideBarTabState;
  /** 仅显示图标（Show Text = false） */
  collapsed?: boolean;
  selectedTone?: SideBarSelectedTone;
}

/** 单个导航项：padding 10、图标 20、间距 10、圆角 8 */
export function SideBarTabs({ icon = 'ri-home-5-line', label, description, active, state, collapsed = false, selectedTone = 'solid', className, ...rest }: SideBarTabsProps) {
  const st = state ?? (active ? 'selected' : 'unselected');
  return (
    <button type="button" className={cx('wiz-sidebar-tab', `is-${st}`, collapsed && 'is-collapsed', selectedTone === 'soft' && 'is-soft', description && 'has-desc', className)}
      title={collapsed ? label : undefined} aria-label={collapsed ? label : undefined} aria-current={st === 'selected' ? 'page' : undefined} {...rest}>
      <i className={cx('wiz-sidebar-tab__icon', icon)} aria-hidden="true" />
      {!collapsed && (description
        ? <span className="wiz-sidebar-tab__two"><span className="wiz-sidebar-tab__text">{label}</span><small>{description}</small></span>
        : <span className="wiz-sidebar-tab__text">{label}</span>)}
    </button>
  );
}
/** 旧包名 */
export const SideBarItem = SideBarTabs;

export interface NavItem { icon?: string; label: string; value?: string; description?: string; onClick?: () => void }
export interface NavDivider { divider: true }
/** 分组标题（如 Recent events） */
export interface NavGroup { group: string }

export interface SideBarProps extends Omit<HTMLAttributes<HTMLElement>, 'onSelect'> {
  items: Array<NavItem | NavDivider | NavGroup>;
  /** 当前项 value（缺省取第一项） */
  value?: string;
  onSelect?: (value: string) => void;
  /** 显示折叠按钮（Logo 行右侧）。原型中只有 Review 工作台可折叠，其余页面固定展开 */
  collapsible?: boolean;
  /** 收起：整个导航不渲染，展开按钮由页面放在页头（用 <SideBarToggle />） */
  collapsed?: boolean;
  /** 选中态：solid 实心蓝（默认）/ soft 浅蓝底 */
  selectedTone?: SideBarSelectedTone;
  defaultCollapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
  /** 底部设置类项目，显示在用户行上方 */
  footerItems?: NavItem[];
  /** 用户：头像（姓名前两个词的首字母）+ 姓名 */
  user?: { name: string; email?: string };
  /** Logo 行内容；默认原型的粗体文字 ISP，传 null 不显示该行（无折叠按钮时） */
  logo?: ReactNode;
  /** 宽度（默认 160，可配合 Splitter 调整） */
  expandedWidth?: number;
}

/** 用户头像文字：取前两个词的首字母（User Name 得 UN）；只有一个词时取一个字母 */
function userInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.charAt(0) ?? '?') + (words[1]?.charAt(0) ?? '')).toUpperCase();
}

/** 折叠 / 展开按钮：交付包原型 ibtn（32×32、圆角 8、灰色图标）+ 设计提供的 collapse-line / expand-line 图标（24 视窗、实心路径、显示 16） */
export function SideBarToggle({ collapsed = true, className, ...rest }: { collapsed?: boolean } & Omit<HTMLAttributes<HTMLButtonElement>, 'children'>) {
  return (
    <button type="button" className={cx('wiz-sidebar__toggle', className)} aria-expanded={!collapsed}
      aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} title={collapsed ? 'Expand navigation' : 'Collapse navigation'} {...rest}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" clipRule="evenodd"
          d={collapsed
            ? 'M5.00001 2C3.3431 2 2 3.34315 2 5.00001V19C2 20.6569 3.3431 22 5.00001 22H19C20.6569 22 22 20.6569 22 19V5.00001C22 3.34315 20.6569 2 19 2H5.00001ZM14 20H5.00001C4.44771 20 3.99995 19.5523 3.99995 19V5.00001C3.99995 4.44772 4.44771 4 5.00001 4H14V20ZM19 4C19.5523 4 20 4.44772 20 5.00001V19C20 19.5523 19.5523 20 19 20H16V4H19Z'
            : 'M19 2C20.6569 2 22 3.34315 22 5V19C22 20.6569 20.6569 22 19 22H5C3.34315 22 2 20.6569 2 19V5C2 3.34315 3.34315 2 5 2H19ZM10 20H19C19.5523 20 20 19.5523 20 19V5C20 4.44772 19.5523 4 19 4H10V20ZM5 4C4.44772 4 4 4.44772 4 5V19C4 19.5523 4.44772 20 5 20H8V4H5Z'} />
      </svg>
    </button>
  );
}

/**
 * 左侧导航：外壳、折叠按钮位置、内容结构取自交付包原型（圆角 16 卡片、宽 160、Logo 行右侧折叠、分组「Recent events」、用户行在底部）；
 * 导航项用主库 Side Bar Tabs（SideBarTabs），项间距 4。
 */
export function SideBar({
  items, value, onSelect, collapsible = false, collapsed: collapsedProp, selectedTone = 'solid', defaultCollapsed = false, onToggle, footerItems = [], user, logo,
  expandedWidth = 160, className, style, ...rest
}: SideBarProps) {
  const [inner, setInner] = useState(defaultCollapsed);
  const collapsed = collapsedProp ?? inner;
  if (collapsed) return null;
  const toggle = () => { if (collapsedProp === undefined) setInner(true); onToggle?.(true); };
  const first = items.find((i): i is NavItem => 'label' in i);
  const current = value ?? first?.value ?? first?.label;
  return (
    <nav aria-label="Primary" className={cx('wiz-sidebar', className)} style={{ width: expandedWidth, ...style }} {...rest}>
      {(logo !== null || collapsible) && (
        <div className={cx('wiz-sidebar__logo', collapsible && 'has-toggle')}><span className="wiz-sidebar__logo-text">{logo === undefined ? 'ISP' : logo}</span>{collapsible && <SideBarToggle collapsed={false} onClick={toggle} />}</div>
      )}
      <div className="wiz-sidebar__items">
        {items.map((it, i) => 'divider' in it
          ? <div key={`d${i}`} role="separator" className="wiz-sidebar__rule" />
          : 'group' in it
            ? <div key={`g${i}`} className="wiz-sidebar__group">{it.group}</div>
            : <SideBarTabs key={it.value ?? it.label} icon={it.icon} label={it.label} description={it.description} selectedTone={selectedTone} active={current === (it.value ?? it.label)}
                onClick={() => { it.onClick?.(); onSelect?.(it.value ?? it.label); }} />)}
      </div>
      <div className="wiz-sidebar__footer">
        {footerItems.map((it) => <SideBarTabs key={it.label} icon={it.icon} label={it.label} onClick={it.onClick} />)}
        {user && (
          <div className="wiz-sidebar__user" title={user.email}>
            <span className="wiz-sidebar__avatar" aria-hidden="true">{userInitials(user.name || user.email || '?')}</span>
            <span className="wiz-sidebar__email">{user.name}</span>
          </div>
        )}
      </div>
    </nav>
  );
}
