import { fireEvent, render, screen } from '@testing-library/react';
import { UserChat } from './UserChat';

describe('UserChat', () => {
  it('Short：只有文字', () => {
    const { container } = render(<UserChat content="Hello，World" />);
    expect(screen.getByText('Hello，World')).toBeInTheDocument();
    expect(container.querySelector('.wiz-user-chat__chip')).toBeNull();
  });
  it('Only File：只有文件，无文字段落', () => {
    const { container } = render(<UserChat files={['DVP Verification.xlsx']} />);
    expect(container.firstChild).toHaveClass('wiz-user-chat--only-file');
    expect(container.querySelector('.wiz-user-chat__text')).toBeNull();
  });
  it('With Files：文件块在文字之前', () => {
    const { container } = render(<UserChat files={['a.xlsx']} content="Please" />);
    const kids = Array.from(container.firstElementChild!.children);
    expect(kids[0]).toHaveClass('wiz-user-chat__chips');
    expect(kids[1]).toHaveClass('wiz-user-chat__text');
  });
  it('标签折叠：显示 4 个 + “+N”，点击回调展开', () => {
    const tags = ['TC-001', 'TC-002', 'TC-003', 'TC-004', 'TC-005', 'TC-006'];
    const on = vi.fn();
    render(<UserChat tags={tags} content="x" onToggleTags={on} />);
    expect(screen.queryByText('TC-005')).toBeNull();
    fireEvent.click(screen.getByText('+2'));
    expect(on).toHaveBeenCalledWith(true);
  });
  it('标签展开：全部显示并出现 Collapse', () => {
    const tags = ['TC-001', 'TC-002', 'TC-003', 'TC-004', 'TC-005'];
    const on = vi.fn();
    render(<UserChat tags={tags} tagsExpanded content="x" onToggleTags={on} />);
    expect(screen.getByText('TC-005')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Collapse'));
    expect(on).toHaveBeenCalledWith(false);
  });
});
