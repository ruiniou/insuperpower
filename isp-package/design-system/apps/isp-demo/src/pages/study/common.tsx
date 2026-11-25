import type { ReactNode } from 'react';
import { Avatar, IconButton, PopoverMenu, Search, type PopoverMenuItem } from '@wiz/react';
import { toast } from '../../store/store';

export const initials = (n: string) => n.split(' ').map((x) => x[0]).join('').toUpperCase();
export const eventsLbl = (n: number) => (n === 1 ? '1 event' : n + ' events');
export const plural = (n: number, w: string) => n + ' ' + w + (n === 1 ? '' : 's');
export const soon = (what: string) => () => toast(what + ' is not in this prototype');

export const Owner = ({ name }: { name: string }) => <span className="app-owner"><Avatar size={20} color="brand-blue" initials={initials(name)} />{name}</span>;

/** 行尾「更多」菜单 */
export function RowMenu({ label, items, onSelect }: { label: string; items: PopoverMenuItem[]; onSelect: (v: string) => void }) {
  return <PopoverMenu align="right" width={180} trigger={<IconButton icon="ri-more-2-fill" size="compact" aria-label={`More actions for ${label}`} tooltip="More" />} items={items} onSelect={(v) => onSelect(String(v))} />;
}

export const SearchBox = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
  <Search size="compact" width={220} placeholder={placeholder} aria-label={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
);

/**
 * 页面工具栏（全局统一版式）：一行 48 高。
 * 左：start（标题 + 计数 / 返回链接，二选一，可无）→ filters（筛选 Dropdown，按重要度从左到右）；
 * 右：search（默认直接显示搜索框，行拥挤时才收成图标）→ actions（次要操作在前，主 CTA 在最右，全页只有一个 Primary）。
 */
export function PageToolbar({ start, filters, search, actions }: { start?: ReactNode; filters?: ReactNode; search?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <span className="page-tools">{start}{filters}</span>
      <span className="page-tools">{search}{actions}</span>
    </div>
  );
}

import { Status, Tooltip } from '@wiz/react';
import type { Blinding, Lifecycle } from '../../store/types';

export const BLIND_LABEL: Record<Blinding, string> = { Unblinded: 'Unblinded', Blinded: 'Blinded' };
const BLIND_TONE = { Unblinded: 'grey', Blinded: 'purple' } as const;
export const BlindTag = ({ v }: { v: Blinding }) => <Status variant="style1" tone={BLIND_TONE[v]} textCase="normal">{BLIND_LABEL[v]}</Status>;
const LIFE_LABEL: Record<Lifecycle, string> = { ACTIVE: 'Active', ARCHIVED: 'Archived', DELETED: 'Deleted' };
/** 生命周期图标，16 见方的槽，中心对齐：Active 蓝点，Archived 归档图标，Deleted 垃圾桶（线性图标，无底色） */
function LifecycleGlyph({ v }: { v: Lifecycle }) {
  return (
    <span className={`studies-life studies-life--${v.toLowerCase()}`} aria-hidden="true">
      {v === 'ACTIVE' ? <svg viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="4" /></svg> : <i className={v === 'ARCHIVED' ? 'ri-archive-line' : 'ri-delete-bin-line'} />}
    </span>
  );
}
/** 带文字的生命周期（Study details 抽屉） */
export const LifecycleTag = ({ v }: { v: Lifecycle }) => <span className="studies-life-tag"><LifecycleGlyph v={v} />{LIFE_LABEL[v]}</span>;
export const LifecycleMark = ({ v, focusable, tooltip = true }: { v: Lifecycle; focusable?: boolean; tooltip?: boolean }) => {
  const glyph = <span role="img" aria-label={LIFE_LABEL[v]} tabIndex={focusable ? 0 : undefined}><LifecycleGlyph v={v} /></span>;
  if (!tooltip) return glyph;
  return (
    <Tooltip content={LIFE_LABEL[v]} direction="top">
      {glyph}
    </Tooltip>
  );
};
