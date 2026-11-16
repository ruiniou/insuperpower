import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import './RefLink.css';

export interface RefLinkProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  /** 末尾图标 ri 类名；默认外链箭头，传 null 不显示 */
  icon?: string | null;
}

/** 引用链接：资产 / 数据集名，下划线 + 外链图标，点击跳转到对应 Tab。真实链接请用 <a>，这里是按钮语义（站内跳转） */
export function RefLink({ children, icon = 'ri-external-link-line', className, type = 'button', ...rest }: RefLinkProps) {
  return (
    <button type={type} className={cx('wiz-isp-reflink', className)} {...rest}>
      <span>{children}</span>
      {icon && <i className={icon} aria-hidden="true" />}
    </button>
  );
}
