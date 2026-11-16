import { fireEvent, render, screen } from '@testing-library/react';
import { AIAttachmentThumbnail } from './AIAttachmentThumbnail';

describe('AIAttachmentThumbnail', () => {
  it('default：无遮罩，有序号', () => {
    const { container } = render(<AIAttachmentThumbnail order={2} name="a.png" />);
    expect(container.querySelector('.wiz-attach-thumb__overlay')).toBeNull();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
  it('uploading：遮罩与转圈，不显示序号', () => {
    const { container } = render(<AIAttachmentThumbnail state="uploading" order={1} />);
    expect(container.querySelector('.wiz-attach-thumb__overlay')).not.toBeNull();
    expect(container.querySelector('.ri-loader-4-line')).not.toBeNull();
    expect(screen.queryByText('1')).toBeNull();
  });
  it('点击预览与移除', () => {
    const onPreview = vi.fn(); const onRemove = vi.fn();
    render(<AIAttachmentThumbnail name="a.png" onPreview={onPreview} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: 'Preview a.png' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove a.png' }));
    expect(onPreview).toHaveBeenCalled(); expect(onRemove).toHaveBeenCalled();
  });
  it('hover 强制态有 class', () => {
    const { container } = render(<AIAttachmentThumbnail state="hover" />);
    expect(container.firstChild).toHaveClass('wiz-attach-thumb--hover');
  });
});
