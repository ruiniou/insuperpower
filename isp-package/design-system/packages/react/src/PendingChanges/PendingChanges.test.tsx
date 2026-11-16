import { fireEvent, render, screen } from '@testing-library/react';
import { PendingChanges } from './PendingChanges';

const items = [{ label: 'Lines 3-5' }, { label: 'Line 9' }];
describe('PendingChanges', () => {
  it('标题带数量；Reject / Accept 回调且不展开', () => {
    const onReject = vi.fn(); const onAccept = vi.fn();
    render(<PendingChanges items={items} onReject={onReject} onAccept={onAccept} />);
    expect(screen.getByText('2 Pending Changes')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    expect(onReject).toHaveBeenCalled(); expect(onAccept).toHaveBeenCalled();
    expect(screen.queryByText('Lines 3-5')).toBeNull();
  });
  it('展开后列表可点击定位；默认最大高度 140', () => {
    const onLocate = vi.fn();
    const { container } = render(<PendingChanges items={items} defaultExpanded onLocate={onLocate} />);
    fireEvent.click(screen.getByText('Line 9'));
    expect(onLocate).toHaveBeenCalledWith(items[1], 1);
    expect(container.querySelector('.wiz-addon__body')).toHaveStyle({ maxHeight: '140px' });
  });
});
