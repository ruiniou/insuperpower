import { fireEvent, render, screen } from '@testing-library/react';
import { Search } from './Search';

describe('Search', () => {
  it('collapsible：先是图标，点击展开并聚焦，失焦且为空收起', () => {
    render(<Search collapsible aria-label="Find" />);
    expect(screen.queryByRole('searchbox')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Find' }));
    const input = screen.getByRole('searchbox');
    expect(input).toHaveFocus();
    fireEvent.blur(input);
    expect(screen.queryByRole('searchbox')).toBeNull();
  });
  it('有内容时失焦不收起；受控 value 非空直接展开', () => {
    const { rerender } = render(<Search collapsible aria-label="Find" defaultExpanded />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'x' } });
    fireEvent.blur(input);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    rerender(<Search collapsible aria-label="Find" value="abc" onChange={() => {}} />);
    expect(screen.getByRole('searchbox')).toHaveValue('abc');
  });
  it('非 collapsible 行为不变；compact 加类', () => {
    const fn = vi.fn();
    const { container } = render(<Search size="compact" onSearch={fn} />);
    expect(container.firstChild).toHaveClass('wiz-search--compact');
    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Enter' });
    expect(fn).toHaveBeenCalled();
  });
});
