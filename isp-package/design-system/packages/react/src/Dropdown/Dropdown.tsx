import { useLayoutEffect, useRef, useState } from 'react';
import { Button, type ButtonProps } from '../Button/Button';
import { PopoverMenu, type PopoverMenuItem, type PopoverMenuProps } from '../PopoverMenu/PopoverMenu';
import '../PopoverMenu/PopoverMenu.css';
import { Tooltip } from '../Tooltip/Tooltip';
import { cx } from '../cx';
import './Dropdown.css';

export type DropdownItem = PopoverMenuItem;

export interface DropdownProps extends Omit<PopoverMenuProps, 'trigger' | 'items'> {
  /** 按钮文字 */
  label?: string;
  /** 筛选入口：筛选项名称（如 Status），显示为次要色前缀，label 为当前值，未限定时显示 All。字号 13，弱于同行的标题与操作按钮 */
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
export function Dropdown({ label, filterName, variant = 'secondary', size = 'medium', shadow, icon, items, disabled, width = 180, className, multiple, ...rest }: DropdownProps) {
  const value = filterName ? label || 'All' : label ?? 'Actions';
  const valueRef = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);

  useLayoutEffect(() => {
    const element = valueRef.current;
    if (!element) return;

    const measure = () => setTruncated(element.scrollHeight > element.clientHeight);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [filterName, value]);

  const button = (
    <Button className={filterName ? 'wiz-dropdown-filter' : undefined} variant={variant} size={size} shadow={shadow}
      leftIcon={icon} rightIcon="ri-arrow-down-s-line" status={disabled ? 'disable' : 'default'} disabled={disabled}>
      {filterName ? <>
        <span className="wiz-dropdown-filter__name">{filterName}:</span>{' '}
        <span ref={valueRef} className="wiz-dropdown-filter__value">{value}</span>
      </> : value}
    </Button>
  );

  return (
    <PopoverMenu items={items} width={width} multiple={multiple}
      className={cx(filterName && 'wiz-dropdown-filter-root', filterName && multiple && 'wiz-dropdown-filter-root--multiple', className)} {...rest}
      trigger={filterName ? (
        <Tooltip content={`${filterName}: ${value}`} disabled={!truncated || disabled} className="wiz-dropdown-filter-tooltip">
          {button}
        </Tooltip>
      ) : button} />
  );
}
