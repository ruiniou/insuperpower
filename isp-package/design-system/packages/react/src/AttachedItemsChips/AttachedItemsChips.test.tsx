import { fireEvent, render, screen } from '@testing-library/react';
import { AttachedItemsChips } from './AttachedItemsChips';

describe('AttachedItemsChips', () => {
  it('默认显示文件名与图标，关闭回调', () => {
    const onRemove = vi.fn();
    const { container } = render(<AttachedItemsChips itemName="a.jpg" onRemove={onRemove} />);
    expect(screen.getByText('a.jpg')).toBeInTheDocument();
    expect(container.querySelector('.ri-file-image-fill')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Remove a.jpg' }));
    expect(onRemove).toHaveBeenCalled();
  });
  it('showIcon=false 隐藏图标；hover 有 class', () => {
    const { container } = render(<AttachedItemsChips showIcon={false} status="hover" />);
    expect(container.querySelector('.wiz-chip__icon')).toBeNull();
    expect(container.firstChild).toHaveClass('is-hover');
  });
});
