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
  return <PopoverMenu align="right" width={180} trigger={<IconButton icon="ri-more-2-fill" size="small" aria-label={`More actions for ${label}`} />} items={items} onSelect={(v) => onSelect(String(v))} />;
}

export const SearchBox = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
  <Search collapsible size="compact" width={220} placeholder={placeholder} aria-label={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
);

export const PageHead = ({ children }: { children: ReactNode }) => <div className="page-head">{children}</div>;
