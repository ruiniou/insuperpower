import type { HTMLAttributes } from 'react';
import { cx } from '../cx';
import './Logo.css';

/** ISP 标志（logo/ISP-Text.svg，58×24） */
export type LogoProps = HTMLAttributes<HTMLDivElement>;

export function Logo({ className, ...rest }: LogoProps) {
  return (
    <div role="img" aria-label="ISP" className={cx('wiz-logo', className)} {...rest}>
      <span className="wiz-logo__symbol" aria-hidden="true" />
    </div>
  );
}
