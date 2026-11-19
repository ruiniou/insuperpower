import { Button, type ButtonProps } from '../Button/Button';
import { PopoverMenu, type PopoverMenuItem, type PopoverMenuProps } from '../PopoverMenu/PopoverMenu';
import '../PopoverMenu/PopoverMenu.css';
import './Dropdown.css';

export type DropdownItem = PopoverMenuItem;

export interface DropdownProps extends Omit<PopoverMenuProps, 'trigger' | 'items'> {
  /** 按钮文字 */
  label?: string;
  /** 筛选入口：筛选项名称（如 Status），显示为次要色前缀，label 为当前值。字号 13，弱于同行的标题与操作按钮 */
  filterName?: string;
  /** 按钮样式：primary / secondary / danger / link（旧包 normal → secondary、text → link） */
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  /** 透传 Button.shadow */
  shadow?: ButtonProps['shadow'];
  /** 按钮左图标 ri 类名 */
  icon?: string;
  items: DropdownItem[];
  disabled?: boolean;
}

/** 下拉按钮：Button 加右侧箭头，点击展开 PopoverMenu */
export function Dropdown({ label = 'Actions', filterName, variant = 'secondary', size = 'medium', shadow, icon, items, disabled, width = 180, ...rest }: DropdownProps) {
  return (
    <PopoverMenu items={items} width={width} {...rest}
      trigger={<Button className={filterName ? 'wiz-dropdown-filter' : undefined} variant={variant} size={size} shadow={shadow} leftIcon={icon} rightIcon="ri-arrow-down-s-line" status={disabled ? 'disable' : 'default'} disabled={disabled}>{filterName ? <><span className="wiz-dropdown-filter__name">{filterName}</span>{label}</> : label}</Button>} />
  );
}
