/** 日期时间工具：值一律是本地时间的 ISO 串 `YYYY-MM-DDTHH:mm`（精确到分钟，字典序即时间序）；显示用欧美惯例 `9:00 am, 09/10/2026` */
export const pad = (n: number) => String(n).padStart(2, '0');

export interface DateParts { y: number; mo: number; d: number }
export interface TimeParts { h: number; mi: number }

const ISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export function parseIso(s: string): (DateParts & TimeParts) | null {
  const m = ISO.exec(s); if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const t = new Date(y, mo - 1, d, h, mi);
  if (t.getFullYear() !== y || t.getMonth() !== mo - 1 || t.getDate() !== d || h > 23 || mi > 59) return null;
  return { y, mo, d, h, mi };
}
export const isValidIso = (s: string) => parseIso(s) !== null;
export const toIso = (p: DateParts & TimeParts) => `${p.y}-${pad(p.mo)}-${pad(p.d)}T${pad(p.h)}:${pad(p.mi)}`;

/** 当前本地时间，取整到分钟 */
export const nowIso = (d = new Date()) => toIso({ y: d.getFullYear(), mo: d.getMonth() + 1, d: d.getDate(), h: d.getHours(), mi: d.getMinutes() });
/** 加减分钟（跨日、跨月自动进位） */
export function addMinutes(iso: string, n: number): string {
  const p = parseIso(iso); if (!p) return iso;
  return nowIso(new Date(p.y, p.mo - 1, p.d, p.h, p.mi + n));
}

export const formatDate = (iso: string) => { const p = parseIso(iso); return p ? `${pad(p.mo)}/${pad(p.d)}/${p.y}` : ''; };
export const formatTime = (iso: string) => { const p = parseIso(iso); if (!p) return ''; const h12 = p.h % 12 || 12; return `${h12}:${pad(p.mi)} ${p.h < 12 ? 'am' : 'pm'}`; };
/** `9:00 am, 09/10/2026` */
export const formatDateTime = (iso: string) => (isValidIso(iso) ? `${formatTime(iso)}, ${formatDate(iso)}` : '');

/** 解析 `MM/DD/YYYY`（月、日可不补零） */
export function parseDateText(s: string): DateParts | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim()); if (!m) return null;
  const [mo, d, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(y, mo - 1, d);
  return t.getFullYear() === y && t.getMonth() === mo - 1 && t.getDate() === d ? { y, mo, d } : null;
}
/** 解析 `9:00 am` / `9am` / `9:00PM` / `13:05` */
export function parseTimeText(s: string): TimeParts | null {
  const m = /^(\d{1,2})(?::(\d{2}))?\s*([ap]m?)?$/i.exec(s.trim()); if (!m) return null;
  let h = Number(m[1]); const mi = m[2] ? Number(m[2]) : 0; const ap = m[3]?.toLowerCase();
  if (mi > 59) return null;
  if (ap) { if (h < 1 || h > 12) return null; h = (h % 12) + (ap.startsWith('p') ? 12 : 0); } else if (h > 23) return null;
  return { h, mi };
}

/** 系统时区（由浏览器 / 系统判定），label 如 GMT+8，name 如 Asia/Shanghai */
export function systemTimeZone(): { label: string; name: string } {
  try {
    const name = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const label = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value ?? name;
    return { label, name };
  } catch { return { label: 'UTC', name: 'UTC' }; }
}

/** 某月的 6×7 日历格（周日起） */
export function monthGrid(y: number, mo: number): Array<DateParts & { inMonth: boolean }> {
  const first = new Date(y, mo - 1, 1).getDay();
  return Array.from({ length: 42 }, (_, i) => {
    const t = new Date(y, mo - 1, 1 - first + i);
    return { y: t.getFullYear(), mo: t.getMonth() + 1, d: t.getDate(), inMonth: t.getMonth() === mo - 1 };
  });
}
export const dateKey = (p: DateParts) => `${p.y}-${pad(p.mo)}-${pad(p.d)}`;
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 时间输入的分段：h 时 / m 分 / p am-pm */
export type TimeSeg = 'h' | 'm' | 'p';
/** 某段在文本 `9:05 am` 里的选区 [start, end) */
export function segRange(text: string, seg: TimeSeg): [number, number] {
  const c = text.indexOf(':'); if (c < 0) return [0, text.length];
  return seg === 'h' ? [0, c] : seg === 'm' ? [c + 1, c + 3] : [c + 4, text.length];
}
/** 光标位置所在的段 */
export function segAt(text: string, pos: number): TimeSeg {
  const c = text.indexOf(':'); return pos <= c ? 'h' : pos <= c + 3 ? 'm' : 'p';
}
/** 某段加减一档：时（12 小时循环，不改 am/pm）、分（0–59 循环，不进位）、am/pm（±12 小时）；日期不变 */
export function stepTime(iso: string, seg: TimeSeg, dir: 1 | -1): string {
  const p = parseIso(iso); if (!p) return iso;
  const pm = p.h >= 12;
  if (seg === 'h') { const h12 = ((((p.h % 12 || 12) - 1 + dir) % 12) + 12) % 12 + 1; return toIso({ ...p, h: (h12 % 12) + (pm ? 12 : 0) }); }
  if (seg === 'm') return toIso({ ...p, mi: (p.mi + dir + 60) % 60 });
  return toIso({ ...p, h: (p.h + 12) % 24 });
}
/** 把某段设为指定值（时为 1–12，分为 0–59，p 为 am / pm）；日期不变 */
export function setSeg(iso: string, seg: TimeSeg, v: number | 'am' | 'pm'): string {
  const p = parseIso(iso); if (!p) return iso;
  const pm = p.h >= 12;
  if (seg === 'h') return toIso({ ...p, h: ((v as number) % 12) + (pm ? 12 : 0) });
  if (seg === 'm') return toIso({ ...p, mi: v as number });
  return toIso({ ...p, h: (p.h % 12) + (v === 'pm' ? 12 : 0) });
}

/**
 * 有效期显示（欧美惯例，时间 → 时间）：
 * 没有结束：`9:00 am, 09/10/2026`；同一天：`9:00 am → 10:00 am, 09/10/2026`；跨天：`9:00 am, 09/10/2026 → 10:00 am, 09/12/2026`
 */
export function formatRange(start: string, end: string | null | undefined): string {
  if (!isValidIso(start)) return '';
  if (!end || !isValidIso(end)) return formatDateTime(start);
  return start.slice(0, 10) === end.slice(0, 10) ? `${formatTime(start)} → ${formatTime(end)}, ${formatDate(start)}` : `${formatDateTime(start)} → ${formatDateTime(end)}`;
}
