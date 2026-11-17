import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Tooltip } from '../Tooltip/Tooltip';
import { cx } from '../cx';
import './IconButton.css';

/**
 * 合并 Figma Buttons / Icon Button 784:1045 与两套 Actions（2354:1450、784:1055）。
 * variant：ghost = Actions 无描边；outline = Icon Button（32×32 描边带阴影）；primary = Actions Style=Primary（仅 circle）
 */
export type IconButtonVariant = 'ghost' | 'outline' | 'primary';
/** small 24 · medium 28 · compact 32（图标 16，与 32 高工具栏控件同轴）· big 36 · large 40（outline 固定 32，忽略 size） */
export type IconButtonSize = 'small' | 'medium' | 'compact' | 'big' | 'large';
export type IconButtonShape = 'rectangle' | 'circle';
/** ghost 图标色：black = Main Grey，grey = Grey 80 */
export type IconButtonColor = 'black' | 'grey';
/** hover 为强制显示悬停样式（真实悬停同效）；disable 等价 disabled */
export type IconButtonStatus = 'default' | 'hover' | 'disable';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Remix 图标类名，如 ri-home-5-line */
  icon: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  shape?: IconButtonShape;
  color?: IconButtonColor;
  status?: IconButtonStatus;
  /** 无可见文字，必须提供 */
  'aria-label': string;
  /** 悬停说明，写简短的功能名称（如 More），不带对象；默认取 title，其次 aria-label。aria-label 可以更具体（供读屏），此时用 tooltip 覆盖。菜单展开时不显示。传 false 关闭（外层已有 Tooltip 时） */
  tooltip?: ReactNode | false;
}

export function IconButton({
  icon, variant = 'ghost', size = 'medium', shape = 'rectangle', color = 'black', status = 'default',
  className, type = 'button', disabled, tooltip, title, ...rest
}: IconButtonProps) {
  const circle = variant === 'primary' || shape === 'circle';
  const isDisabled = disabled || status === 'disable';
  const tip = tooltip === false ? null : (tooltip ?? title ?? rest['aria-label']);
  const btn = (
    <button
      {...rest}
      type={type}
      disabled={isDisabled}
      className={cx(
        'wiz-icon-button', `wiz-icon-button--${variant}`,
        variant !== 'outline' && `wiz-icon-button--${size}`,
        circle && 'is-circle', color === 'grey' && 'is-grey',
        status === 'hover' && 'is-hover', status === 'disable' && 'is-disabled', className,
      )}
    >
      <i className={icon} aria-hidden="true" />
    </button>
  );
  // 纯图标按钮必须有 Tooltip 说明功能名称（全局规则；位置、延迟参考 Atlas）
  return tip ? <Tooltip content={tip} nowrap>{btn}</Tooltip> : btn;
}
