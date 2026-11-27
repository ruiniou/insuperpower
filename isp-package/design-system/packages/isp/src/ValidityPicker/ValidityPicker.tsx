import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button, Field, FieldBox, IconButton, Switch, type FieldSize, type FieldState } from '@wiz/react';
import { cx } from '../cx';
import {
  addMinutes, dateKey, formatDate, formatRange, formatTime, isValidIso, monthGrid, MONTHS, nowIso, pad, parseDateText, parseIso, parseTimeText, segAt, segRange, setSeg, stepTime, systemTimeZone, toIso,
  type DateParts, type TimeParts, type TimeSeg,
} from './dateTime';
import './ValidityPicker.css';

export { formatDateTime, formatDate, formatRange, formatTime, isValidIso, nowIso, addMinutes, systemTimeZone } from './dateTime';

/** 值：本地时间 ISO 串 `YYYY-MM-DDTHH:mm`；end 为 null 表示没有结束时间 */
export interface Validity { start: string; end: string | null }

export interface ValidityPickerProps {
  value: Validity;
  onChange: (v: Validity) => void;
  /** 提供「End time」开关：打开后加一行选结束时间；关闭则 end 为 null。默认只选开始时间 */
  endable?: boolean;
  /** 点开时若尚未设置结束时间，默认启用结束时间（如时间范围筛选场景） */
  defaultEnd?: boolean;
  /** 允许清空：有值时浮层底部出现 Clear，清空后 start 为空串、end 为 null（用作筛选条件时，空即不限） */
  clearable?: boolean;
  /** Label for the sole date/time in a standalone field. */
  singlePointLabel?: string;
  label?: ReactNode;
  required?: boolean;
  error?: ReactNode;
  size?: FieldSize;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
}

const GAP = 4;
const WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

type Row = 'start' | 'end';

/**
 * 分段时间输入：像原生时间框一样，点击或 Tab 进入后选中「时 / 分 / am-pm」其中一段；
 * ↑ ↓ 调整当前段，← → 换段，直接敲数字覆盖当前段（敲满自动跳下一段），a / p 切换 am / pm；也支持粘贴 `9:00 am`、`13:05`。
 */
function TimeInput({ iso, label, onFocusRow, onIso }: { iso: string; label: string; onFocusRow: () => void; onIso: (iso: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [seg, setSegState] = useState<TimeSeg>('h');
  const buf = useRef('');
  const text = formatTime(iso);
  const focused = useRef(false);
  // 文本或分段变化后，重新选中当前段
  useLayoutEffect(() => { if (focused.current) { const [a, b] = segRange(text, seg); ref.current?.setSelectionRange(a, b); } }, [text, seg]);
  const go = (n: TimeSeg) => { buf.current = ''; setSegState(n); };
  const next = (d: 1 | -1) => go(d === 1 ? (seg === 'h' ? 'm' : 'p') : (seg === 'p' ? 'm' : 'h'));
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (k === 'ArrowUp' || k === 'ArrowDown') { e.preventDefault(); buf.current = ''; onIso(stepTime(iso, seg, k === 'ArrowUp' ? 1 : -1)); }
    else if (k === 'ArrowLeft' || k === 'ArrowRight') { e.preventDefault(); next(k === 'ArrowRight' ? 1 : -1); }
    else if (/^\d$/.test(k)) {
      e.preventDefault();
      if (seg === 'h') {
        const v = Number(buf.current + k);
        if (buf.current && v >= 1 && v <= 12) { onIso(setSeg(iso, 'h', v)); go('m'); }
        else if (k === '0') buf.current = '0';
        else { const d = Number(k); onIso(setSeg(iso, 'h', d)); if (d > 1) go('m'); else buf.current = k; }
      } else if (seg === 'm') {
        const v = buf.current ? Number(buf.current + k) : Number(k);
        onIso(setSeg(iso, 'm', v));
        if (buf.current || Number(k) >= 6) go('p'); else buf.current = k;
      }
    } else if (seg === 'p' || /^[ap]$/i.test(k)) {
      if (/^[ap]$/i.test(k)) { e.preventDefault(); onIso(setSeg(iso, 'p', k.toLowerCase() === 'a' ? 'am' : 'pm')); go('p'); }
      else if (k !== 'Tab' && k.length === 1) e.preventDefault();
    } else if (k.length === 1) e.preventDefault();
  };
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault(); const t = parseTimeText(e.clipboardData.getData('text')); const p = parseIso(iso);
    if (t && p) onIso(toIso({ ...p, ...t }));
  };
  return (
    <input ref={ref} className="wiz-isp-vp__in wiz-isp-vp__in--time" aria-label={label} placeholder="9:00 am" value={text} autoComplete="off" inputMode="numeric" spellCheck={false}
      onFocus={() => { focused.current = true; onFocusRow(); go('h'); const [a, b] = segRange(text, 'h'); requestAnimationFrame(() => ref.current?.setSelectionRange(a, b)); }}
      onBlur={() => { focused.current = false; buf.current = ''; }}
      onMouseUp={(e) => { const n = segAt(text, e.currentTarget.selectionStart ?? 0); go(n); const [a, b] = segRange(text, n); e.currentTarget.setSelectionRange(a, b); }}
      onChange={() => {}} onKeyDown={onKeyDown} onPaste={onPaste} />
  );
}

