import type { HTMLAttributes } from 'react';
import { cx } from '../cx';
import './Avatar.css';

/** Wiz Agent 文件 Avatar 页：General 72:2276（6 色）、头像组 82:701 的 >4 变体（Agent Avatar 与 4 个以内的头像组暂不做） */
export type AvatarColor = 'black' | 'brand-blue' | 'green' | 'brown' | 'cyan' | 'purple';

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  /** 显示的文字（通常 2 个字母）；不传则取 name 的前两个字符 */
  initials?: string;
  name?: string;
  color?: AvatarColor;
  /** 图片头像；传入则不显示文字 */
  src?: string;
  /** 直径（默认 32；字号随比例缩放） */
  size?: number;
}

/** 通用头像：圆形、1px 白描边（计入 32）、14px 半粗体白字 */
export function Avatar({ initials, name = '', color = 'black', src, size, className, style, ...rest }: AvatarProps) {
  const text = (initials ?? (name.trim().slice(0, 2) || '?')).toUpperCase();
  const custom = size && size !== 32 ? { width: size, height: size, fontSize: Math.round(size * 0.4375), ...style } : style;
  return (
    <span role="img" aria-label={name || text} className={cx('wiz-avatar', `wiz-avatar--${color}`, src && 'has-src', className)} style={custom} {...rest}>
      {src ? <img src={src} alt="" /> : text}
    </span>
  );
}

export interface AvatarGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 通用头像数据 */
  items?: AvatarProps[];
  /** 最多显示个数，超出显示「+N」（默认 3，即主库 >4 变体：3 个头像 + 「+N」） */
  max?: number;
}

/** 头像组：相邻重叠 12px；超过 max 个时末尾显示 +N */
export function AvatarGroup({ items, max = 3, className, ...rest }: AvatarGroupProps) {
  const list = items ?? [];
  const shown = list.slice(0, max);
  const rest_ = list.length - shown.length;
  return (
    <div role="group" className={cx('wiz-avatar-group', className)} {...rest}>
      {shown.map((p, i) => <Avatar key={i} {...p} />)}
      {rest_ > 0 && <span className="wiz-avatar wiz-avatar--more" aria-label={`+${rest_}`}>+{rest_}</span>}
    </div>
  );
}
