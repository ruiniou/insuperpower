import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ValidityPicker, type Validity } from './ValidityPicker';
import { addMinutes, formatDateTime, parseDateText, parseTimeText, parseIso, stepTime, setSeg } from './dateTime';

function Host({ init, endable = true, onDone }: { init: Validity; endable?: boolean; onDone?: (v: Validity) => void }) {
  const [v, setV] = useState(init);
  return <ValidityPicker aria-label="Validity" value={v} endable={endable} onChange={(x) => { setV(x); onDone?.(x); }} />;
}

describe('dateTime 工具', () => {
  it('格式化：9:00 am, 09/10/2026；12 点与午夜', () => {
    expect(formatDateTime('2026-09-10T09:00')).toBe('9:00 am, 09/10/2026');
    expect(formatDateTime('2026-09-10T12:05')).toBe('12:05 pm, 09/10/2026');
    expect(formatDateTime('2026-09-10T00:30')).toBe('12:30 am, 09/10/2026');
    expect(formatDateTime('bad')).toBe('');
  });
  it('解析日期与时间文本', () => {
    expect(parseDateText('9/1/2026')).toEqual({ y: 2026, mo: 9, d: 1 });
    expect(parseDateText('02/30/2026')).toBeNull();
    expect(parseTimeText('9:05 PM')).toEqual({ h: 21, mi: 5 });
    expect(parseTimeText('12am')).toEqual({ h: 0, mi: 0 });
    expect(parseTimeText('13:05')).toEqual({ h: 13, mi: 5 });
    expect(parseTimeText('13:05 pm')).toBeNull();
    expect(parseIso('2026-02-29T10:00')).toBeNull();
  });
  it('加分钟跨日', () => { expect(addMinutes('2026-12-31T23:30', 60)).toBe('2027-01-01T00:30'); });
  it('分段加减：时 12 小时循环不改 am/pm，分 0–59 循环不进位，am/pm ±12 小时', () => {
    expect(stepTime('2026-09-10T11:00', 'h', 1)).toBe('2026-09-10T00:00');
    expect(stepTime('2026-09-10T23:00', 'h', 1)).toBe('2026-09-10T12:00');
    expect(stepTime('2026-09-10T09:59', 'm', 1)).toBe('2026-09-10T09:00');
    expect(stepTime('2026-09-10T09:00', 'p', 1)).toBe('2026-09-10T21:00');
    expect(setSeg('2026-09-10T15:20', 'h', 12)).toBe('2026-09-10T12:20');
  });
});

