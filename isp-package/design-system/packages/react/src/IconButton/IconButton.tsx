import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../cx';
import './IconButton.css';

/**
 * 合并 Figma Buttons / Icon Button 784:1045 与两套 Actions（2354:1450、784:1055）。
 * variant：ghost = Actions 无描边；outline = Icon Button（32×32 描边带阴影）；primary = Actions Style=Primary（仅 circle）
 */
export type IconButtonVariant = 'ghost' | 'outline' | 'primary';
/** small 24 · medium 28 · big 36 · large 40（outline 固定 32，忽略 size） */
export type IconButtonSize = 'small' | 'medium' | 'big' | 'large';
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
}

export function IconButton({
  icon, variant = 'ghost', size = 'medium', shape = 'rectangle', color = 'black', status = 'default',
  className, type = 'button', disabled, ...rest
}: IconButtonProps) {
  const circle = variant === 'primary' || shape === 'circle';
  const isDisabled = disabled || status === 'disable';
  return (
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
}
