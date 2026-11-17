import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemberSelect } from './MemberSelect';

const OPTS = [{ value: 'a', name: 'Li Wei' }, { value: 'b', name: 'Chen Yu' }, { value: 'c', name: 'Zhao Min', disabled: true }];

describe('MemberSelect', () => {
  it('显示当前成员，点击展开，选择后回调 (value, option) 并收起', () => {
    const onChange = vi.fn();
    render(<MemberSelect aria-label="Event Owner" options={OPTS} defaultValue="a" onChange={onChange} />);
    const t = screen.getByRole('button', { name: 'Event Owner' });
    expect(t).toHaveTextContent('Li Wei');
    fireEvent.click(t);
    expect(t).toHaveAttribute('aria-expanded', 'true');
    fireEvent.mouseDown(screen.getByRole('option', { name: /Chen Yu/ }));
    expect(onChange).toHaveBeenCalledWith('b', OPTS[1]);
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(t).toHaveTextContent('Chen Yu');
  });
  it('搜索过滤；无匹配显示提示', () => {
    render(<MemberSelect aria-label="Owner" options={OPTS} />);
    fireEvent.click(screen.getByRole('button', { name: 'Owner' }));
    fireEvent.change(screen.getByPlaceholderText('Search people'), { target: { value: 'chen' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    fireEvent.change(screen.getByPlaceholderText('Search people'), { target: { value: 'zzz' } });
    expect(screen.getByText('No matches')).toBeInTheDocument();
  });
  it('键盘：方向键移动并跳过禁用项，Enter 选中，Esc 关闭', () => {
    const onChange = vi.fn();
    render(<MemberSelect aria-label="Owner" options={OPTS} onChange={onChange} />);
    const t = screen.getByRole('button', { name: 'Owner' });
    fireEvent.keyDown(t, { key: 'ArrowDown' });
    const input = screen.getByPlaceholderText('Search people');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // 跳过 disabled 的 Zhao Min，回到 Li Wei
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('a', OPTS[0]);
    fireEvent.click(t);
    fireEvent.keyDown(screen.getByPlaceholderText('Search people'), { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });
  it('禁用时不能展开；有 label 与 error 时走 Field', () => {
    render(<MemberSelect label="Owner" error="Required" options={OPTS} disabled />);
    const t = screen.getByRole('button', { name: /Owner/ });
    expect(t).toBeDisabled();
    expect(screen.getByText('Required')).toBeInTheDocument();
    fireEvent.click(t);
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