describe('ValidityPicker', () => {
  it('触发框：有结束同日写 时间 → 时间, 日期；跨天写全两端；没有结束只写开始', () => {
    const { rerender } = render(<ValidityPicker value={{ start: '2026-09-10T09:00', end: '2026-09-10T10:00' }} onChange={() => {}} endable aria-label="Validity" />);
    expect(screen.getByRole('combobox', { name: 'Validity' })).toHaveTextContent('9:00 am → 10:00 am, 09/10/2026');
    rerender(<ValidityPicker value={{ start: '2026-09-10T09:00', end: '2026-09-12T10:00' }} onChange={() => {}} endable aria-label="Validity" />);
    expect(screen.getByRole('combobox', { name: 'Validity' })).toHaveTextContent('9:00 am, 09/10/2026 → 10:00 am, 09/12/2026');
    rerender(<ValidityPicker value={{ start: '2026-09-10T09:00', end: null }} onChange={() => {}} endable aria-label="Validity" />);
    expect(screen.getByRole('combobox', { name: 'Validity' })).toHaveTextContent(/^9:00 am, 09\/10\/2026$/);
  });
  it('开启 End time 立即写回；改结束时间的「时」即生效；关闭 End time 变回 No end', () => {
    const onDone = vi.fn();
    render(<Host init={{ start: '2026-09-10T09:00', end: null }} onDone={onDone} />);
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Validity' }));
    fireEvent.click(screen.getByRole('switch', { name: 'End time' }));
    expect(onDone).toHaveBeenLastCalledWith({ start: '2026-09-10T09:00', end: '2026-09-10T10:00' });
    fireEvent.keyDown(screen.getByLabelText('End time', { selector: 'input' }), { key: 'ArrowUp' });
    expect(onDone).toHaveBeenLastCalledWith({ start: '2026-09-10T09:00', end: '2026-09-10T11:00' });
    fireEvent.click(screen.getByRole('switch', { name: 'End time' }));
    expect(onDone).toHaveBeenLastCalledWith({ start: '2026-09-10T09:00', end: null });
  });
  it('End 可选为同一天，之后反复点击该日切换编辑端点并保留值和日历焦点', () => {
    const onDone = vi.fn();
    render(<Host init={{ start: '2026-09-10T09:00', end: '2026-09-12T10:00' }} onDone={onDone} />);
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Validity' }));
    const start = screen.getByLabelText('Start date');
    const end = screen.getByLabelText('End date');
    const day = screen.getAllByRole('gridcell').find((cell) => cell.getAttribute('data-day') === '2026-09-10')!;
    fireEvent.focus(end);
    day.focus();
    fireEvent.click(day);
    expect(onDone).toHaveBeenCalledWith({ start: '2026-09-10T09:00', end: '2026-09-10T10:00' });
    expect(end.parentElement).toHaveClass('is-active');
    fireEvent.click(day);
    expect(start.parentElement).toHaveClass('is-active');
    fireEvent.click(day);
    expect(end.parentElement).toHaveClass('is-active');
    expect(day).toHaveFocus();
    expect(onDone).toHaveBeenCalledTimes(1);
  });
  it('分段输入：← → 换段，↑ ↓ 调整当前段，数字覆盖，a / p 切换', () => {
    const onDone = vi.fn();
    render(<Host init={{ start: '2026-09-10T09:00', end: null }} endable={false} onDone={onDone} />);
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Validity' }));
    const t = screen.getByLabelText('Start time', { selector: 'input' });
    fireEvent.keyDown(t, { key: 'ArrowDown' });                       // 时 9 → 8
    expect(onDone).toHaveBeenLastCalledWith({ start: '2026-09-10T08:00', end: null });
    fireEvent.keyDown(t, { key: 'ArrowRight' }); fireEvent.keyDown(t, { key: 'ArrowUp' }); // 分 +1
    expect(onDone).toHaveBeenLastCalledWith({ start: '2026-09-10T08:01', end: null });
    fireEvent.keyDown(t, { key: '4' }); fireEvent.keyDown(t, { key: '5' }); // 分 45，自动跳到 am/pm
    expect(onDone).toHaveBeenLastCalledWith({ start: '2026-09-10T08:45', end: null });
    fireEvent.keyDown(t, { key: 'p' });
    expect(onDone).toHaveBeenLastCalledWith({ start: '2026-09-10T20:45', end: null });
    fireEvent.keyDown(t, { key: 'ArrowLeft' }); fireEvent.keyDown(t, { key: 'ArrowLeft' }); // 回到「时」
    fireEvent.keyDown(t, { key: '1' }); fireEvent.keyDown(t, { key: '1' });
    expect(onDone).toHaveBeenLastCalledWith({ start: '2026-09-10T23:45', end: null });
    fireEvent.paste(t, { clipboardData: { getData: () => '6:30 am' } });
    expect(onDone).toHaveBeenLastCalledWith({ start: '2026-09-10T06:30', end: null });
  });
  it('结束不晚于开始：不写回并提示；开始挪到结束之后，结束保持时长一起后移', () => {
    const onDone = vi.fn();
    render(<Host init={{ start: '2026-09-10T09:00', end: '2026-09-10T10:00' }} onDone={onDone} />);
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Validity' }));
    fireEvent.keyDown(screen.getByLabelText('End time', { selector: 'input' }), { key: 'ArrowDown' }); // 结束 9:00 = 开始
    expect(screen.getByRole('alert')).toHaveTextContent('End time must be after start time.');
    expect(onDone).not.toHaveBeenCalled();
    const s = screen.getByLabelText('Start time', { selector: 'input' });
    fireEvent.keyDown(s, { key: 'ArrowUp' });                       // 开始 10:00 ≥ 结束 10:00 → 结束 11:00
    expect(onDone).toHaveBeenLastCalledWith({ start: '2026-09-10T10:00', end: '2026-09-10T11:00' });
  });
  it('点日历日期；日期格式错误提示；打开后不动直接关闭不写回；Esc 关闭', () => {
    const onDone = vi.fn();
    render(<Host init={{ start: '2026-09-10T09:00', end: null }} endable={false} onDone={onDone} />);
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Validity' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onDone).not.toHaveBeenCalled();
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Validity' }));
    fireEvent.click(screen.getAllByRole('gridcell').find((c) => c.getAttribute('data-day') === '2026-09-15')!);
    expect(onDone).toHaveBeenLastCalledWith({ start: '2026-09-15T09:00', end: null });
    const d = screen.getByLabelText('Start date');
    fireEvent.change(d, { target: { value: '13/45/2026' } }); fireEvent.blur(d);
    expect(screen.getByRole('alert')).toHaveTextContent('MM/DD/YYYY');
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('ValidityPicker 空值', () => {
  it('空值打开后不动直接关闭，不写入', () => {
    const onChange = vi.fn();
    render(<ValidityPicker aria-label="V" value={{ start: '', end: null }} onChange={onChange} endable />);
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'V' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('ValidityPicker clearable', () => {
  it('有值时出现 Clear，点击写回空值并关闭；无值时不出现', () => {
    const done = vi.fn();
    function H() { const [v, setV] = useState<Validity>({ start: '2026-09-10T09:00', end: null }); return <ValidityPicker aria-label="Time range" clearable endable value={v} onChange={(x) => { setV(x); done(x); }} placeholder="Time range" />; }
    render(<H />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(done).toHaveBeenLastCalledWith({ start: '', end: null });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('combobox').textContent).toContain('Time range');
    fireEvent.mouseDown(screen.getByRole('combobox'));
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  });
});
