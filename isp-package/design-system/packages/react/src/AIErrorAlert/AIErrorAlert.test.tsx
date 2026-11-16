import { fireEvent, render, screen } from '@testing-library/react';
import { AIErrorAlert } from './AIErrorAlert';

describe('AIErrorAlert', () => {
  it('Collapsed：标题 + Show Details，详情不显示', () => {
    render(<AIErrorAlert title="Boom" details="stack" />);
    expect(screen.getByText('Error: Boom')).toBeInTheDocument();
    expect(screen.getByText('Show Details')).toBeInTheDocument();
    expect(screen.queryByText('stack')).toBeNull();
  });
  it('点击展开：显示详情与 Hide Details', () => {
    render(<AIErrorAlert details="stack" />);
    fireEvent.click(screen.getByText('Show Details'));
    expect(screen.getByText('stack')).toBeInTheDocument();
    expect(screen.getByText('Hide Details')).toBeInTheDocument();
  });
  it('受控 expanded', () => {
    const on = vi.fn();
    render(<AIErrorAlert state="expanded" details="d" onToggle={on} />);
    fireEvent.click(screen.getByText('Hide Details'));
    expect(on).toHaveBeenCalledWith('collapsed');
    expect(screen.getByText('d')).toBeInTheDocument();
  });
  it('Retry 仅在传 onRetry 时出现', () => {
    const on = vi.fn();
    const { rerender } = render(<AIErrorAlert />);
    expect(screen.queryByText('Retry')).toBeNull();
    rerender(<AIErrorAlert onRetry={on} />);
    fireEvent.click(screen.getByText('Retry'));
    expect(on).toHaveBeenCalled();
  });
  it('无 details 不显示 toggle', () => {
    render(<AIErrorAlert />);
    expect(screen.queryByText('Show Details')).toBeNull();
  });
});
