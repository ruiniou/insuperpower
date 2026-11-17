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
  <Search collapsible size="compact" width={220} placeholder={placeholder} aria-label={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
);

export const PageHead = ({ children }: { children: ReactNode }) => <div className="page-head">{children}</div>;

import { Status, Tooltip } from '@wiz/react';
import type { Blinding, Lifecycle } from '../../store/types';

export const BLIND_LABEL: Record<Blinding, string> = { 'Not blinded': 'Not blinded', Blinded: 'Blinded', Revealed: 'Revealed' };
const BLIND_TONE = { 'Not blinded': 'grey', Blinded: 'purple', Revealed: 'blue' } as const;
export const BlindTag = ({ v }: { v: Blinding }) => <Status variant="style1" tone={BLIND_TONE[v]} textCase="normal">{BLIND_LABEL[v]}</Status>;
const LIFE_LABEL: Record<Lifecycle, string> = { ACTIVE: 'Active', ARCHIVED: 'Archived', DELETED: 'Deleted' };
/** 生命周期图标：同一圆形体系（参考 Linear 状态图标），16 见方。Active 蓝色圆环加实心点；Archived 灰色实心圆加归档盒；Deleted 灰色实心圆加叉 */
function LifecycleGlyph({ v }: { v: Lifecycle }) {
  return (
    <svg className={`studies-life__svg is-${v.toLowerCase()}`} viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      {v === 'ACTIVE' && <><circle className="ring" cx="8" cy="8" r="6.25" /><circle className="dot" cx="8" cy="8" r="2.5" /></>}
      {v === 'ARCHIVED' && <><circle className="disc" cx="8" cy="8" r="7" /><rect className="glyph-fill" x="4.5" y="4.75" width="7" height="2" rx="0.6" /><path className="glyph" d="M5.4 6.9v3.6c0 .3.2.5.5.5h4.2c.3 0 .5-.2.5-.5V6.9M6.9 8.7h2.2" /></>}
      {v === 'DELETED' && <><circle className="disc" cx="8" cy="8" r="7" /><path className="glyph" d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" /></>}
    </svg>
  );
}
export const LifecycleTag = ({ v }: { v: Lifecycle }) => <span className="studies-life-tag"><LifecycleGlyph v={v} />{LIFE_LABEL[v]}</span>;
/** 列表里跟在 Study ID 后的生命周期标记：同一个 16 见方的槽，圆心对齐。Active 蓝点，Archived 归档图标，Deleted 垃圾桶（线性图标，无底色）。纯图形，悬停显示文字 */
export const LifecycleMark = ({ v }: { v: Lifecycle }) => (
  <Tooltip content={LIFE_LABEL[v]} direction="top">
    <span className={`studies-life studies-life--${v.toLowerCase()}`} role="img" aria-label={LIFE_LABEL[v]}>
      {v === 'ACTIVE' ? <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="4" /></svg>
        : <i className={v === 'ARCHIVED' ? 'ri-archive-line' : 'ri-delete-bin-line'} aria-hidden="true" />}
    </span>
  </Tooltip>
);
