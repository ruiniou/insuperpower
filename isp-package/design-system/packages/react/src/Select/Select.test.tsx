import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Select } from './Select';
import { MultiSelect } from '../MultiSelect/MultiSelect';

const OPTS = ['Apple', { value: 'b', label: 'Banana' }, { value: 'c', label: 'Cherry', disabled: true }];

describe('Select', () => {
  it('点击展开、选择、回调 (value, option)', () => {
    const onChange = vi.fn();
    render(<Select label="Fruit" options={OPTS} onChange={onChange} />);
    const box = screen.getByRole('combobox');
    expect(box).toHaveAttribute('aria-expanded', 'false');
    fireEvent.mouseDown(box);
    expect(box).toHaveAttribute('aria-expanded', 'true');
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Banana' }));
    expect(onChange).toHaveBeenCalledWith('b', { value: 'b', label: 'Banana', disabled: undefined });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(box).toHaveTextContent('Banana');
  });
  it('键盘：ArrowDown 打开，Enter 选中，Esc 关闭，禁用项跳过', () => {
    const onChange = vi.fn();
    render(<Select options={OPTS} onChange={onChange} />);
    const box = screen.getByRole('combobox');
    box.focus();
    fireEvent.keyDown(box, { key: 'ArrowDown' });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(box, { key: 'ArrowDown' });
    fireEvent.keyDown(box, { key: 'ArrowDown' }); // 跳过 disabled 的 Cherry，回到 Apple
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(onChange.mock.calls[0][0]).toBe('Apple');
    fireEvent.keyDown(box, { key: 'ArrowDown' });
    fireEvent.keyDown(box, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });
  it('受控 value', () => {
    render(<Select options={OPTS} value="b" />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Banana');
  });
  it('disabled 不展开', () => {
    render(<Select options={OPTS} disabled />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    expect(screen.queryByRole('listbox')).toBeNull();
  });
  it('searchable 过滤', () => {
    render(<Select options={OPTS} searchable />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'ban' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });
});

describe('MultiSelect', () => {
  it('多选、Chip 移除、onChange 数组', () => {
    const onChange = vi.fn();
    render(<MultiSelect options={OPTS} defaultValue={['Apple']} onChange={onChange} />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Banana' }));
    expect(onChange).toHaveBeenLastCalledWith(['Apple', 'b']);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Apple' }));
    expect(onChange).toHaveBeenLastCalledWith(['b']);
  });
});
