import { fireEvent, render, screen } from '@testing-library/react';
import { MetadataChanges } from './MetadataChanges';

describe('MetadataChanges', () => {
  it('标题带数量；展开显示 children；默认最大高度 200', () => {
    const { container } = render(<MetadataChanges count={4} defaultExpanded><div>list</div></MetadataChanges>);
    expect(screen.getByText('4 Metadata Changes')).toBeInTheDocument();
    expect(screen.getByText('list')).toBeInTheDocument();
    expect(container.querySelector('.wiz-addon__body')).toHaveStyle({ maxHeight: '200px' });
  });
  it('传 onClose 才有关闭按钮', () => {
    const onClose = vi.fn();
    const { rerender } = render(<MetadataChanges count={1} />);
    expect(screen.queryByRole('button', { name: 'Close Metadata Changes' })).toBeNull();
    rerender(<MetadataChanges count={1} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close Metadata Changes' }));
    expect(onClose).toHaveBeenCalled();
  });
});
