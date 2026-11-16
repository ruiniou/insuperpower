import type { HTMLAttributes, ReactNode } from 'react';
import { IconButton, Status } from '@wiz/react';
import { cx } from '../cx';
import { RefLink } from '../RefLink/RefLink';
import './InputsCard.css';

export interface InputsGroup {
  /** 分组名，如 Analysis plan、Datasets */
  label: string;
  /** 当前引用文字，如 SAP v2 */
  text: string;
  /** 黄色提示，如 v3 newer */
  badge?: string;
  /** 点击引用文字（text 为占位时不传） */
  onOpen?: () => void;
  /** 更换版本 / 选择文件的小按钮 */
  onChange?: () => void;
  changeLabel?: string;
  /** 分组底部放替换区（UploadSlots） */
  footer?: ReactNode;
}

export interface InputsCardProps extends HTMLAttributes<HTMLDivElement> {
  groups: InputsGroup[];
  open: boolean;
  onToggle: () => void;
  /** 展开区最大高度，默认 248 */
  maxBodyHeight?: number;
  /** 展开区底部（如数据集替换区） */
  footer?: ReactNode;
}

/** 流水线左侧的 Inputs 折叠卡：折叠态 = 标题 + 数量 + 黄色「N newer」；展开态 = 分组列表 + 跳转 + 更换版本小按钮 */
export function InputsCard({ groups, open, onToggle, maxBodyHeight = 248, footer, className, children, ...rest }: InputsCardProps) {
  const nNewer = groups.filter((g) => g.badge).length;
  return (
    <div className={cx('wiz-isp-inputs', className)} {...rest}>
      <button type="button" className="wiz-isp-inputs__head" aria-expanded={open} onClick={onToggle}>
        <b>Inputs</b>
        <span className="wiz-isp-inputs__cnt">{groups.length}</span>
        {!open && nNewer > 0 && <Status tone="yellow">{nNewer} newer</Status>}
        <i className={cx('wiz-isp-inputs__chev', open ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line')} aria-hidden="true" />
      </button>
      {open && (
        <>
          <div className="wiz-isp-inputs__body" style={{ maxHeight: maxBodyHeight }}>
            {groups.length === 0 && <div className="wiz-isp-inputs__group"><div className="wiz-isp-inputs__label">No inputs referenced</div></div>}
            {groups.map((g) => (
              <div className="wiz-isp-inputs__group" key={g.label}>
                <div className="wiz-isp-inputs__label">{g.label}</div>
                <div className="wiz-isp-inputs__ref">
                  {g.onOpen ? <RefLink onClick={g.onOpen}>{g.text}</RefLink> : <span className="wiz-isp-inputs__muted">{g.text}</span>}
                  {g.onChange && <IconButton icon="ri-exchange-line" size="small" variant="ghost" aria-label={g.changeLabel ?? 'Change version'} onClick={g.onChange} />}
                </div>
                {g.badge && <div className="wiz-isp-inputs__badge"><Status tone="yellow">{g.badge}</Status></div>}
                {g.footer}
              </div>
            ))}
          </div>
          {footer}
        </>
      )}
      {children}
    </div>
  );
}

export interface UploadSlot { key: string; label: string; /** 已上传数量 */ count?: number }

export interface UploadSlotsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  slots: UploadSlot[];
  /** 点击槽位：打开文件选择，上传到当前 Event */
  onPick: (key: string) => void;
}

/** 替换区：虚线槽位（ADaM / SDTM），空 = 上传图标 + 名称，已有 = 实线 + 数量 */
export function UploadSlots({ slots, onPick, className, ...rest }: UploadSlotsProps) {
  return (
    <div className={cx('wiz-isp-slots', className)} {...rest}>
      {slots.map((s) => {
        const n = s.count ?? 0;
        return (
          <button key={s.key} type="button" className={cx('wiz-isp-slot', n > 0 && 'is-filled')} onClick={() => onPick(s.key)}
            aria-label={n ? `Upload another ${s.label} dataset, ${n} uploaded` : `Upload ${s.label}`}>
            {!n && <i className="ri-upload-2-line" aria-hidden="true" />}
            {s.label}
            {n > 0 && <span className="wiz-isp-slot__n">{n}</span>}
          </button>
        );
      })}
    </div>
  );
}