export function ValidityPicker({ value, onChange, endable = false, defaultEnd = false, clearable = false, singlePointLabel, label, required, error, size = 'medium', disabled, placeholder = 'Select start time', className, ...rest }: ValidityPickerProps) {
  const uid = 'wiz-isp-vp-' + useId().replace(/:/g, '');
  const tz = useMemo(systemTimeZone, []);
  const hasError = error != null && error !== false && error !== '';
  const st: FieldState = disabled ? 'disable' : hasError ? 'error' : 'default';
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Validity>(value);
  const [active, setActive] = useState<Row>('start');
  const [view, setView] = useState({ y: 2026, mo: 1 });
  const [txt, setTxt] = useState({ sd: '', ed: '' });
  const [txtErr, setTxtErr] = useState<{ row: Row; msg: string } | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const trigger = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);

  const sync = (d: Validity) => setTxt({ sd: formatDate(d.start), ed: d.end ? formatDate(d.end) : '' });
  const openPop = () => {
    if (disabled) return;
    const start = isValidIso(value.start) ? value.start : nowIso();
    const hasEnd = endable && value.end && isValidIso(value.end);
    const end = hasEnd ? value.end : (endable && defaultEnd && !value.start ? addMinutes(start, 60) : null);
    const d: Validity = { start, end };
    const p = parseIso(start)!;
    setDraft(d); sync(d); setTxtErr(null); setActive('start'); setView({ y: p.y, mo: p.mo }); setPos(null); setOpen(true);
  };
  const close = (refocus = true) => { setOpen(false); if (refocus) trigger.current?.focus(); };

  /** 写入草稿并立即回写（修改即生效）。只有真正改动过才回写，打开后不动直接关闭不会改变值 */
  const commit = (nd: Validity) => {
    setDraft(nd); sync(nd); setTxtErr(null);
    const out = { start: nd.start, end: endable ? nd.end : null };
    if (out.start !== value.start || out.end !== (value.end ?? null)) onChange(out);
  };
  const applyIso = (which: Row, next: string) => {
    if (which === 'end') {
      if (next <= draft.start) { setTxtErr({ row: 'end', msg: 'End time must be after start time.' }); return; }
      commit({ ...draft, end: next });
    } else {
      // 开始挪到结束之后：结束随之平移，保持原时长
      let end = draft.end;
      if (end && next >= end) { const dur = Math.max(1, Math.round((+new Date(end) - +new Date(draft.start)) / 60000)); end = addMinutes(next, dur); }
      commit({ start: next, end });
    }
    const p = parseIso(next); if (p) setView({ y: p.y, mo: p.mo });
  };
  /** 改某一行的日期或时间部分 */
  const apply = (which: Row, patch: Partial<DateParts & TimeParts>) => {
    const cur = parseIso(draft[which] ?? draft.start); if (!cur) return;
    applyIso(which, toIso({ ...cur, ...patch }));
  };
  const commitDate = (which: Row) => {
    const raw = which === 'start' ? txt.sd : txt.ed;
    const shown = draft[which] ?? ''; if (raw === formatDate(shown)) return; // 没改动，不重复写回（空值打开后直接关闭不应写入）
    const p = parseDateText(raw); if (p) apply(which, p); else setTxtErr({ row: which, msg: 'Use the date format MM/DD/YYYY.' });
  };
  const toggleEnd = (on: boolean) => { commit({ ...draft, end: on ? addMinutes(draft.start, 60) : null }); setActive(on ? 'end' : 'start'); };

  // 定位：默认在触发框下方；放不下翻到上方；左右越界整体平移（同 Tooltip / useEdgeFit 规则）
  const place = useCallback(() => {
    const t = trigger.current?.getBoundingClientRect(); const b = pop.current?.getBoundingClientRect(); if (!t || !b) return;
    const vw = window.innerWidth; const vh = window.innerHeight;
    let top = t.bottom + GAP;
    if (top + b.height > vh - 4 && t.top - GAP - b.height >= 4) top = t.top - GAP - b.height;
    top = Math.max(4, Math.min(top, vh - b.height - 4));
    const left = Math.max(4, Math.min(t.left, vw - b.width - 4));
    setPos({ top: Math.round(top), left: Math.round(left) });
  }, []);
  useLayoutEffect(() => { if (open) place(); }, [open, place, draft.end === null, endable, txtErr]);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { const n = e.target as Node; if (!pop.current?.contains(n) && !trigger.current?.contains(n)) close(false); };
    document.addEventListener('mousedown', onDoc); window.addEventListener('resize', place); window.addEventListener('scroll', place, true);
    return () => { document.removeEventListener('mousedown', onDoc); window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open, place]);
  useEffect(() => { if (open && pos) pop.current?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true }); }, [open, pos === null]);

  const cur = parseIso(draft[active] ?? draft.start) ?? parseIso(nowIso())!;
  const startDate = parseIso(draft.start);
  const endDate = draft.end ? parseIso(draft.end) : null;
  const todayKey = dateKey(parseIso(nowIso())!);
  const grid = monthGrid(view.y, view.mo);
  const shift = (n: number) => { const t = new Date(view.y, view.mo - 1 + n, 1); setView({ y: t.getFullYear(), mo: t.getMonth() + 1 }); };
  const dayDisabled = (p: DateParts) => active === 'end' && !!startDate && dateKey(p) < dateKey(startDate);
  const inRange = (p: DateParts) => !!startDate && !!endDate && dateKey(p) > dateKey(startDate) && dateKey(p) < dateKey(endDate);
  const pickDay = (p: DateParts) => {
    if (dayDisabled(p)) return;
    const day = dateKey(p);
    if (startDate && endDate && day === dateKey(startDate) && day === dateKey(endDate)) {
      setActive((row) => row === 'start' ? 'end' : 'start');
      return;
    }
    apply(active, p);
    setView({ y: p.y, mo: p.mo });
  };
  const onGridKey = (e: KeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key as 'ArrowLeft']; if (!step) return;
    e.preventDefault();
    const t = new Date(cur.y, cur.mo - 1, cur.d + step);
    const np = { y: t.getFullYear(), mo: t.getMonth() + 1, d: t.getDate() };
    if (dayDisabled(np)) return;
    apply(active, np);
    requestAnimationFrame(() => pop.current?.querySelector<HTMLElement>(`[data-day="${dateKey(np)}"]`)?.focus());
  };

  const fieldEl = (which: Row) => {
    const d = which === 'start' ? txt.sd : txt.ed; const title = which === 'start' ? (!endable && singlePointLabel || 'Start') : 'End';
    const bad = txtErr?.row === which;
    return (
      <div className={cx('wiz-isp-vp__field', active === which && 'is-active', bad && 'is-error')}>
        <input className="wiz-isp-vp__in wiz-isp-vp__in--date" aria-label={`${title} date`} placeholder="MM/DD/YYYY" value={d} autoComplete="off"
          onFocus={() => setActive(which)} onChange={(e) => setTxt((t) => ({ ...t, [which === 'start' ? 'sd' : 'ed']: e.target.value }))} onBlur={() => commitDate(which)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitDate(which); } }} />
        <span className="wiz-isp-vp__div" aria-hidden="true" />
        <TimeInput iso={draft[which] ?? draft.start} label={`${title} time`} onFocusRow={() => setActive(which)} onIso={(iso) => applyIso(which, iso)} />
      </div>
    );
  };

  const has = isValidIso(value.start);
  return (
    <Field label={label} required={required} error={error} size={size} htmlFor={uid} errorId={`${uid}-err`} className={cx('wiz-isp-vp-field', className)}>
      <FieldBox ref={trigger} id={uid} state={open && st === 'default' ? 'focus' : st} className="wiz-isp-vp__box" tabIndex={disabled ? -1 : 0} role="combobox" aria-haspopup="dialog" aria-expanded={open}
        aria-label={rest['aria-label']} aria-invalid={st === 'error' || undefined} aria-describedby={st === 'error' ? `${uid}-err` : undefined} aria-disabled={disabled || undefined}
        onMouseDown={(e) => { if (disabled) return; e.preventDefault(); trigger.current?.focus(); if (open) close(false); else openPop(); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); if (!open) openPop(); } }}>
        <span className={cx('wiz-isp-vp__value', !has && 'is-placeholder')} title={has ? formatRange(value.start, endable ? value.end : null) : undefined}>
          {has ? formatRange(value.start, endable ? value.end : null) : placeholder}
        </span>
        <i className="ri-calendar-line wiz-isp-vp__icon" aria-hidden="true" />
      </FieldBox>
      {open && createPortal(
        <div ref={pop} role="dialog" aria-label="Choose date and time" className="wiz-isp-vp" style={pos ? { top: pos.top, left: pos.left } : { top: 0, left: 0, visibility: 'hidden' }}
          onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } }}>
          <div className="wiz-isp-vp__fields">
            {fieldEl('start')}
            {draft.end && fieldEl('end')}
            {txtErr && <div className="wiz-isp-vp__err" role="alert">{txtErr.msg}</div>}
          </div>
          <div className="wiz-isp-vp__cal">
            <div className="wiz-isp-vp__head">
              <span className="wiz-isp-vp__month">{MONTHS[view.mo - 1]} {view.y}</span>
              <span className="wiz-isp-vp__nav">
                <Button variant="link" size="small" onClick={() => { const n = parseIso(nowIso())!; apply(active, { y: n.y, mo: n.mo, d: n.d, h: n.h, mi: n.mi }); }}>Now</Button>
                <IconButton size="small" icon="ri-arrow-left-s-line" aria-label="Previous month" onClick={() => shift(-1)} />
                <IconButton size="small" icon="ri-arrow-right-s-line" aria-label="Next month" onClick={() => shift(1)} />
              </span>
            </div>
            <div className="wiz-isp-vp__week" aria-hidden="true">{WEEK.map((w) => <span key={w}>{w}</span>)}</div>
            <div className="wiz-isp-vp__grid" role="grid" aria-label={`${MONTHS[view.mo - 1]} ${view.y}`} onKeyDown={onGridKey}>
              {grid.map((p) => {
                const k = dateKey(p); const sel = k === dateKey(cur); const dis = dayDisabled(p);
                return (
                  <button key={k} type="button" role="gridcell" data-day={k} aria-selected={sel} disabled={dis} tabIndex={sel ? 0 : -1}
                    className={cx('wiz-isp-vp__day', !p.inMonth && 'is-out', sel && 'is-on', k === todayKey && 'is-today', inRange(p) && 'is-range', (startDate && k === dateKey(startDate) || endDate && k === dateKey(endDate)) && !sel && 'is-edge')}
                    onClick={() => pickDay(p)}>{p.d}</button>
                );
              })}
            </div>
          </div>
          <div className="wiz-isp-vp__foot">
            {endable && <Switch size="small" label="End time" checked={!!draft.end} onChange={toggleEnd} />}
            {clearable && isValidIso(value.start) && <Button variant="link" size="small" onClick={() => { onChange({ start: '', end: null }); close(); }}>Clear</Button>}
            <span className="wiz-isp-vp__tz" title={tz.name}>{tz.label}</span>
          </div>
        </div>,
        document.body,
      )}
    </Field>
  );
}
