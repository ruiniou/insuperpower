import { fireEvent, render, screen } from '@testing-library/react';
import { OutlineFilter, OutlineGroup, OutlineRow, outlineMark } from './Outline';

describe('outlineMark 优先级', () => {
  it('locked > warn > edited > done > 空', () => {
    expect(outlineMark({ locked: true, warn: true, edited: true, done: true })).toBe('locked');
    expect(outlineMark({ warn: true, edited: true, done: true })).toBe('warn');
    expect(outlineMark({ edited: true, done: true })).toBe('edited');
    expect(outlineMark({ done: true })).toBe('done');
    expect(outlineMark({})).toBeNull();
  });
});

describe('OutlineRow', () => {
  it('类型图标在标题前；状态位只显示一个并带文字', () => {
    render(<OutlineRow kind="table" no="14.1.3.1" title="Summary" mark="done" markLabel="Reviewed" />);
    const row = screen.getByRole('button');
    expect(row.firstElementChild).toHaveAttribute('aria-label', 'Table');
    expect(screen.getAllByRole('img', { name: /Reviewed/ })).toHaveLength(1);
    expect(row).toHaveTextContent('14.1.3.1 Summary');
  });
  it('active 带 aria-current；disabled 为 aria-disabled 且不触发点击', () => {
    const onClick = vi.fn();
    const { rerender } = render(<OutlineRow kind="listing" no="16.2.3.1" title="L" active onClick={onClick} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'true');
    rerender(<OutlineRow kind="listing" no="16.2.3.1" title="L" disabled onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    expect(onClick).not.toHaveBeenCalled();
  });
  it('黄点必须带文字说明', () => {
    render(<OutlineRow kind="table" no="1" title="t" mark="warn" markLabel="No source text" />);
    expect(screen.getByRole('img', { name: 'No source text' })).toBeInTheDocument();
  });
});

describe('OutlineGroup', () => {
  it('显示 已完成/总数；全部完成换对勾；点击切换展开', () => {
    const onToggle = vi.fn();
    const { rerender } = render(<OutlineGroup no="4.2.3" title="Demographics" done={1} total={4} open onToggle={onToggle}><span>child</span></OutlineGroup>);
    expect(screen.getByText('1/4')).toBeInTheDocument();
    expect(screen.getByText('child')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { expanded: true }));
    expect(onToggle).toHaveBeenCalled();
    rerender(<OutlineGroup no="4.2.3" title="Demographics" done={4} total={4} open={false} onToggle={onToggle}><span>child</span></OutlineGroup>);
    expect(screen.queryByText('child')).toBeNull();
    expect(screen.queryByText('4/4')).toBeNull();
    expect(screen.getByRole('img', { name: 'All done' })).toBeInTheDocument();
  });
});

describe('OutlineFilter', () => {
  const options = [{ value: 'all', label: 'All', count: 15 }, { value: 'todo', label: 'Unreviewed', count: 11 }];
  it('菜单项带计数，选中后回调；有筛选时可清除', () => {
    const onChange = vi.fn();
    const { rerender } = render(<OutlineFilter options={options} value="all" onChange={onChange} />);
    expect(screen.queryByRole('button', { name: 'Clear filter' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
    expect(screen.getByRole('menuitem', { name: /Unreviewed/ })).toHaveTextContent('11');
    fireEvent.click(screen.getByRole('menuitem', { name: /Unreviewed/ }));
    expect(onChange).toHaveBeenCalledWith('todo');
    rerender(<OutlineFilter options={options} value="todo" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear filter' }));
    expect(onChange).toHaveBeenLastCalledWith('all');
    expect(screen.getByRole('button', { name: 'Filter: Unreviewed' })).toBeInTheDocument();
  });
});
