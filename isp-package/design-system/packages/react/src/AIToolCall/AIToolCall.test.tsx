import { fireEvent, render, screen } from '@testing-library/react';
import { AIToolCall } from './AIToolCall';

describe('AIToolCall', () => {
  it('Collapsed 默认：只有头部', () => {
    render(<AIToolCall />);
    expect(screen.getByText('Tool name')).toBeInTheDocument();
    expect(screen.queryByText('Arguments')).toBeNull();
  });
  it('点击展开 Arguments / Result 并可再收起', () => {
    render(<AIToolCall args={['a', 'b']} result={['r']} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Arguments')).toBeInTheDocument();
    expect(screen.getByText('Result')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByText('Arguments')).toBeNull();
  });
  it('Hover 变体为收起 + hover 类', () => {
    const { container } = render(<AIToolCall state="hover" />);
    expect(container.firstChild).toHaveClass('wiz-tool-call--hover');
    expect(screen.queryByText('Arguments')).toBeNull();
  });
  it('受控：state=expanded 展开，点击只回调', () => {
    const on = vi.fn();
    render(<AIToolCall state="expanded" onToggle={on} />);
    fireEvent.click(screen.getByRole('button'));
    expect(on).toHaveBeenCalledWith('collapsed');
    expect(screen.getByText('Arguments')).toBeInTheDocument();
  });
});
