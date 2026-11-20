import type { HTMLAttributes, ReactNode } from 'react';
import { Status } from '@wiz/react';
import { cx } from '../cx';
import './VersionRow.css';

/** 版本行（原型 .vr）：版本号 + Latest / Official 标记；第二行「人, 日期, 备注」；第三行「Used by: …」，非最新版被引用时带 behind；右侧操作 */
export interface VersionRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label: string;
  latest?: boolean;
  official?: boolean;
  by: string;
  date: string;
  note?: string;
  /** 数据截点，显示在第一行右侧（Dataset 版本用） */
  cut?: string;
  /** 关联 Spec，显示为「Spec: …」一行（Dataset 版本用） */
  spec?: string;
  /** 没有引用时不显示「Used by: —」行 */
  hideUnused?: boolean;
  /** 引用该版本的 Event 名；空 = 「—」 */
  usedBy: string[];
  /** 有引用且不是最新版时显示 behind */
  behind?: boolean;
  action?: ReactNode;
}

export function VersionRow({ label, latest, official, by, date, note, cut, spec, hideUnused, usedBy, behind, action, className, ...rest }: VersionRowProps) {
  return (
    <div {...rest} className={cx('wiz-isp-vr', className)}>
      <div className="wiz-isp-vr__main">
        <div className="wiz-isp-vr__l1">{label}{latest && <Status variant="style1" tone="grey" textCase="normal">Latest</Status>}{official && <Status variant="style1" tone="blue" textCase="normal">Official</Status>}{cut && <span className="wiz-isp-vr__cut">Cut {cut}</span>}</div>
        <div className="wiz-isp-vr__l2">{by}, {date}{note ? ', ' + note : ''}</div>
        {spec && <div className="wiz-isp-vr__l2">Spec: {spec}</div>}
        {!(hideUnused && !usedBy.length) && <div className="wiz-isp-vr__l2">Used by: {usedBy.length ? usedBy.join(', ') : '—'}{usedBy.length > 0 && behind && <Status variant="style1" tone="yellow" textCase="normal" className="wiz-isp-vr__behind">behind</Status>}</div>}
      </div>
      {action}
    </div>
  );
}
