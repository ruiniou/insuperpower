import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import './DatasetCard.css';

/** Dataset 卡（原型 .dc）：等宽名 + 最新版本；描述；底部「类别, N versions」与「被 N events 使用」 */
export interface DatasetCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  name: string;
  version: string;
  description?: string;
  footerLeft: ReactNode;
  footerRight: ReactNode;
  /** 传入则整卡可点 */
  onOpen?: () => void;
}

export function DatasetCard({ name, version, description, footerLeft, footerRight, onOpen, className, ...rest }: DatasetCardProps) {
  const act = onOpen ? { role: 'button' as const, tabIndex: 0, onClick: onOpen, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } } } : {};
  return (
    <div {...rest} {...act} className={cx('wiz-isp-dc', onOpen && 'is-link', className)}>
      <div className="wiz-isp-dc__t"><i className="ri-database-2-line" aria-hidden="true" /><span className="wiz-isp-dc__name">{name}</span><span className="wiz-isp-dc__v">{version}</span></div>
      <div className="wiz-isp-dc__d">{description}</div>
      <div className="wiz-isp-dc__f"><span>{footerLeft}</span><span>{footerRight}</span></div>
    </div>
  );
}

/** 卡片网格尾部的占位：「+ N more」/「No datasets …」，虚线框；single=true 时只占一格 */
export function DatasetCardMore({ children, onOpen, single, height, className, ...rest }: Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> & { onOpen?: () => void; single?: boolean; height?: number }) {
  const act = onOpen ? { role: 'button' as const, tabIndex: 0, onClick: onOpen, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } } } : {};
  return <div {...rest} {...act} style={height ? { height } : undefined} className={cx('wiz-isp-dc', 'wiz-isp-dc--more', single && 'is-single', onOpen && 'is-link', className)}>{children}</div>;
}
